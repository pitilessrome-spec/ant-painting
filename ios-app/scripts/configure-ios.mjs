import {execFileSync} from 'node:child_process';
import {readFileSync,existsSync} from 'node:fs';
import {config} from './config.mjs';
const p='ios/App/App/Info.plist',conf=config();if(!existsSync(p))throw Error('Run npm run ios:add first');
const built=JSON.parse(readFileSync('www/native-build.json','utf8'));if(built.ads!==(conf.test?'test':'production')||built.appId!==conf.appId||built.rewardedId!==conf.rewardedId)throw Error('Build and native AdMob mode mismatch');
function set(key,type,value){try{execFileSync('/usr/libexec/PlistBuddy',['-c','Set :'+key+' '+value,p],{stdio:'pipe'})}catch(_){execFileSync('/usr/libexec/PlistBuddy',['-c','Add :'+key+' '+type+' '+value,p],{stdio:'inherit'})}}
set('GADApplicationIdentifier','string',conf.appId);
set('CFBundleDisplayName','string','ANT CANVAS');
// Tracking permission is not requested in V0.1; consent is requested before ads.
console.log('AdMob plist configured. Before production, audit privacy manifests, SKAdNetwork IDs, age rating and signing.');
