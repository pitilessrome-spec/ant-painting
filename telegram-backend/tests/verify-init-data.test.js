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
 assert.deepEqual(verifyInitData(make(data),token),{id:'12345'});
});
test('rejects tampered, stale, and missing token',()=>{
 const data={auth_date:String(Math.floor(Date.now()/1000)),user:JSON.stringify({id:12345})};
 assert.equal(verifyInitData(make(data).replace('12345','98765'),token),null);
 assert.equal(verifyInitData(make({...data,auth_date:'100'}),token),null);
 assert.equal(verifyInitData(make(data),null),null);
});
