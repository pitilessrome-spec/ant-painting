import {Capacitor} from '@capacitor/core';
import {AdMob,RewardAdPluginEvents,AdmobConsentStatus} from '@capacitor-community/admob';
import {Haptics,ImpactStyle} from '@capacitor/haptics';
import {Share} from '@capacitor/share';
import {createRewardAd} from './reward-ad.mjs';
import config from './ad-config.generated.json';
const isIOS=Capacitor.isNativePlatform()&&Capacitor.getPlatform()==='ios';
const ads=createRewardAd({sdk:AdMob,events:RewardAdPluginEvents,consentStatus:AdmobConsentStatus,adId:config.rewardedId,test:config.test});
window.AntNative=Object.freeze({isIOS,adTest:config.test,showReward:()=>isIOS?ads.show():Promise.resolve(false),privacy:()=>isIOS?ads.privacy():Promise.resolve(false),haptic:()=>{if(isIOS)Haptics.impact({style:ImpactStyle.Light}).catch(()=>{})},share:()=>isIOS?Share.share({title:'ANT CANVAS',text:'Little ants. Big art. A world to grow.'}).catch(()=>{}):Promise.resolve()});
