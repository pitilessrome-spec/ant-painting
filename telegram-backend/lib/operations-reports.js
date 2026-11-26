'use strict';
const {createHash}=require('node:crypto'),{SCHEMA:BASE}=require('./game-ops'),{SCHEMA:LICENSE,catalog,isUuid}=require('./license-orders');
const SCHEMA="CREATE TABLE IF NOT EXISTS game_ops.service_contracts(\n id uuid PRIMARY KEY, request_id uuid UNIQUE NOT NULL REFERENCES game_ops.license_requests(id),\n reference text UNIQUE NOT NULL CHECK(length(reference) BETWEEN 3 AND 120),\n scope text NOT NULL CHECK(length(scope) BETWEEN 10 AND 1000),\n start_date date NOT NULL, end_date date NOT NULL CHECK(end_date>=start_date),\n status text NOT NULL CHECK(status IN ('active','ended')), created_at timestamptz NOT NULL DEFAULT now(), ended_at timestamptz);\nCREATE TABLE IF NOT EXISTS game_ops.ad_daily(\n game_id text NOT NULL CHECK(game_id IN ('ant-canvas','boulder-rush','slot-legion')),\n channel text NOT NULL CHECK(channel IN ('telegram','wechat','douyin','tiktok','crazygames','gamedistribution')),\n day date NOT NULL, currency text NOT NULL CHECK(currency IN ('CNY','USD','USDT','EUR')),\n estimated numeric(20,8) NOT NULL CHECK(estimated>=0),\n confirmed numeric(20,8) CHECK(confirmed>=0), received numeric(20,8) CHECK(received>=0),\n source_ref text NOT NULL CHECK(length(source_ref) BETWEEN 3 AND 240),\n revision int NOT NULL CHECK(revision>0), updated_at timestamptz NOT NULL DEFAULT now(),\n PRIMARY KEY(game_id,channel,day,currency));\nCREATE TABLE IF NOT EXISTS game_ops.ad_daily_revisions(\n id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, game_id text NOT NULL, channel text NOT NULL, day date NOT NULL, currency text NOT NULL,\n revision int NOT NULL, estimated numeric(20,8) NOT NULL, confirmed numeric(20,8), received numeric(20,8), source_ref text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),\n UNIQUE(game_id,channel,day,currency,revision));\nCREATE TABLE IF NOT EXISTS game_ops.service_audit(\n id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, contract_id uuid NOT NULL REFERENCES game_ops.service_contracts(id),\n action text NOT NULL CHECK(action IN ('record_contract','end_contract')), created_at timestamptz NOT NULL DEFAULT now());";
const channels=['telegram','wechat','douyin','tiktok','crazygames','gamedistribution'],currencies=['CNY','USD','USDT','EUR'];
const date=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&s>='2020-01-01'&&s<='2100-12-31'&&!Number.isNaN(Date.parse(s))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
const money=s=>typeof s==='string'&&/^(0|[1-9]\d{0,11})(\.\d{1,8})?$/.test(s);
const optionalMoney=s=>s===null||money(s);
const str=(s,min,max)=>typeof s==='string'&&s.trim().length>=min&&s.length<=max&&!/[\x00-\x1f\x7f]/.test(s);
function valid(b){if(!b||typeof b!=='object')return false;
 if(b.action==='record_ad')return catalog.some(g=>g.id===b.gameId)&&channels.includes(b.channel)&&date(b.day)&&currencies.includes(b.currency)&&money(b.estimated)&&optionalMoney(b.confirmed)&&optionalMoney(b.received)&&(b.received===null||b.confirmed!==null)&&str(b.sourceRef,3,240)&&Number.isInteger(b.expectedRevision)&&b.expectedRevision>=0&&b.expectedRevision<2147483647&&b.day<=new Date(Date.now()+8*3600000).toISOString().slice(0,10);
 if(b.action==='record_contract')return isUuid(b.id)&&isUuid(b.requestId)&&str(b.reference,3,120)&&str(b.scope,10,1000)&&date(b.start)&&date(b.end)&&b.start<=b.end;
 if(b.action==='end_contract')return isUuid(b.id);
 return false;}
