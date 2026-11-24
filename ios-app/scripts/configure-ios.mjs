import {execFileSync} from 'node:child_process';
import {readFileSync,existsSync,writeFileSync} from 'node:fs';
import {config} from './config.mjs';
import {baiduConfig} from './baidu-config.mjs';
const p='ios/App/App/Info.plist',conf=config();if(!existsSync(p))throw Error('Run npm run ios:add first');
const built=JSON.parse(readFileSync('www/native-build.json','utf8'));if(built.ads!==(conf.test?'test':'production')||built.appId!==conf.appId||built.rewardedId!==conf.rewardedId)throw Error('Build and native AdMob mode mismatch');
function set(key,type,value){try{execFileSync('/usr/libexec/PlistBuddy',['-c','Set :'+key+' '+value,p],{stdio:'pipe'})}catch(_){execFileSync('/usr/libexec/PlistBuddy',['-c','Add :'+key+' '+type+' '+value,p],{stdio:'inherit'})}}
set('GADApplicationIdentifier','string',conf.appId);
set('CFBundleDisplayName','string','ANT CANVAS');
if(JSON.stringify(built.baidu)!==JSON.stringify(baiduConfig()))throw Error('Build and Baidu configuration mismatch');
const appDelegate='ios/App/App/AppDelegate.swift',story='ios/App/App/Base.lproj/Main.storyboard';
const marker='// BEGIN ANT REGION PLUGIN';
const source=readFileSync(appDelegate,'utf8').split(marker)[0].trimEnd();
writeFileSync(appDelegate,source+'\n\n'+marker+'\n'+readFileSync('native/AntRegion.swift','utf8')+'\n');
let storyboard=readFileSync(story,'utf8');
if(!storyboard.includes('customClass="AntViewController"')){const old=storyboard;storyboard=storyboard.replace(/customClass="CAPBridgeViewController"\s+customModule="Capacitor"/,'customClass="AntViewController" customModule="App" customModuleProvider="target"');if(storyboard===old)throw Error('Generated storyboard changed; configure AntViewController explicitly');writeFileSync(story,storyboard)}

// Tracking permission is not requested in V0.1; consent is requested before ads.
console.log('AdMob plist configured. Before production, audit privacy manifests, SKAdNetwork IDs, age rating and signing.');
