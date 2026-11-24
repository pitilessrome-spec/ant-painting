export const BAIDU_TEST=Object.freeze({appId:'d83eff1f',placementId:'20892820',channelId:'12022'});
export function baiduConfig(env=process.env){
 if(env.ANT_ADS_MODE!=='production')return {...BAIDU_TEST,test:true,enabled:true};
 const appId=env.ANT_BAIDU_APP_ID||'',placementId=env.ANT_BAIDU_PLACEMENT_ID||'';
 if(!appId&&!placementId)return {test:false,enabled:false};
 if(!/^[a-zA-Z0-9]+$/.test(appId)||!/^\d+$/.test(placementId)||appId===BAIDU_TEST.appId||placementId===BAIDU_TEST.placementId)throw Error('Production Baidu requires approved non-test IDs');
 return {appId,placementId,test:false,enabled:true};
}
