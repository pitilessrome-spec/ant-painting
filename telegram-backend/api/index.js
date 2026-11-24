/* ANT CANVAS Telegram API. Deploy with a Postgres database and BotFather token as server-only secrets. */
'use strict';
const {createHmac, timingSafeEqual, randomUUID} = require('node:crypto');
let pool;
const GAME_URL = 'https://pitilessrome-spec.github.io/ant-painting/';
const CORS_ORIGIN = process.env.GAME_ORIGIN || 'https://pitilessrome-spec.github.io';
function json(res, status, object) { res.statusCode=status; res.setHeader('Content-Type','application/json; charset=utf-8'); res.end(JSON.stringify(object)); }
function params(raw) {const p = new URLSearchParams(raw); return [...p.entries()];}
function verifyInitData(raw, token) {
  if (!raw || typeof raw!=='string' || raw.length>12000 || !token) return null;
  let q;
  try {q=params(raw);}catch(_){return null;}
  const hash=q.find(([k])=>k==='hash');
  if (!hash || !/^[0-9a-f]{64}$/i.test(hash[1])) return null;
  const fields=q.filter(([k])=>k!=='hash').sort((a,b)=>a[0].localeCompare(b[0]));
  if (new Set(fields.map(([k])=>k)).size!==fields.length) return null;
  const check=fields.map(([k,v])=>k+'='+v).join('\n');
  const secret=createHmac('sha256','WebAppData').update(token).digest();
  const digest=createHmac('sha256',secret).update(check).digest();
  if (!timingSafeEqual(digest,Buffer.from(hash[1],'hex'))) return null;
  const auth=fields.find(([k])=>k==='auth_date');
  const now=Math.floor(Date.now()/1000);
  const timestamp=Number(auth && auth[1]);
  if (!Number.isInteger(timestamp) || timestamp>now+30 || now-timestamp>3600) return null;
  try {
    const userRaw=fields.find(([k])=>k==='user');
    const user=JSON.parse(userRaw&&userRaw[1]);
    if (!user || !Number.isSafeInteger(user.id) || user.id<=0) return null;
    return {id:String(user.id)};
  } catch (_) { return null; }
}
function connection() {
  if (!process.env.DATABASE_URL) throw Error('Database not configured');
  if (!pool) { const {Pool} = require('pg'); pool = new Pool({connectionString:process.env.DATABASE_URL, ssl:process.env.DB_SSL==='disable'?false:{rejectUnauthorized:true},max:4,connectionTimeoutMillis:4000}); }
  return pool;
}
function alias(id) {return 'Ant #'+id.slice(-6);}
async function bot(method, data) {
  if (!process.env.TELEGRAM_BOT_TOKEN) return;
  const response=await fetch('https://api.telegram.org/bot'+process.env.TELEGRAM_BOT_TOKEN+'/'+method,{
    method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)
  });
  if (!response.ok) throw Error('Telegram Bot API HTTP '+response.status);
  const parsed=await response.json();
  if (!parsed.ok) throw Error('Telegram Bot API rejected '+method);
  return parsed.result;
}
async function handleWebhook(req,res) {
  const secret=process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret) return json(res,503,{error:'Bot not configured'});
  const got=req.headers['x-telegram-bot-api-secret-token'];
  if (typeof got!=='string' || got.length!==secret.length || !timingSafeEqual(Buffer.from(got),Buffer.from(secret))) return json(res,403,{error:'Forbidden'});
  const update=req.body || {};
  if (update.callback_query && update.callback_query.game_short_name) {
    const cb=update.callback_query;
    if (cb.game_short_name!==process.env.TELEGRAM_GAME_SHORT_NAME) return json(res,200,{ok:true});
    const userId=String(cb.from.id);
    const message=cb.message;
    if (message && message.chat && Number.isInteger(message.message_id) && process.env.DATABASE_URL) {
      await connection().query(`INSERT INTO game_context(telegram_id,chat_id,message_id) VALUES($1,$2,$3)
        ON CONFLICT(telegram_id) DO UPDATE SET chat_id=EXCLUDED.chat_id,message_id=EXCLUDED.message_id,updated_at=now()`,[userId,String(message.chat.id),message.message_id]);
    }
    await bot('answerCallbackQuery',{callback_query_id:cb.id,url:GAME_URL});
    return json(res,200,{ok:true});
  }
  const msg=update.message;
  if (!msg || !msg.chat || !msg.text) return json(res,200,{ok:true});
  if (msg.text.startsWith('/play') && process.env.TELEGRAM_GAME_SHORT_NAME) {
    await bot('sendGame',{chat_id:msg.chat.id,game_short_name:process.env.TELEGRAM_GAME_SHORT_NAME});
  } else if (msg.text.startsWith('/start') || msg.text.startsWith('/play')) {
    await bot('sendMessage',{chat_id:msg.chat.id,text:'🐜 ANT CANVAS — Play the color puzzle!',reply_markup:{inline_keyboard:[[{text:'🎮 Play ANT CANVAS',web_app:{url:GAME_URL}}]]}});
  }
  return json(res,200,{ok:true});
}
// Operator-only aggregate metrics, no private player identities.
function adminAuthorized(header,secret){
 if(typeof secret!=='string'||secret.length<32||typeof header!=='string'||!header.startsWith('Bearer '))return false;
 const supplied=Buffer.from(header.slice(7),'utf8'),expected=Buffer.from(secret,'utf8');
 return supplied.length===expected.length&&timingSafeEqual(supplied,expected);
}
async function adminStats(req,res){
 const key=process.env.ANT_ADMIN_KEY;
 if(!key||key.length<32)return json(res,503,{error:'Administrator access is not configured'});
 if(!adminAuthorized(req.headers.authorization,key))return json(res,401,{error:'Invalid administrator credentials'});
 if(!process.env.DATABASE_URL)return json(res,503,{error:'Database is not configured'});
 const {rows}=await connection().query(`WITH bounds AS (
 SELECT date_trunc('day',now() AT TIME ZONE 'Asia/Singapore') AT TIME ZONE 'Asia/Singapore' AS d
 ), y AS (SELECT DISTINCT telegram_id FROM level_sessions,bounds WHERE started_at>=d-interval '1 day' AND started_at<d),
 t AS (SELECT DISTINCT telegram_id FROM level_sessions,bounds WHERE started_at>=d)
 SELECT (SELECT count(*)::int FROM players) AS players,
 (SELECT count(*)::int FROM players,bounds WHERE created_at>=d) AS new_today,
 (SELECT count(*)::int FROM t) AS active_today,
 (SELECT count(DISTINCT telegram_id)::int FROM level_sessions WHERE started_at>=now()-interval '5 minutes') AS started_last_5m,
 (SELECT count(*)::int FROM level_sessions,bounds WHERE completed_at>=d) AS completed_today,
 (SELECT COALESCE(round(avg(best_level),2),0)::float FROM players) AS average_best_level,
 (SELECT count(*)::int FROM y) AS yesterday_active,
 (SELECT count(*)::int FROM y JOIN t USING(telegram_id)) AS returned_today`);
 const m=rows[0];return json(res,200,{metrics:m,timezone:'Asia/Singapore',asOf:new Date().toISOString(),retention:m.yesterday_active?m.returned_today/m.yesterday_active:null,adImpressions:null,adRevenue:null});
}
async function handler(req,res) {
  res.setHeader('Access-Control-Allow-Origin',CORS_ORIGIN);
  res.setHeader('Vary','Origin');
  res.setHeader('Access-Control-Allow-Headers','Authorization, Content-Type');
  res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');
  res.setHeader('Cache-Control','no-store');
  if (req.method==='OPTIONS') return res.status(204).end();
  const origin=req.headers.origin;
  if (origin && origin!==CORS_ORIGIN) return json(res,403,{error:'Origin not allowed'});
  const path=(req.url||'').split('?')[0].replace(/^\/api\/?/,'').replace(/\/$/,'');
  if (path==='health' && req.method==='GET') return json(res,200,{status:'online',botConfigured:!!process.env.TELEGRAM_BOT_TOKEN,storageConfigured:!!process.env.DATABASE_URL,adminConfigured:typeof process.env.ANT_ADMIN_KEY==='string'&&process.env.ANT_ADMIN_KEY.length>=32});
  try {
    if (path==='admin/stats' && req.method==='GET') return await adminStats(req,res);
    if (path==='webhook' && req.method==='POST') return await handleWebhook(req,res);
    if (!['profile','leaderboard','start-level','progress'].includes(path)) return json(res,404,{error:'Not found'});
    const header=req.headers.authorization||'';
    const user=verifyInitData(header.startsWith('tma ')?header.slice(4):'',process.env.TELEGRAM_BOT_TOKEN);
    if (!user) return json(res,401,{error:'Valid Telegram Mini App sign-in required'});
    const db=connection();
    await db.query('INSERT INTO players(telegram_id) VALUES($1) ON CONFLICT DO NOTHING',[user.id]);
    if (path==='profile' && req.method==='GET') {
      const {rows}=await db.query('SELECT best_level FROM players WHERE telegram_id=$1',[user.id]);
      return json(res,200,{playerId:user.id,bestLevel:rows[0].best_level||0});
    }
    if (path==='leaderboard' && req.method==='GET') {
      const {rows}=await db.query('SELECT telegram_id::text AS id,best_level AS level FROM players WHERE best_level>0 ORDER BY best_level DESC, updated_at ASC LIMIT 30');
      return json(res,200,{leaders:rows.map(r=>({name:alias(r.id),level:r.level}))});
    }
    if (path==='start-level' && req.method==='POST') {
      const level=Number((req.body||{}).level);
      if (!Number.isSafeInteger(level)||level<1||level>999999) return json(res,400,{error:'Invalid level'});
      const {rows}=await db.query('SELECT best_level FROM players WHERE telegram_id=$1',[user.id]);
      if (level!==rows[0].best_level+1) return json(res,409,{error:'Play your next verified level first',nextLevel:rows[0].best_level+1});
      const ticket=randomUUID();
      await db.query('INSERT INTO level_sessions(ticket,telegram_id,level) VALUES($1,$2,$3)',[ticket,user.id,level]);
      return json(res,200,{ticket,level});
    }
    if (path==='progress' && req.method==='POST') {
      const body=req.body||{};
      const level=Number(body.level),ticket=body.ticket;
      if(!Number.isSafeInteger(level)||level<1||level>999999||typeof ticket!=='string'||!/^[a-f0-9-]{36}$/i.test(ticket)) return json(res,400,{error:'Invalid completion'});
      const client=await db.connect();
      let best;
      try {
        await client.query('BEGIN');
        const {rows}=await client.query(`SELECT level,started_at,completed_at FROM level_sessions WHERE ticket=$1 AND telegram_id=$2 FOR UPDATE`,[ticket,user.id]);
        if(rows.length!==1||rows[0].completed_at||rows[0].level!==level) {await client.query('ROLLBACK');return json(res,409,{error:'Invalid or used level ticket'});}
        const age=Date.now()-new Date(rows[0].started_at).getTime();
        if(age<3000||age>21600000){await client.query('ROLLBACK');return json(res,409,{error:'Level timer invalid'});}
        const up=await client.query(`UPDATE players SET best_level=$2,updated_at=now() WHERE telegram_id=$1 AND best_level=$2-1 RETURNING best_level`,[user.id,level]);
        if(up.rows.length!==1){await client.query('ROLLBACK');return json(res,409,{error:'Level completion must be sequential'});}
        best=up.rows[0].best_level;
        await client.query('UPDATE level_sessions SET completed_at=now() WHERE ticket=$1',[ticket]);
        await client.query('COMMIT');
      } catch(e) { await client.query('ROLLBACK');throw e; }
      finally {client.release();}
      if (process.env.TELEGRAM_GAME_SHORT_NAME) {
        try {
          const {rows}=await db.query('SELECT chat_id,message_id FROM game_context WHERE telegram_id=$1',[user.id]);
          if(rows.length) await bot('setGameScore',{user_id:Number(user.id),score:best,chat_id:Number(rows[0].chat_id),message_id:rows[0].message_id,disable_edit_message:false});
        } catch(e) {console.error('Native Telegram score sync failed:',e.message);}
      }
      return json(res,200,{bestLevel:best});
    }
    return json(res,405,{error:'Method not allowed'});
  } catch(e) { console.error('ANT CANVAS API error:',e.message); return json(res,503,{error:'Game service unavailable'}); }
}
module.exports=handler;
module.exports.verifyInitData=verifyInitData;

module.exports.adminAuthorized=adminAuthorized;
