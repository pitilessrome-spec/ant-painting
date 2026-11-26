'use strict';
const R=require('./siege-engine'),{randomUUID,randomBytes}=require('node:crypto'),A=require('./ant-evolution');
const SQL=`CREATE TABLE IF NOT EXISTS siege_rooms(id uuid PRIMARY KEY, code text UNIQUE NOT NULL, owner_id bigint NOT NULL REFERENCES players(telegram_id), state jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now())`;
let init;function ensure(db){return init||(init=db.query(SQL).catch(e=>{init=null;throw e}))}
function fail(message,status=409){const e=Error(message);e.status=status;throw e}
function send(res,status,data){res.statusCode=status;res.setHeader('Content-Type','application/json');res.end(JSON.stringify(data))}
async function owned(c,id){const q=await c.query('SELECT species,level FROM raid_ant_species WHERE player_id=$1',[id]);return Object.fromEntries(q.rows.filter(x=>Object.hasOwn(A.SPECIES,x.species)).map(x=>[x.species,x.level]))}
function show(row,id){const s=row.state;return {room:row.id,code:row.code,you:id,owner:String(row.owner_id),...(s.status==='lobby'?s:R.view(s,id))}}
async function route(req,res,db,user,path){if(process.env.ANT_SIEGE_V8!=='1')return send(res,503,{error:'Siege candidate not enabled'});if(req.method!=='POST')return send(res,405,{error:'POST required'});await ensure(db);const id=String(user.id),b=req.body||{},now=Date.now();let c;try{
if(path==='siege/catalog')return send(res,200,{version:8,cap:4,rewards:false,owned:{worker:1,...await owned(db,id)}});
c=await db.connect();await c.query('BEGIN');
if(path==='siege/create'){await c.query('SELECT pg_advisory_xact_lock(hashtext($1))',['siege:'+id]);const q=await c.query("SELECT count(*)::int AS n FROM siege_rooms WHERE owner_id=$1 AND created_at>now()-interval '1 hour'",[id]);if(q.rows[0].n>=6)fail('Room limit',429);const room=randomUUID(),code=randomBytes(6).toString('hex'),state={status:'lobby',members:[id],loadouts:{[id]:['worker']}};const {rows}=await c.query('INSERT INTO siege_rooms(id,code,owner_id,state) VALUES($1,$2,$3,$4) RETURNING *',[room,code,id,JSON.stringify(state)]);await c.query('COMMIT');return send(res,200,show(rows[0],id))}
const join=path==='siege/join';if(join?!/^[a-f0-9]{12}$/.test(b.code||''):!/^[a-f0-9-]{36}$/i.test(b.room||''))fail('Invalid room',400);
const {rows}=await c.query(join?'SELECT * FROM siege_rooms WHERE code=$1 FOR UPDATE':'SELECT * FROM siege_rooms WHERE id=$1 FOR UPDATE',[join?b.code:b.room]);if(!rows.length)fail('Room missing',404);const row=rows[0];let s=row.state;const ids=s.status==='lobby'?s.members:Object.keys(s.players);
if(join&&!ids.includes(id)){if(s.status!=='lobby'||ids.length>=4)fail('Room closed/full');s.members.push(id);s.loadouts[id]=['worker']}else if(!ids.includes(id))fail('Not a member',403);
if(path==='siege/equip'){if(s.status!=='lobby')fail('Already started');const a=await owned(c,id),keys=b.skills;if(!Array.isArray(keys)||keys.length>4||new Set(keys).size!==keys.length||keys.some(k=>k!=='worker'&&!Object.hasOwn(a,k)))fail('Ant not owned',403);s.loadouts[id]=keys}
else if(path==='siege/start'){if(String(row.owner_id)!==id||s.status!=='lobby')fail('Only leader can start lobby',403);const a={};for(const k of s.members)a[k]=await owned(c,k);const next=R.create(s.members,now,randomBytes(4).readUInt32LE(),a);for(const k of s.members)R.equip(next,k,s.loadouts[k]);s=next}
else if(path==='siege/act'){if(s.status==='lobby')fail('Not started');R.act(s,id,b.action||{},Math.max(s.now,Date.now()))}
else if(path==='siege/state'){if(s.status!=='lobby')R.advance(s,Math.max(s.now,Date.now()))}
else if(!join)fail('Unknown endpoint',404);
await c.query('UPDATE siege_rooms SET state=$2,updated_at=now() WHERE id=$1',[row.id,JSON.stringify(s)]);await c.query("SELECT pg_notify('ant_raid_room',$1)",[row.id]);await c.query('COMMIT');return send(res,200,show({...row,state:s},id))
}catch(e){if(c)await c.query('ROLLBACK');if(e.status)return send(res,e.status,{error:e.message});throw e}finally{if(c)c.release()}}
module.exports={route,ensure};