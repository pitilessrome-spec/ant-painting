'use strict';
const {randomBytes,createHash,scrypt,timingSafeEqual}=require('node:crypto'),{promisify}=require('node:util');
const derive=promisify(scrypt),{SCHEMA:BASE}=require('./game-ops');
const SCHEMA="CREATE TABLE IF NOT EXISTS game_ops.customer_credentials(user_id bigint PRIMARY KEY REFERENCES game_ops.users(id),salt text NOT NULL,password_hash text NOT NULL,failed int NOT NULL DEFAULT 0,locked_until timestamptz);\nCREATE TABLE IF NOT EXISTS game_ops.customer_sessions(token_hash text PRIMARY KEY,user_id bigint NOT NULL REFERENCES game_ops.users(id),expires_at timestamptz NOT NULL);\nCREATE TABLE IF NOT EXISTS game_ops.license_requests(id uuid PRIMARY KEY,user_id bigint NOT NULL REFERENCES game_ops.users(id),game_id text NOT NULL CHECK(game_id IN ('ant-canvas','boulder-rush','slot-legion')),quote_fen integer NOT NULL CHECK(quote_fen=300000),status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','reviewed','cancelled')),created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());\nCREATE UNIQUE INDEX IF NOT EXISTS license_one_open_idx ON game_ops.license_requests(user_id,game_id) WHERE status IN ('draft','reviewed');\nCREATE TABLE IF NOT EXISTS game_ops.license_audit(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,user_id bigint NOT NULL REFERENCES game_ops.users(id),action text NOT NULL CHECK(action IN ('credential_reset','draft_created','reviewed','cancelled')),request_id uuid REFERENCES game_ops.license_requests(id),created_at timestamptz NOT NULL DEFAULT now());";
const catalog=Object.freeze([
{id:'ant-canvas',name:'蚂蚁画布 ANT CANVAS',quoteFen:300000,url:'https://pitilessrome-spec.github.io/ant-painting/'},
{id:'boulder-rush',name:'巨石狂潮 Boulder Rush',quoteFen:300000,url:'https://boulder-rush-ten.vercel.app/'},
{id:'slot-legion',name:'拉杆军团 Slot Legion',quoteFen:300000,url:'https://slot-legion.vercel.app/'}]);
const digest=s=>createHash('sha256').update(s).digest('hex');
const isId=s=>typeof s==='string'&&/^[1-9][0-9]{0,17}$/.test(s);
const isUuid=s=>typeof s==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
const validPass=s=>typeof s==='string'&&s.length>=12&&s.length<=128;
const game=id=>catalog.find(g=>g.id===id);
async function handle(req,res,{json,authorized,connection,path}){
 const send=(s,d)=>json(res,s,d);
 const admin=path==='admin/license-orders';
 if(admin){const k=process.env.ANT_ADMIN_KEY;if(!k||k.length<32)return send(503,{error:'管理员未配置'});if(!authorized(req.headers.authorization,k))return send(401,{error:'管理员认证失败'});}
 if(!process.env.DATABASE_URL)return send(503,{error:'数据库未配置'});
 if(!['GET','POST'].includes(req.method))return send(405,{error:'Method not allowed'});
 if(!admin&&path==='partner/login'&&req.method!=='POST')return send(405,{error:'Method not allowed'});
 if(!admin&&path==='partner/logout'&&req.method!=='POST')return send(405,{error:'Method not allowed'});
 const b=req.body||{};
 if(!admin&&path==='partner/login'&&(!validPass(b.password)||typeof b.code!=='string'||! /^[A-Za-z0-9_-]{3,64}$/.test(b.code)))return send(400,{error:'账号或密码格式不正确'});
 if(!admin&&path!=='partner/login'&&!/^Bearer [a-f0-9]{64}$/.test(req.headers.authorization||''))return send(401,{error:'请登录'});
 if(admin&&req.method==='POST'&&!((b.action==='reset_password'&&isId(b.userId)&&validPass(b.password))||(['reviewed','cancelled'].includes(b.action)&&isUuid(b.id))))return send(400,{error:'参数错误'});
 if(!admin&&path==='partner/orders'&&req.method==='POST'&&(!isUuid(b.id)||!game(b.gameId)))return send(400,{error:'参数错误'});
 let c;try{
 c=await connection().connect();await c.query('BEGIN');await c.query('SELECT pg_advisory_xact_lock(923175401)');await c.query(BASE);await c.query(SCHEMA);if(admin)await c.query(require('./operations-reports').SCHEMA);await c.query('COMMIT');await c.query('BEGIN');
 if(admin){
 if(req.method==='POST'){
 if(b.action==='reset_password'){const r=await c.query('SELECT id FROM game_ops.users WHERE id=$1 FOR UPDATE',[b.userId]);if(!r.rowCount){await c.query('ROLLBACK');return send(404,{error:'账号不存在'})}const salt=randomBytes(16).toString('hex'),hash=(await derive(b.password,salt,64)).toString('hex');await c.query('INSERT INTO game_ops.customer_credentials(user_id,salt,password_hash) VALUES($1,$2,$3) ON CONFLICT(user_id) DO UPDATE SET salt=EXCLUDED.salt,password_hash=EXCLUDED.password_hash,failed=0,locked_until=NULL',[b.userId,salt,hash]);await c.query('DELETE FROM game_ops.customer_sessions WHERE user_id=$1',[b.userId]);await c.query("INSERT INTO game_ops.license_audit(user_id,action) VALUES($1,'credential_reset')",[b.userId]);}
 else{if(b.action==='cancelled'){await c.query('SELECT id FROM game_ops.license_requests WHERE id=$1 FOR UPDATE',[b.id]);const active=await c.query("SELECT id FROM game_ops.service_contracts WHERE request_id=$1 AND status='active'",[b.id]);if(active.rowCount){await c.query('ROLLBACK');return send(409,{error:'请先结束现有服务合同'})}}const r=await c.query("UPDATE game_ops.license_requests SET status=$2,updated_at=now() WHERE id=$1 AND (status='draft' OR (status='reviewed' AND $2='cancelled')) RETURNING user_id",[b.id,b.action]);if(!r.rowCount){await c.query('ROLLBACK');return send(409,{error:'申请状态已变化或不存在'})}await c.query('INSERT INTO game_ops.license_audit(user_id,action,request_id) VALUES($1,$2,$3)',[r.rows[0].user_id,b.action,b.id]);}
 }
 const r=await c.query('SELECT o.id,o.user_id::text,u.account_code,u.display_name,o.game_id,o.quote_fen,o.status,o.created_at FROM game_ops.license_requests o JOIN game_ops.users u ON u.id=o.user_id ORDER BY o.created_at DESC LIMIT 200');await c.query('COMMIT');return send(200,{orders:r.rows,catalog});
 }
 if(path==='partner/login'){
 const r=await c.query('SELECT u.id::text,u.display_name,k.salt,k.password_hash,k.failed,k.locked_until FROM game_ops.users u JOIN game_ops.customer_credentials k ON k.user_id=u.id WHERE u.account_code=$1 FOR UPDATE OF k',[b.code]);const u=r.rows[0];const locked=u?.locked_until&&new Date(u.locked_until)>new Date();
 // Equal-cost dummy hash for unknown accounts; existing accounts are locked after repeated failures.
 const actual=await derive(b.password,u?.salt||'0'.repeat(32),64);const expected=Buffer.from(u?.password_hash||'0'.repeat(128),'hex');const ok=!!u&&!locked&&expected.length===actual.length&&timingSafeEqual(expected,actual);
 if(!ok){if(u&&!locked)await c.query("UPDATE game_ops.customer_credentials SET failed=CASE WHEN locked_until<=now() THEN 1 ELSE failed+1 END,locked_until=CASE WHEN locked_until<=now() THEN NULL WHEN failed+1>=5 THEN now()+interval '15 minutes' ELSE NULL END WHERE user_id=$1",[u.id]);await c.query('COMMIT');return send(401,{error:'账号或密码错误，或账号暂时锁定'});}
 await c.query('UPDATE game_ops.customer_credentials SET failed=0,locked_until=NULL WHERE user_id=$1',[u.id]);await c.query('DELETE FROM game_ops.customer_sessions WHERE user_id=$1 OR expires_at<=now()',[u.id]);const token=randomBytes(32).toString('hex');await c.query("INSERT INTO game_ops.customer_sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '8 hours')",[digest(token),u.id]);await c.query('COMMIT');return send(200,{token,displayName:u.display_name});
 }
 const hash=digest(req.headers.authorization.slice(7));const s=await c.query('SELECT user_id::text FROM game_ops.customer_sessions WHERE token_hash=$1 AND expires_at>now() FOR UPDATE',[hash]);if(!s.rowCount){await c.query('ROLLBACK');return send(401,{error:'登录已过期'})}const uid=s.rows[0].user_id;
 if(path==='partner/logout'){await c.query('DELETE FROM game_ops.customer_sessions WHERE token_hash=$1',[hash]);await c.query('COMMIT');return send(200,{ok:true})}
 if(req.method==='POST'){const r=await c.query('INSERT INTO game_ops.license_requests(id,user_id,game_id,quote_fen) VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING RETURNING id',[b.id,uid,b.gameId,game(b.gameId).quoteFen]);if(r.rowCount)await c.query("INSERT INTO game_ops.license_audit(user_id,action,request_id) VALUES($1,'draft_created',$2)",[uid,b.id]);}
 const r=await c.query('SELECT id,game_id,quote_fen,status,created_at FROM game_ops.license_requests WHERE user_id=$1 ORDER BY created_at DESC LIMIT 200',[uid]);await c.query('COMMIT');return send(200,{orders:r.rows,catalog});
 }catch(e){if(c)await c.query('ROLLBACK').catch(()=>{});return send(503,{error:'运营数据库暂不可用'})}finally{if(c)c.release()}
}
module.exports={handle,catalog,validPass,isUuid,SCHEMA};