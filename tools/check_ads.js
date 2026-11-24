// Run: node tools/check_ads.js. Local SDK stubs only, never real impressions.
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../js/ads.js'),'utf8');
const make=w=>new Function('window','console',source+'\nreturn Ads;')(w,{warn(){}});
async function suite(make,assert){
 const results=[];
 async function run(name,f){await f();results.push(name)}
 function game(){return {cap:4,state:'play',addSlot(){this.cap++}}}
 const flush=async()=>{await Promise.resolve();await Promise.resolve()};
 const w=show=>({Telegram:{WebApp:{initData:"test"}},Adsgram:{init:c=>{assert(c.blockId==="61573"&&c.debug===false);return {show}}}});
 await run("ordinary browser: no ad or reward",async()=>{let calls=0;const a=make({Adsgram:{init(){calls++;return {}}}});await a.init();const g=game();a.rewardedSlotFor(g,()=>true,null,r=>assert(r==="unavailable"));assert(g.cap===4&&calls===0)});
 await run("late SDK recovery",async()=>{const win={Telegram:{WebApp:{initData:"test"}}};const a=make(win);await a.init();const g=game();a.rewardedSlotFor(g,()=>true,null,r=>assert(r==="unavailable"));win.Adsgram=w(()=>Promise.resolve({done:true,error:false})).Adsgram;a.rewardedSlotFor(g,()=>true);await flush();assert(g.cap===5&&a.slotStats.granted===1)});
 await run("concurrent clicks and repeat after reward",async()=>{let calls=0,finish;const a=make(w(()=>{calls++;return new Promise(r=>finish=r)}));await a.init();const g=game();a.rewardedSlotFor(g,()=>true);a.rewardedSlotFor(g,()=>true);assert(a.busy&&calls===1&&g.cap===4);finish({done:true,error:false});await flush();a.rewardedSlotFor(g,()=>true);assert(!a.busy&&g.cap===5&&calls===1&&a.slotStats.granted===1)});
 for(const [name,show] of [["skip",()=>Promise.reject({done:false,error:false})],["incomplete",()=>Promise.resolve({done:false,error:false})],["error",()=>Promise.resolve({done:true,error:true})],["empty response",()=>Promise.resolve(undefined)],["SDK throws",()=>{throw Error("failed")}]])await run(name+": no reward",async()=>{const a=make(w(show));await a.init();const g=game();a.rewardedSlotFor(g,()=>true);await flush();assert(g.cap===4&&!a.busy&&a.slotStats.failed===1&&a.slotStats.granted===0)});
 await run("stale level: no cross-level reward",async()=>{let active=true,finish;const a=make(w(()=>new Promise(r=>finish=r)));await a.init();const g=game();a.rewardedSlotFor(g,()=>active);active=false;finish({done:true,error:false});await flush();assert(g.cap===4&&a.slotStats.stale===1&&a.slotStats.granted===0)});
 await run("free standard boosters",async()=>{let called=0;const a=make({});a.rewarded(()=>called++);assert(called===1)});
 await run("new attempt can earn a slot",async()=>{const a=make(w(()=>Promise.resolve({done:true,error:false})));await a.init();const g=game(),h=game();a.rewardedSlotFor(g,()=>true);await flush();a.rewardedSlotFor(h,()=>true);await flush();assert(g.cap===5&&h.cap===5&&a.slotStats.granted===2)});
 return results;
}
suite(make,assert.ok).then(r=>{r.forEach(n=>console.log('PASS '+n));console.log(r.length+' checks passed');},e=>{console.error(e);process.exitCode=1;});
