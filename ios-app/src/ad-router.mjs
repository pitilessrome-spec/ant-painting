// No cross-region fallback, no startup ad request, no reward on failure.
export function chooseProvider({storefront,networkCountry}={}){
 const norm=x=>typeof x==='string'&&/^[A-Z]{2,3}$/.test(x.toUpperCase())&&!['XX','ZZ','UNK'].includes(x.toUpperCase())?x.toUpperCase():'';
 const a=norm(storefront),b=norm(networkCountry);
 if(['CN','CHN'].includes(a)||['CN','CHN'].includes(b))return 'baidu';
 return a||b?'admob':'none';
}
export function createAdRouter({region,admob,baidu}){
 let busy=false,last={provider:'none',outcome:'idle'};
 const inspect=async()=>{try{return chooseProvider(await region())}catch{return 'none'}};
 const adapterFor=p=>({admob,baidu}[p]);
 async function show(){if(busy)return false;busy=true;let provider='none';try{provider=await inspect();const adapter=adapterFor(provider);if(!adapter||adapter.available===false){last={provider,outcome:'unavailable'};return false}const earned=await adapter.show();last={provider,outcome:earned===true?'earned':'not-earned'};return earned===true}catch{last={provider,outcome:'failed'};return false}finally{busy=false}}
 async function privacy(){if(busy)return false;busy=true;try{return await adapterFor(await inspect())?.privacy?.()===true}catch{return false}finally{busy=false}}
 async function status(){const provider=await inspect(),a=adapterFor(provider);return {provider,available:!!a&&a.available!==false,last:{...last}}}
 return Object.freeze({show,privacy,status,get busy(){return busy}})
}
export function createBaiduAdapter({plugin,available,config,consent}){
 let busy=false,blocked=false;
 return {get available(){return !blocked&&config.enabled===true&&available()===true},async show(){if(busy||!this.available)return false;busy=true;let timer;try{if(!await consent())return false;const r=await Promise.race([plugin.showReward({appId:config.appId,placementId:config.placementId,test:config.test}),new Promise(resolve=>{timer=setTimeout(()=>{blocked=true;resolve(null)},300000)})]);return r?.earned===true&&r?.closed===true&&r?.playbackComplete===true}catch{return false}finally{clearTimeout(timer);busy=false}},async privacy(){return false}}
}
