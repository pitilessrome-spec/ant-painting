export function nativeHTML(html,page){
 let s=html.replace(/<script\s+src="https:\/\/(?:telegram\.org|sad\.adsgram\.ai)\/[^"]+"\s*><\/script>/g,'').replace(/<script\s+src="js\/(?:telegram|village-guests)\.js[^"]*"\s*><\/script>/g,'');
 const script='<script src="js/native-runtime.js"></script>';
 // Classic IIFE must execute before Ads.init and before the main UI.
 if(/<script\s+src="js\/ads\.js/.test(s))s=s.replace(/<script\s+src="js\/ads\.js/,script+'\n<script src="js/ads.js');else s=s.replace('</body>',script+'</body>');
 s=s.replace(/href="social\.html[^"]*"/g,'href="native-settings.html"').replace(/☁️ Friends &amp; Cloud|Friends &amp; festival/g,'⚙️ Settings').replace('🐜 Friends can visit your shared village','🐜 Your colony is stored on this device').replace('Cross-device Telegram saving requires the connected backend.','iOS guest progress is saved locally; cloud sync is not available in this build.');
 if(page==='guide.html'){s=s.replace(/Telegram players can opt into[^<]+/,'Independent iOS guest mode stores progress on this device. Cloud sync and online social features are not yet enabled.').replace(/通过 Telegram 好友与云端入口体验备份、互访及装饰比赛。/,'独立 iOS 版暂为游客本地存档，好友及云端同步尚未开放。').replace(/跨设备需要主动备份和恢复。/,'暂不支持跨设备同步。').replace(/href="https:\/\/t\.me\/AntCanvasArtBot\/antcanvas">Telegram game/g,'href="native-settings.html">App settings').replace('AdsGram rewards','AdMob rewards')}
 return s
}
export function nativeAds(s){s=s.replace("provider: 'adsgram', // production rewarded fifth slot; ordinary boosters remain free","provider: 'native-ios', // independent iOS native rewarded ads");
 s=s.replace("async init() {","async init() {\n    if(this.provider==='native-ios'){this.ready=window.AntNative?.isIOS===true;return;}");
 s=s.replace("canRewardSlot() {","canRewardSlot() {\n    if(this.provider==='native-ios')return this.ready&&window.AntNative?.isIOS===true;");
 s=s.replace("try{Promise.resolve(this.rwdCtrl.show())","if(this.provider==='native-ios'){try{Promise.resolve(window.AntNative.showReward()).then(earned=>earned===true?success():failure(),failure)}catch(_){failure()}return;}\n    try{Promise.resolve(this.rwdCtrl.show())");
 if(!s.includes("provider: 'native-ios'")||!s.includes("window.AntNative.showReward()"))throw Error('Shared ads adapter changed; review native patches');
 return s
}
export function nativeHome(s){return s.replace("function share() {","function share() {\n    if(window.AntNative?.isIOS){window.AntNative.share();return;}").replace("if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback)","if(window.AntNative?.isIOS)window.AntNative.haptic();\n    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback)").replaceAll('V5.0.1 RC','iOS V0.1').replace("data-home-action='how'>❔ Help","data-home-action='how'>❔ Help").replace("📖 Full game guide</button>","📖 Full game guide</button><button type='button' class='ah-how-back' data-home-action='settings'>⚙️ Settings</button>").replace("else if (action === 'guide')","else if (action === 'settings') { navigate('native-settings.html','settings'); }\n    else if (action === 'guide')")}
