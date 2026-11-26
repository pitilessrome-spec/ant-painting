'use strict';
const SCHEMA="CREATE SCHEMA IF NOT EXISTS game_ops;\nCREATE TABLE IF NOT EXISTS game_ops.users(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,account_code text UNIQUE NOT NULL CHECK(account_code ~ '^[A-Za-z0-9_-]{3,64}$'),display_name text NOT NULL CHECK(length(display_name) BETWEEN 1 AND 80),created_at timestamptz NOT NULL DEFAULT now());\nCREATE TABLE IF NOT EXISTS game_ops.agents(user_id bigint PRIMARY KEY REFERENCES game_ops.users(id),active boolean NOT NULL,updated_at timestamptz NOT NULL DEFAULT now());\nCREATE TABLE IF NOT EXISTS game_ops.audit(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,user_id bigint NOT NULL REFERENCES game_ops.users(id),action text NOT NULL CHECK(action IN ('create_user','grant_agent','revoke_agent')),created_at timestamptz NOT NULL DEFAULT now());";
function valid(b){if(!b||typeof b!=='object')return false;if(b.action==='create')return typeof b.code==='string'&&/^[A-Za-z0-9_-]{3,64}$/.test(b.code)&&typeof b.name==='string'&&b.name.trim().length>0&&b.name.length<=80;if(b.action==='agent')return typeof b.id==='string'&&/^[1-9][0-9]{0,17}$/.test(b.id)&&typeof b.active==='boolean';return false}
async function handle(req,res,{json,authorized,connection}){
 const key=process.env.ANT_ADMIN_KEY;
 if(!key||key.length<32)return json(res,503,{error:'Administrator access is not configured'});
 if(!authorized(req.headers.authorization,key))return json(res,401,{error:'Invalid administrator credentials'});
 if(!process.env.DATABASE_URL)return json(res,503,{error:'Database is not configured'});
 if(!['GET','POST'].includes(req.method))return json(res,405,{error:'Method not allowed'});
 if(req.method==='POST'&&!valid(req.body))return json(res,400,{error:'Invalid input'});
 let c;try{c=await connection().connect();await c.query('BEGIN');await c.query('SELECT pg_advisory_xact_lock(923175401)');await c.query(SCHEMA);
 if(req.method==='POST'){const b=req.body;if(b.action==='create'){const r=await c.query('INSERT INTO game_ops.users(account_code,display_name) VALUES($1,$2) RETURNING id',[b.code,b.name.trim()]);await c.query("INSERT INTO game_ops.audit(user_id,action) VALUES($1,'create_user')",[r.rows[0].id]);}else{const r=await c.query('SELECT id FROM game_ops.users WHERE id=$1 FOR UPDATE',[b.id]);if(!r.rowCount){await c.query('ROLLBACK');return json(res,404,{error:'用户不存在'})}await c.query('INSERT INTO game_ops.agents(user_id,active) VALUES($1,$2) ON CONFLICT(user_id) DO UPDATE SET active=EXCLUDED.active,updated_at=now()',[b.id,b.active]);await c.query('INSERT INTO game_ops.audit(user_id,action) VALUES($1,$2)',[b.id,b.active?'grant_agent':'revoke_agent']);}}
 const r=await c.query('SELECT u.id::text,u.account_code,u.display_name,COALESCE(a.active,false) AS agent FROM game_ops.users u LEFT JOIN game_ops.agents a ON a.user_id=u.id ORDER BY u.id DESC LIMIT 200');
 await c.query('COMMIT');return json(res,200,{users:r.rows});
 }catch(e){if(c)await c.query('ROLLBACK').catch(()=>{});return json(res,e.code==='23505'?409:503,{error:e.code==='23505'?'账号编号已存在':'运营数据库暂不可用'})}finally{if(c)c.release()}
}
module.exports={handle,valid,SCHEMA};