async function handle(req,res,{json,authorized,connection,path}){
 const send=(s,d)=>json(res,s,d),admin=path==='admin/operations',b=req.body||{};
 if(admin){const k=process.env.ANT_ADMIN_KEY;if(!k||k.length<32)return send(503,{error:'管理员未配置'});if(!authorized(req.headers.authorization,k))return send(401,{error:'管理员认证失败'});}
 else if(!/^Bearer [a-f0-9]{64}$/.test(req.headers.authorization||''))return send(401,{error:'请登录'});
 if(!process.env.DATABASE_URL)return send(503,{error:'数据库未配置'});
 if((admin&&!['GET','POST'].includes(req.method))||(!admin&&req.method!=='GET'))return send(405,{error:'Method not allowed'});
 if(admin&&req.method==='POST'&&!valid(b))return send(400,{error:'参数错误：核对日期、币种、官方报表来源和版本号'});
 let c;try{
 c=await connection().connect();await c.query('BEGIN');
 let uid;
 if(!admin){
 const h=createHash('sha256').update(req.headers.authorization.slice(7)).digest('hex');
 const s=await c.query('SELECT user_id::text FROM game_ops.customer_sessions WHERE token_hash=$1 AND expires_at>now() FOR SHARE',[h]);if(!s.rowCount){await c.query('ROLLBACK');return send(401,{error:'登录已过期'})}uid=s.rows[0].user_id;
 }else{await c.query('SELECT pg_advisory_xact_lock(923175401)');await c.query(BASE);await c.query(LICENSE);await c.query(SCHEMA);}
 if(admin&&req.method==='POST'){
 if(b.action==='record_ad'){
 const k=[b.gameId,b.channel,b.day,b.currency];
 const old=await c.query('SELECT revision FROM game_ops.ad_daily WHERE game_id=$1 AND channel=$2 AND day=$3 AND currency=$4 FOR UPDATE',k);const rev=old.rows[0]?.revision||0;
 if(rev!==b.expectedRevision){await c.query('ROLLBACK');return send(409,{error:'报表已被更新，请刷新后再修改'})}
 const v=[...k,b.estimated,b.confirmed,b.received,b.sourceRef.trim(),rev+1];
 await c.query('INSERT INTO game_ops.ad_daily(game_id,channel,day,currency,estimated,confirmed,received,source_ref,revision) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT(game_id,channel,day,currency) DO UPDATE SET estimated=EXCLUDED.estimated,confirmed=EXCLUDED.confirmed,received=EXCLUDED.received,source_ref=EXCLUDED.source_ref,revision=EXCLUDED.revision,updated_at=now()',v);
 await c.query('INSERT INTO game_ops.ad_daily_revisions(game_id,channel,day,currency,estimated,confirmed,received,source_ref,revision) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)',v);
 }else if(b.action==='record_contract'){
 const r=await c.query("SELECT id FROM game_ops.license_requests WHERE id=$1 AND status='reviewed' FOR UPDATE",[b.requestId]);if(!r.rowCount){await c.query('ROLLBACK');return send(409,{error:'申请须先人工审查'})}
 await c.query("INSERT INTO game_ops.service_contracts(id,request_id,reference,scope,start_date,end_date,status) VALUES($1,$2,$3,$4,$5,$6,'active')",[b.id,b.requestId,b.reference.trim(),b.scope.trim(),b.start,b.end]);
 await c.query("INSERT INTO game_ops.service_audit(contract_id,action) VALUES($1,'record_contract')",[b.id]);
 }else{
 const r=await c.query("UPDATE game_ops.service_contracts SET status='ended',ended_at=now() WHERE id=$1 AND status='active' RETURNING id",[b.id]);if(!r.rowCount){await c.query('ROLLBACK');return send(409,{error:'合同不存在或已结束'})}
 await c.query("INSERT INTO game_ops.service_audit(contract_id,action) VALUES($1,'end_contract')",[b.id]);
 }}
 const projection="s.id,s.request_id,o.game_id,s.reference,s.scope,s.start_date::text,s.end_date::text,s.status";
 if(admin){
 const contracts=(await c.query('SELECT '+projection+',u.account_code FROM game_ops.service_contracts s JOIN game_ops.license_requests o ON o.id=s.request_id JOIN game_ops.users u ON u.id=o.user_id ORDER BY s.created_at DESC LIMIT 200')).rows;
 const reports=(await c.query('SELECT game_id,channel,day::text,currency,estimated::text,confirmed::text,received::text,source_ref,revision FROM game_ops.ad_daily ORDER BY day DESC,game_id,channel LIMIT 300')).rows;
 const totals=(await c.query('SELECT game_id,currency,count(*)::int AS records,sum(estimated)::text AS estimated,sum(confirmed)::text AS confirmed,sum(received)::text AS received,count(confirmed)::int AS confirmed_records,count(received)::int AS received_records FROM game_ops.ad_daily GROUP BY game_id,currency ORDER BY game_id,currency')).rows;
 const channelTotals=(await c.query('SELECT game_id,channel,currency,count(*)::int AS records,sum(estimated)::text AS estimated,sum(confirmed)::text AS confirmed,sum(received)::text AS received FROM game_ops.ad_daily GROUP BY game_id,channel,currency ORDER BY game_id,channel,currency')).rows;
 const revisions=(await c.query('SELECT game_id,channel,day::text,currency,estimated::text,confirmed::text,received::text,source_ref,revision,created_at FROM game_ops.ad_daily_revisions ORDER BY id DESC LIMIT 300')).rows;
 await c.query('COMMIT');return send(200,{contracts,reports,totals,channelTotals,revisions,catalog});
 }
 const contracts=(await c.query('SELECT '+projection+' FROM game_ops.service_contracts s JOIN game_ops.license_requests o ON o.id=s.request_id WHERE o.user_id=$1 ORDER BY s.created_at DESC LIMIT 200',[uid])).rows;
 const reports=(await c.query("SELECT a.game_id,a.channel,a.day::text,a.currency,a.estimated::text,a.confirmed::text FROM game_ops.ad_daily a WHERE EXISTS(SELECT 1 FROM game_ops.service_contracts s JOIN game_ops.license_requests o ON o.id=s.request_id WHERE o.user_id=$1 AND o.game_id=a.game_id AND s.status='active' AND a.day BETWEEN s.start_date AND s.end_date AND (now() AT TIME ZONE 'Asia/Singapore')::date BETWEEN s.start_date AND s.end_date) ORDER BY a.day DESC LIMIT 300",[uid])).rows;
 await c.query('COMMIT');return send(200,{contracts,reports,catalog});
 }catch(e){if(c)await c.query('ROLLBACK').catch(()=>{});return send(e.code==='23505'?409:503,{error:e.code==='23505'?'合同编号或申请已存在':'运营数据库暂不可用'})}finally{if(c)c.release()}
}
module.exports={handle,valid,date,money,SCHEMA};