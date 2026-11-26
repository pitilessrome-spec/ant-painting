import {execFileSync} from 'node:child_process';
import {readFileSync,existsSync,writeFileSync} from 'node:fs';
import {config} from './config.mjs';
import {baiduConfig} from './baidu-config.mjs';
const p='ios/App/App/Info.plist',conf=config();if(!existsSync(p))throw Error('Run npm run ios:add first');
const built=JSON.parse(readFileSync('www/native-build.json','utf8'));if(built.ads!==(conf.test?'test':'production')||built.appId!==conf.appId||built.rewardedId!==conf.rewardedId)throw Error('Build and native AdMob mode mismatch');
function set(key,type,value){try{execFileSync('/usr/libexec/PlistBuddy',['-c','Set :'+key+' '+value,p],{stdio:'pipe'})}catch(_){execFileSync('/usr/libexec/PlistBuddy',['-c','Add :'+key+' '+type+' '+value,p],{stdio:'inherit'})}}
set('GADApplicationIdentifier','string',conf.appId);
set('CFBundleDisplayName','string','ANT CANVAS');
execFileSync('swift',['scripts/make-brand.swift'],{stdio:'inherit'});
set('CFBundleShortVersionString','string','0.7.0');
set('CFBundleVersion','string','7');
if(JSON.stringify(built.baidu)!==JSON.stringify(baiduConfig()))throw Error('Build and Baidu configuration mismatch');
const appDelegate='ios/App/App/AppDelegate.swift',story='ios/App/App/Base.lproj/Main.storyboard';
const marker='// BEGIN ANT REGION PLUGIN';
const source=readFileSync(appDelegate,'utf8').split(marker)[0].trimEnd();
const nativeBaidu=process.env.ANT_BAIDU_NATIVE==='1';
if(nativeBaidu&&!built.baidu?.enabled)throw Error('Baidu native build requires configured IDs');
let regionSource=readFileSync('native/AntRegion.swift','utf8');
if(nativeBaidu){regionSource=regionSource.replace('bridge?.registerPluginInstance(AntRegionPlugin())','bridge?.registerPluginInstance(AntRegionPlugin())\n        bridge?.registerPluginInstance(AntBaiduAdsPlugin())')+'\n'+readFileSync('native/AntBaiduPlugin.swift','utf8');try{execFileSync('/usr/libexec/PlistBuddy',['-c','Delete :AntBaiduConfig',p],{stdio:'pipe'})}catch(_){}execFileSync('/usr/libexec/PlistBuddy',['-c','Add :AntBaiduConfig dict',p]);set('AntBaiduConfig:appId','string',built.baidu.appId);set('AntBaiduConfig:placementId','string',built.baidu.placementId);set('AntBaiduConfig:test','bool',String(built.baidu.test));}

writeFileSync(appDelegate,source+'\n\n'+marker+'\n'+regionSource+'\n');
let storyboard=readFileSync(story,'utf8');
if(!storyboard.includes('customClass="AntViewController"')){const old=storyboard;storyboard=storyboard.replace(/customClass="CAPBridgeViewController"\s+customModule="Capacitor"/,'customClass="AntViewController" customModule="App" customModuleProvider="target"');if(storyboard===old)throw Error('Generated storyboard changed; configure AntViewController explicitly');writeFileSync(story,storyboard)}

// Tracking permission is not requested in V0.1; consent is requested before ads.
console.log('AdMob plist configured. Before production, audit privacy manifests, SKAdNetwork IDs, age rating and signing.');

if(nativeBaidu){execFileSync('ruby',['scripts/install-baidu.rb'],{stdio:'inherit'});writeFileSync('ios/App/Podfile',readFileSync('native/Podfile.baidu','utf8'));execFileSync('pod',['install'],{cwd:'ios/App',stdio:'inherit'});execFileSync('ruby',['scripts/integrate-baidu.rb'],{stdio:'inherit'})}
