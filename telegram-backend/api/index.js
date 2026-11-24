/* ANT CANVAS Telegram API. Deploy with a Postgres database and BotFather token as server-only secrets. */
'use strict';
const {createHmac, timingSafeEqual, randomUUID} = require('node:crypto');
let pool;
const GAME_URL = 'https://pitilessrome-spec.github.io/ant-painting/';
const CORS_ORIGIN = process.env.GAME_ORIGIN || 'https://pitilessrome-spec.github.io';
function json(res, status, object) { res.statusCode=status; res.setHeader('Content-Type','application/json; charset=utf-8'); res.end(JSON.stringify(object)); }
function params(raw) {const p = new URLSearchParams(raw); return [...p.entries()];}
function displayName(user){
 const clean=s=>typeof s==='string'?s.replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g,'').trim():'';
 const name=[clean(user.first_name),clean(user.last_name)].filter(Boolean).join(' ');
 return Array.from(name||clean(user.username)).slice(0,80).join('')||null;
}
function checkInitData(raw,token,now=Math.floor(Date.now()/1000)){
 if(!token)return {code:'BOT_NOT_CONFIGURED'};
 if(!raw||typeof raw!=='string'||raw.length>12000)return {code:'INIT_DATA_MISSING'};
 let q;try{q=params(raw)}catch(_){return {code:'INIT_DATA_INVALID'}}
 if(new Set(q.map(([k])=>k)).size!==q.length)return {code:'INIT_DATA_INVALID'};
 const hash=q.find(([k])=>k==='hash');
 if(!hash||!/^[0-9a-f]{64}$/i.test(hash[1]))return {code:'INIT_DATA_INVALID'};
 const fields=q.filter(([k])=>k!=='hash').sort((a,b)=>a[0]<b[0]?-1:a[0]>b[0]?1:0);
 const check=fields.map(([k,v])=>k+'='+v).join('\n');
 const secret=createHmac('sha256','WebAppData').update(token).digest();
 const digest=createHmac('sha256',secret).update(check).digest();
 if(!timingSafeEqual(digest,Buffer.from(hash[1],'hex')))return {code:'SIGNATURE_MISMATCH'};
 const auth=fields.find(([k])=>k==='auth_date'),timestamp=Number(auth&&auth[1]);
 if(!Number.isInteger(timestamp)||timestamp>now+30||now-timestamp>3600)return {code:'INIT_DATA_EXPIRED'};
 try{const userRaw=fields.find(([k])=>k==='user'),user=JSON.parse(userRaw&&userRaw[1]);
 if(!user||!Number.isSafeInteger(user.id)||user.id<=0)return {code:'INIT_DATA_INVALID'};
 const start=fields.find(([k])=>k==='start_param');
 return {user:{id:String(user.id),displayName:displayName(user),...(start?{startParam:start[1]}:{})}};
 }catch(_){return {code:'INIT_DATA_INVALID'}}
}
function verifyInitData(raw,token){return checkInitData(raw,token).user||null;}
function connection() {
  if (!process.env.DATABASE_URL) throw Error('Database not configured');
  if (!pool) { const {Pool} = require('pg'); pool = new Pool({connectionString:process.env.DATABASE_URL, ssl:process.env.DB_SSL==='disable'?false:{rejectUnauthorized:true},max:4,connectionTimeoutMillis:4000}); }
  return pool;
}
function alias(id) {return 'Ant #'+id.slice(-6);}
function playerLabel(row){return row.show_display_name===true&&row.display_name?row.display_name:alias(String(row.id));}
let namesMigration;
async function ensureNames(db){if(!namesMigration)namesMigration=(async()=>{const {rows}=await db.query("SELECT count(*)::int AS n FROM information_schema.columns WHERE table_schema='public' AND table_name='players' AND column_name IN ('display_name','show_display_name')");if(rows[0].n!==2)await db.query('ALTER TABLE players ADD COLUMN IF NOT EXISTS display_name VARCHAR(160), ADD COLUMN IF NOT EXISTS show_display_name BOOLEAN');})().catch(e=>{namesMigration=null;throw e});return namesMigration;}
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
 const m=rows[0];let botStatus={status:'unavailable'};try{const b=await bot('getMe',{});if(b&&b.username)botStatus={status:b.username.toLowerCase()==='antcanvasartbot'?'matched':'mismatch',username:b.username};}catch(_){botStatus={status:'invalid_or_unreachable'};}return json(res,200,{botStatus,metrics:m,timezone:'Asia/Singapore',asOf:new Date().toISOString(),retention:m.yesterday_active?m.returned_today/m.yesterday_active:null,adImpressions:null,adRevenue:null});
}
// Private backup is user-supplied cosmetic progress, never a trusted score.
const SAVE_KEYS=new Set(['mbh3','ant_canvas_profile_v1','ant_canvas_collection_v1','ant_canvas_village_v1']);
const REGION_IDS=['garden','forest','island','snow'],PLOT_IDS=['0','1','2','3','5','6','7','8'],ITEM_IDS=['flower','mushroom','lantern','fountain','butterfly','castle','grove','dock','ice'];
function validBackup(data){
 if(!data||typeof data!=='object'||Array.isArray(data))return false;
 const keys=Object.keys(data);if(!keys.length||keys.some(k=>!SAVE_KEYS.has(k)))return false;
 try{return Buffer.byteLength(JSON.stringify(data),'utf8')<=180000&&keys.every(k=>data[k]&&typeof data[k]==='object'&&!Array.isArray(data[k])&&(k==='mbh3'||data[k].v===1))}catch(_){return false}
}
function publicVillage(save){
 const v=save&&save.ant_canvas_village_v1;if(!v)return [];
 const w=v.world||{},active=REGION_IDS.includes(w.active)?w.active:'garden';
 return REGION_IDS.map(id=>{const m=id===active?v:(w.maps&&w.maps[id])||{};return {region:id,buildings:PLOT_IDS.filter(k=>ITEM_IDS.includes(m.placements&&m.placements[k])).map(k=>({plot:Number(k),item:m.placements[k],level:Math.max(1,Math.min(3,Math.trunc(Number(m.upgrades&&m.upgrades[k])||1)))}))}})
}
function referralId(param,self){const m=typeof param==='string'&&/^ref_([1-9][0-9]{0,15})$/.exec(param);return m&&m[1]!==self?m[1]:null}
async function social(req,res,db,user,path){
 const body=req.body||{};
 if(path==='backup'&&req.method==='GET'){
  const {rows}=await db.query('SELECT revision,save,updated_at FROM player_backups WHERE telegram_id=$1',[user.id]);
  return json(res,200,rows[0]?{revision:rows[0].revision,save:rows[0].save,updatedAt:rows[0].updated_at}:{revision:0,save:null});
 }
 if(path==='backup'&&req.method==='POST'){
  if(!validBackup(body.save)||!Number.isSafeInteger(body.revision)||body.revision<0||body.revision>2147483646)return json(res,400,{error:'Invalid backup'});
  const q=body.revision===0?await db.query('INSERT INTO player_backups(telegram_id,revision,save) VALUES($1,1,$2::jsonb) ON CONFLICT DO NOTHING RETURNING revision,updated_at',[user.id,JSON.stringify(body.save)]):await db.query('UPDATE player_backups SET revision=revision+1,save=$2::jsonb,updated_at=now() WHERE telegram_id=$1 AND revision=$3 RETURNING revision,updated_at',[user.id,JSON.stringify(body.save),body.revision]);
  return q.rows.length?json(res,200,{revision:q.rows[0].revision,updatedAt:q.rows[0].updated_at}):json(res,409,{error:'Cloud save changed. Reload and compare before overwriting.'});
 }
 if(path==='social/friends'&&req.method==='GET'){
  const {rows}=await db.query(`SELECT p.telegram_id::text AS id,p.best_level,p.display_name,p.show_display_name,b.public_village FROM player_referrals r JOIN players p ON p.telegram_id=CASE WHEN r.inviter_id=$1 THEN r.invitee_id ELSE r.inviter_id END LEFT JOIN player_backups b ON b.telegram_id=p.telegram_id WHERE r.inviter_id=$1 OR r.invitee_id=$1 ORDER BY p.best_level DESC LIMIT 100`,[user.id]);
  const counts=await db.query('SELECT count(*)::int AS invited,count(*) FILTER(WHERE p.best_level>=5)::int AS qualified FROM player_referrals r JOIN players p ON p.telegram_id=r.invitee_id WHERE r.inviter_id=$1',[user.id]);
  return json(res,200,{friends:rows.map(r=>({id:r.id,name:playerLabel(r),level:r.best_level,publicVillage:!!r.public_village})),...counts.rows[0]});
 }
 if(path==='social/publish'&&req.method==='POST'){
  if(typeof body.enabled!=='boolean')return json(res,400,{error:'Invalid sharing setting'});
  const {rows}=await db.query('UPDATE player_backups SET public_village=$2 WHERE telegram_id=$1 RETURNING public_village',[user.id,body.enabled]);
  return rows.length?json(res,200,{enabled:rows[0].public_village}):json(res,409,{error:'Create a cloud backup first'});
 }
 if(path==='social/visit'&&req.method==='POST'){
  if(typeof body.friendId!=='string'||!/^\d{1,16}$/.test(body.friendId)||body.friendId===user.id)return json(res,400,{error:'Invalid friend'});
  const {rows}=await db.query(`SELECT b.save,p.best_level,p.display_name,p.show_display_name FROM player_backups b JOIN players p USING(telegram_id) WHERE b.telegram_id=$2 AND b.public_village=true AND EXISTS(SELECT 1 FROM player_referrals r WHERE (r.inviter_id=$1 AND r.invitee_id=$2) OR (r.inviter_id=$2 AND r.invitee_id=$1))`,[user.id,body.friendId]);
  return rows.length?json(res,200,{name:playerLabel({...rows[0],id:body.friendId}),level:rows[0].best_level,regions:publicVillage(rows[0].save)}):json(res,404,{error:'Village not shared or not a friend'});
 }
 return json(res,405,{error:'Method not allowed'});
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
    if (!['profile','profile/name','leaderboard','start-level','progress','backup','social/friends','social/publish','social/visit'].includes(path)) return json(res,404,{error:'Not found'});
    const header=req.headers.authorization||'';
    const checked=checkInitData(header.startsWith('tma ')?header.slice(4):'',process.env.TELEGRAM_BOT_TOKEN);
    if(!checked.user){console.warn('Telegram authentication rejected:',checked.code);return json(res,checked.code==='BOT_NOT_CONFIGURED'?503:401,{error:'Valid Telegram Mini App sign-in required',code:checked.code});}
    const user=checked.user;
    const db=connection();
    await ensureNames(db);
    const inviter=referralId(user.startParam,user.id);
    if(inviter){
      await db.query(`WITH fresh AS (INSERT INTO players(telegram_id) VALUES($1) ON CONFLICT DO NOTHING RETURNING telegram_id) INSERT INTO player_referrals(invitee_id,inviter_id) SELECT fresh.telegram_id,p.telegram_id FROM fresh JOIN players p ON p.telegram_id=$2 ON CONFLICT DO NOTHING`,[user.id,inviter]);
    }else await db.query('INSERT INTO players(telegram_id) VALUES($1) ON CONFLICT DO NOTHING',[user.id]);
    await db.query('UPDATE players SET display_name=$2 WHERE telegram_id=$1 AND display_name IS DISTINCT FROM $2',[user.id,user.displayName]);
    if(path==='backup'||path.startsWith('social/'))return await social(req,res,db,user,path);
    if (path==='profile' && req.method==='GET') {
      const {rows}=await db.query('SELECT best_level,display_name,show_display_name FROM players WHERE telegram_id=$1',[user.id]);
      return json(res,200,{playerId:user.id,bestLevel:rows[0].best_level||0,displayName:rows[0].display_name,namePublic:rows[0].show_display_name});
    }
    if(path==='profile/name'&&req.method==='POST'){
      const enabled=(req.body||{}).enabled;if(typeof enabled!=='boolean')return json(res,400,{error:'Invalid name preference'});
      await db.query('UPDATE players SET show_display_name=$2 WHERE telegram_id=$1',[user.id,enabled]);
      return json(res,200,{namePublic:enabled});
    }
    if (path==='leaderboard' && req.method==='GET') {
      const {rows}=await db.query('SELECT telegram_id::text AS id,best_level AS level,display_name,show_display_name FROM players WHERE best_level>0 ORDER BY best_level DESC, updated_at ASC LIMIT 30');
      return json(res,200,{leaders:rows.map(r=>({name:playerLabel(r),level:r.level}))});
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

module.exports.validBackup=validBackup;module.exports.publicVillage=publicVillage;module.exports.referralId=referralId;

module.exports.checkInitData=checkInitData;

module.exports.displayName=displayName;module.exports.playerLabel=playerLabel;
