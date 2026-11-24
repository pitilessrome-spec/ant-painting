const fs=require('node:fs'),assert=require('node:assert/strict');
const model=fs.readFileSync(require('node:path').join(__dirname,'../js/village.js'),'utf8');
function make(start){let data=JSON.stringify({v:1,wood:5,petals:2,chests:0,placements:{3:'flower'},claimedHigh:0,claimedExtra:[]});const win={};class TestDate extends Date{constructor(...a){super(...(a.length?a:[start]))}static now(){return start}};new Function("window","localStorage","Date",model)(win,{getItem:()=>data,setItem:(k,v)=>data=v},TestDate);return win.AntVillage}
function tests(make,assert){
 const start=new Date(2026,10,24,10).getTime(),hr=3600000,day=86400000,results=[];
 const check=(name,fn)=>{fn();results.push(name)};
 check('migration preserves old balances and plots',()=>{const v=make(start);assert(v.snapshot().wood===5&&v.snapshot().petals===2&&v.snapshot().placements[3]==='flower');assert(v.lifePreview(start).hours===0)});
 check('offline eight hour cap',()=>{const v=make(start);const p=v.lifePreview(start+36*hr);assert(p.hours===8&&p.wood===8&&p.petals===4);assert(v.collectAnts(start+36*hr).ok);assert(!v.collectAnts(start+36*hr).ok);assert(v.snapshot().wood===13)});
 check('partial hour and clock rollback',()=>{const v=make(start);assert(!v.collectAnts(start+hr-1).ok);assert(v.collectAnts(start+hr+1000).ok);assert(!v.collectAnts(start).ok);assert(v.lifePreview(start+2*hr).hours===1)});
 check('daily sign-in once and seven day chest',()=>{const v=make(start);for(let i=0;i<7;i++){const r=v.signIn(start+i*day);assert(r.ok&&r.streak===i+1);assert(!v.signIn(start+i*day).ok)}assert(v.snapshot().chests===1);assert(v.signIn(start+7*day).streak===1)});
 check('missed day resets streak and rollback denied',()=>{const v=make(start);assert(v.signIn(start).ok);assert(v.signIn(start+2*day).streak===1);assert(!v.signIn(start+day).ok)});
 check('daily gather task idempotent and resets',()=>{const v=make(start);assert(!v.claimDaily('gather',start).ok);v.collectAnts(start+hr);assert(v.claimDaily('gather',start+hr).ok);assert(!v.claimDaily('gather',start+hr).ok);assert(!v.claimDaily('gather',start+day).ok)});
 check('new painting only and three-paint task',()=>{const v=make(start);v.award(1);v.award(1);assert(v.lifePreview(start).tasks[0].progress===1);assert(v.claimDaily('paint1',start).ok);assert(!v.claimDaily('paint1',start).ok);v.award(2);v.award(3);assert(v.claimDaily('paint3',start).ok)});
 return results;
}
for(const name of tests(make,assert.ok))console.log('PASS '+name);
