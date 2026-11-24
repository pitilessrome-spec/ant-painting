const {test}=require('node:test'),assert=require('node:assert/strict'),{createHmac}=require('node:crypto');
const {verifyInitData}=require('../api/index.js');
const token='123456:test-token';
function make(data){
 const entries=Object.entries(data).sort(([a],[b])=>a.localeCompare(b));
 const secret=createHmac('sha256','WebAppData').update(token).digest();
 const hash=createHmac('sha256',secret).update(entries.map(([k,v])=>k+'='+v).join('\n')).digest('hex');
 return new URLSearchParams({...data,hash}).toString();
}
test('accepts signed fresh Telegram data',()=>{
 const data={auth_date:String(Math.floor(Date.now()/1000)),user:JSON.stringify({id:12345,first_name:'Ant'})};
 assert.deepEqual(verifyInitData(make(data),token),{id:'12345',displayName:'Ant'});
});
test('rejects tampered, stale, and missing token',()=>{
 const data={auth_date:String(Math.floor(Date.now()/1000)),user:JSON.stringify({id:12345})};
 assert.equal(verifyInitData(make(data).replace('12345','98765'),token),null);
 assert.equal(verifyInitData(make({...data,auth_date:'100'}),token),null);
 assert.equal(verifyInitData(make(data),null),null);
});

test('display name is sanitized and opt-in',()=>{const {displayName,playerLabel}=require('../api/index.js');assert.equal(displayName({first_name:' 小蚂蚁 ',last_name:'旅行家'}),'小蚂蚁 旅行家');assert.equal(displayName({username:'ant_user'}),'ant_user');assert.equal(displayName({}),null);assert.equal(playerLabel({id:'1234567',display_name:'Ant',show_display_name:true}),'Ant');assert.equal(playerLabel({id:'1234567',display_name:'Ant',show_display_name:null}),'Ant #234567')});
