/* ANT CANVAS — stable, local per-player gallery profile.
 * A profile is local to this browser origin until Telegram account sync is activated.
 * Seed zero preserves all paintings created before personalized mode existed.
 */
(function (global) {
  'use strict';
  const PROFILE_KEY='ant_canvas_profile_v1', COLLECTION_KEY='ant_canvas_collection_v1';
  const MAX_LEVEL=Number.MAX_SAFE_INTEGER-1;
  const own = o=>o&&typeof o==='object'&&!Array.isArray(o);
  function read(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch(_){return null}}
  function write(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true}catch(_){return false}}
  function randomSeed(){
    try{
      const cryptoObj=global.crypto;
      if(cryptoObj&&typeof cryptoObj.getRandomValues==='function'){
        const b=new Uint32Array(1);cryptoObj.getRandomValues(b);return (b[0]||1)>>>0;
      }
    }catch(_){}
    return (((Math.random()*0xffffffff)>>>0)||1);
  }
  function makeProfile(){
    const saved=read(PROFILE_KEY);
    if(own(saved)&&saved.v===1&&Number.isInteger(saved.seed)&&saved.seed>=0&&saved.seed<=0xffffffff)return saved;
    // Old users have already opened/played the game, so their level -> picture mapping must not change.
    const legacy=read('mbh3')!==null;
    const data={v:1,seed:legacy?0:randomSeed(),legacy:legacy,created:Date.now()};
    write(PROFILE_KEY,data);
    return data;
  }
  const profile=makeProfile();
  function hash(n){
    n=(n^(n>>>16))>>>0;n=Math.imul(n,0x7feb352d)>>>0;
    n=(n^(n>>>15))>>>0;n=Math.imul(n,0x846ca68b)>>>0;
    return (n^(n>>>16))>>>0;
  }
  // Stable, cosmetic rarities. They do not change puzzle fairness or player scores.
  function levelSeed(lv,salt){
    let h=hash((Number(salt)||0)^profile.seed^0x811c9dc5);
    const digits=String(Math.floor(Number(lv)||0));
    for(let i=0;i<digits.length;i++)h=Math.imul(h^digits.charCodeAt(i),16777619)>>>0;
    return hash(h);
  }
  function rarity(lv){
    const h=lv<=999999?hash((Math.imul(lv|0,137101)^profile.seed^0x456ab981)>>>0):levelSeed(lv,137101);
    const p=h%1000;
    if(p<6)return {id:'legendary',title:'Legendary',symbol:'👑'};
    if(p<45)return {id:'epic',title:'Epic',symbol:'💎'};
    if(p<205)return {id:'rare',title:'Rare',symbol:'✨'};
    return {id:'common',title:'Classic',symbol:'🎨'};
  }
  function initialCleared(){
    const s=read('mbh3');
    return own(s)&&Number.isFinite(Number(s.maxLv)) ? Math.max(0,Math.min(MAX_LEVEL,Math.floor(Number(s.maxLv))-1)):0;
  }
  let collection=read(COLLECTION_KEY);
  if(!own(collection)||collection.v!==1||collection.seed!==profile.seed){
    collection={v:1,seed:profile.seed,highest:profile.legacy?initialCleared():0,extras:[]};
    write(COLLECTION_KEY,collection);
  }
  if(!Object.prototype.hasOwnProperty.call(collection,'rareCount')){
    // One-time migration; avoid looping over millions of historical levels.
    collection.rareCount=collection.highest>20000?null:0;
    if(collection.rareCount!==null){
      for(let i=1;i<=collection.highest;i++)if(rarity(i).id!=='common')collection.rareCount++;
      for(const i of collection.extras)if(rarity(i).id!=='common')collection.rareCount++;
    }
    write(COLLECTION_KEY,collection);
  }
  function highest(){return Math.max(0,Math.min(MAX_LEVEL,Math.floor(Number(collection.highest)||0)))}
  function contains(lv){return Number.isInteger(lv)&&lv>0&&(lv<=highest()||collection.extras.includes(lv))}
  function complete(lv){
    if(!Number.isSafeInteger(lv)||lv<1||lv>MAX_LEVEL)return false;
    if(contains(lv))return false;
    if(lv===highest()+1){
      collection.highest=lv;
      while(collection.extras.includes(collection.highest+1)){
        collection.highest++;
        collection.extras=collection.extras.filter(x=>x!==collection.highest);
      }
    }else if(collection.extras.length<1000)collection.extras.push(lv);
    else return false;
    if(collection.rareCount!==null&&rarity(lv).id!=='common')collection.rareCount++;
    write(COLLECTION_KEY,collection);
    return true;
  }
  function mastery(lv){return Number(collection.mastery?.[lv])||0}
  function saveMastery(lv,stars){if(!contains(lv)||!Number.isInteger(stars)||stars<1||stars>3||mastery(lv)>=stars)return false;const old=collection.mastery;const next={...(old||{}),[lv]:stars};const keys=Object.keys(next);if(keys.length>2000){for(const k of keys.slice(0,keys.length-2000))if(Number(k)!==lv)delete next[k]};collection.mastery=next;if(!write(COLLECTION_KEY,collection)){collection.mastery=old;return false}return true}
  function count(){return highest()+collection.extras.length}
  function rarityTotal(){return collection.rareCount}
  function displayCode(){return profile.seed===0?'CLASSIC':('ANT-'+profile.seed.toString(16).toUpperCase().padStart(8,'0'))}
  global.AntCanvasProfile=Object.freeze({
    seed:profile.seed,legacy:!!profile.legacy,rarity,contains,complete,highest,count,rarityTotal,displayCode,levelSeed,MAX_LEVEL,mastery,saveMastery
  });
})(typeof window!=='undefined'?window:globalThis);
