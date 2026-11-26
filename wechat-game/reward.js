'use strict';
// One outstanding ad; only an explicit completed-close callback grants a reward.
function createReward(wx,id){
 let ad=null,pending=null,blocked=false;
 const available=()=>!blocked&&typeof id==='string'&&/^adunit-[0-9a-zA-Z]+$/.test(id)&&typeof wx.createRewardedVideoAd==='function';
 const settle=v=>{if(!pending)return;const p=pending;pending=null;clearTimeout(p.timer);p.resolve(v===true)};
 async function show(){
  if(!available()||pending)return false;
  try{if(!ad){ad=wx.createRewardedVideoAd({adUnitId:id});ad.onClose(r=>settle(r?.isEnded===true));ad.onError(()=>settle(false))}
   return await new Promise(resolve=>{const op={resolve,timer:null};pending=op;op.timer=setTimeout(()=>{blocked=true;settle(false)},180000);
   Promise.resolve().then(()=>ad.show()).catch(()=>pending===op?Promise.resolve(ad.load()).then(()=>pending===op?ad.show():undefined):undefined).catch(()=>{if(pending===op)settle(false)})});
  }catch(_){settle(false);return false}
 }
 return {available,show,get busy(){return !!pending}};
}
module.exports={createReward};