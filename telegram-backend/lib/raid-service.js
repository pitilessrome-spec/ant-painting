'use strict';
const {randomUUID,randomBytes}=require('node:crypto'),R=require('./raid-engine');
const SQL="CREATE TABLE IF NOT EXISTS raid_rooms (\n id UUID PRIMARY KEY, code VARCHAR(12) NOT NULL UNIQUE, owner_id BIGINT NOT NULL REFERENCES players(telegram_id),\n state JSONB NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()\n);\nCREATE INDEX IF NOT EXISTS raid_rooms_owner_idx ON raid_rooms(owner_id,created_at);\nCREATE TABLE IF NOT EXISTS raid_first_clears (\n season TEXT NOT NULL, boss TEXT NOT NULL, tier TEXT NOT NULL, assisted BOOLEAN NOT NULL, roster_key TEXT NOT NULL,\n room_id UUID NOT NULL UNIQUE REFERENCES raid_rooms(id), rank INTEGER NOT NULL, members JSONB NOT NULL,\n completed_at TIMESTAMPTZ NOT NULL, duration_ms INTEGER NOT NULL,\n PRIMARY KEY(season,boss,tier,assisted,roster_key), UNIQUE(season,boss,tier,assisted,rank)\n);\nCREATE TABLE IF NOT EXISTS raid_rewards (\n season TEXT NOT NULL, boss TEXT NOT NULL, tier TEXT NOT NULL, player_id BIGINT NOT NULL REFERENCES players(telegram_id),\n room_id UUID NOT NULL REFERENCES raid_rooms(id), rank INTEGER NOT NULL, granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),\n PRIMARY KEY(season,boss,tier,player_id)\n);";
let migration;
function ensure(db){if(!migration)migration=db.query(SQL).catch(e=>{migration=null;throw e});return migration}
function respond(res,code,body){res.statusCode=code;res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify(body))}
function error(message,status=409){const e=Error(message);e.status=status;throw e}
async function settle(c,id,s){const key=[s.season,s.boss,s.tier,String(s.assisted)].join(':');await c.query('SELECT pg_advisory_xact_lock(hashtext($1))',[key]);const roster=R.roster(s),args=[s.season,s.boss,s.tier,s.assisted,roster];
 const old=await c.query('SELECT rank FROM raid_first_clears WHERE season=$1 AND boss=$2 AND tier=$3 AND assisted=$4 AND roster_key=$5',args);
 if(old.rows.length)return old.rows[0].rank;
 const row=await c.query('SELECT COALESCE(MAX(rank),0)+1 AS rank FROM raid_first_clears WHERE season=$1 AND boss=$2 AND tier=$3 AND assisted=$4',args.slice(0,4));const rank=Number(row.rows[0].rank),members=Object.keys(s.players).map(R.alias);
 await c.query('INSERT INTO raid_first_clears(season,boss,tier,assisted,roster_key,room_id,rank,members,completed_at,duration_ms) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',[...args,id,rank,JSON.stringify(members),new Date(s.finishedAt),s.finishedAt-s.startedAt]);
 for(const user of Object.keys(s.players))await c.query('INSERT INTO raid_rewards(season,boss,tier,player_id,room_id,rank) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING',[s.season,s.boss,s.tier,user,id,rank]);
 return rank
}
async function route(req,res,db,user,path){if(process.env.ANT_RAID_ENABLED!=='1')return respond(res,503,{error:'Raid service not released'});if(req.method!=='POST')return respond(res,405,{error:'Method not allowed'});await ensure(db);const b=req.body||{},id=user.id,now=Date.now();
 try{
 if(path==='raid/catalog')return respond(res,200,{season:R.SEASON,bosses:R.BOSSES,tiers:R.TIERS,assisted:false});
 if(path==='raid/leaderboard'){const {rows}=await db.query('SELECT boss,tier,rank,members,completed_at,duration_ms FROM raid_first_clears WHERE season=$1 AND assisted=false ORDER BY completed_at DESC LIMIT 100',[R.SEASON]);return respond(res,200,{leaders:rows})}
 if(path==='raid/announcements'){const {rows}=await db.query('SELECT room_id::text AS event_id,boss,tier,rank,members,completed_at FROM raid_first_clears WHERE season=$1 AND tier=\'world\' AND assisted=false AND rank<=10 AND completed_at>now()-interval \'24 hours\' ORDER BY completed_at ASC LIMIT 40',[R.SEASON]);return respond(res,200,{events:rows,repeats:3})}
 if(path==='raid/rewards'){const {rows}=await db.query('SELECT boss,tier,rank,granted_at FROM raid_rewards WHERE season=$1 AND player_id=$2 ORDER BY granted_at DESC',[R.SEASON,id]);return respond(res,200,{rewards:rows})}
 if(path==='raid/create'){const s=R.createRoom(b.tier,b.boss,id,now),c=await db.connect();try{await c.query('BEGIN');await c.query('SELECT pg_advisory_xact_lock(hashtext($1))',['raid-owner:'+id]);const quota=await c.query('SELECT count(*)::int AS n FROM raid_rooms WHERE owner_id=$1 AND created_at>now()-interval \'1 hour\'',[id]);if(quota.rows[0].n>=6)error('Room creation limit',429);const room=randomUUID(),code=randomBytes(6).toString('hex');await c.query('INSERT INTO raid_rooms(id,code,owner_id,state) VALUES($1,$2,$3,$4)',[room,code,id,JSON.stringify(s)]);await c.query('COMMIT');return respond(res,200,{room,code,...R.view(s,id)})}catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}}
 if(!['raid/join','raid/state','raid/start','raid/leave','raid/act'].includes(path))return respond(res,404,{error:'Unknown raid endpoint'});
 const join=path==='raid/join';if(join?typeof b.code!=='string'||!/^[0-9a-f]{12}$/.test(b.code):typeof b.room!=='string'||!/^[0-9a-f-]{36}$/i.test(b.room))error('Invalid room or invite code',400);
 const c=await db.connect();try{await c.query('BEGIN');const {rows}=await c.query(join?'SELECT id,code,state FROM raid_rooms WHERE code=$1 FOR UPDATE':'SELECT id,code,state FROM raid_rooms WHERE id=$1 FOR UPDATE',[join?b.code:b.room]);if(!rows.length)error('Room not found',404);const row=rows[0],s=row.state;if(join){if(now-s.createdAt>24*60*60*1000)error('Invite expired');R.join(s,id)}else if(!Object.hasOwn(s.players,id))error('Not a member',403);
 const was=s.status;let action=null;if(path==='raid/start')R.start(s,id,now);else if(path==='raid/leave')R.leave(s,id);else if(path==='raid/act')action=R.act(s,id,b,now);else if(R.expired(s,now)){s.status='failed';s.finishedAt=now}
 if(was!=='won'&&s.status==='won')s.rank=await settle(c,row.id,s);
 if(path!=='raid/state'||was!==s.status)await c.query('UPDATE raid_rooms SET state=$2,updated_at=now() WHERE id=$1',[row.id,JSON.stringify(s)]);
 await c.query('COMMIT');return respond(res,200,path==='raid/leave'?{left:true}:{room:row.id,code:row.code,rank:s.rank||null,...R.view(s,id),action})
 }catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}
 }catch(e){if(e.status)return respond(res,e.status,{error:e.message});throw e}
}
module.exports={route,ensure,settle};