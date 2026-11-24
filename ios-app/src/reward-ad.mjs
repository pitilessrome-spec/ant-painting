// No reward from elapsed time, ad dismissal alone, or SDK load success.
export function createRewardAd({sdk,events,consentStatus,adId,test=true}){
 let busy=false,initialized=false,consent=false,blocked=false;
 async function bounded(operation,ms){let timer;try{return await Promise.race([Promise.resolve().then(operation),new Promise((_,reject)=>{timer=setTimeout(()=>{blocked=true;reject(Error('SDK timeout'))},ms)})])}finally{clearTimeout(timer)}}
 async function ensureConsent(){let info=await bounded(()=>sdk.requestConsentInfo(),10000);if(info.isConsentFormAvailable&&info.status===consentStatus.REQUIRED)info=await sdk.showConsentForm();consent=info.canRequestAds===true;if(!consent)return false;if(!initialized){await bounded(()=>sdk.initialize(),10000);initialized=true}return true}
 async function show(){if(busy||blocked)return false;busy=true;const listeners=[];let settle=null,timer=null;try{if(!await ensureConsent())return false;await bounded(()=>sdk.prepareRewardVideoAd({adId,isTesting:test,npa:true}),12000);
 return await new Promise(async resolve=>{let earned=false,finished=false;const finish=value=>{if(finished)return;finished=true;clearTimeout(timer);resolve(value===true)};settle=finish;
 try{listeners.push(await sdk.addListener(events.Rewarded,()=>{if(!finished)earned=true}));listeners.push(await sdk.addListener(events.Dismissed,()=>finish(earned)));listeners.push(await sdk.addListener(events.FailedToShow,()=>finish(false)));
 timer=setTimeout(()=>{blocked=true;finish(false)},300000);Promise.resolve(sdk.showRewardVideoAd({adId})).then(reward=>{if(!finished&&reward&&typeof reward.amount==='number'&&reward.amount>0)earned=true},()=>finish(false));
 }catch(_){finish(false)}})
 }catch(_){return false}finally{clearTimeout(timer);if(settle)settle(false);for(const l of listeners)try{await l.remove()}catch(_){}busy=false}}
 async function privacy(){if(busy)return false;busy=true;try{await sdk.showPrivacyOptionsForm();return true}catch(_){return false}finally{busy=false}}
 return Object.freeze({show,privacy,get busy(){return busy},get consent(){return consent}})
}
