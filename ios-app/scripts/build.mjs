import {cp,mkdir,readFile,writeFile,rm,readdir} from 'node:fs/promises';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {config} from './config.mjs';
import {baiduConfig} from './baidu-config.mjs';
import {nativeHTML,nativeAds,nativeHome} from './platform.mjs';
const here=resolve(dirname(fileURLToPath(import.meta.url)),'..'),root=resolve(here,'..'),out=join(here,'www'),conf={...config(),baidu:baiduConfig()};
await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
for(const dir of ['assets','css','vendor','js'])await cp(join(root,dir),join(out,dir),{recursive:true,filter:src=>!/(?:telegram|village-guests)\.js$/.test(src)});
for(const page of ['index.html','village.html','collection.html','gallery.html','guide.html','terms.html','privacy.html'])await writeFile(join(out,page),nativeHTML(await readFile(join(root,page),'utf8'),page));
for(const [name,transform] of [['ads.js',nativeAds],['home.js',nativeHome]]){const p=join(out,'js',name);await writeFile(p,transform(await readFile(p,'utf8')))}
const ui=join(out,'js/ui.js');await writeFile(ui,(await readFile(ui,'utf8')).replace('Open ANT CANVAS in Telegram to unlock this slot','Rewarded ad unavailable · please try again'));
await writeFile(join(here,'src/ad-config.generated.json'),JSON.stringify(conf));
await build({entryPoints:[join(here,'src/native-entry.mjs')],bundle:true,format:'iife',platform:'browser',target:'safari15',outfile:join(out,'js/native-runtime.js'),minify:true});
await cp(join(here,'pages'),out,{recursive:true});
await writeFile(join(out,'native-build.json'),JSON.stringify({version:'0.5.0',ads:conf.test?'test':'production',appId:conf.appId,rewardedId:conf.rewardedId,baidu:conf.baidu,offline:true}));
for(const page of ['index.html','village.html','collection.html','guide.html','native-settings.html']){const html=await readFile(join(out,page),'utf8');if(/<script[^>]+src="https?:\/\//i.test(html))throw Error('Remote runtime script in '+page);for(const match of html.matchAll(/<script[^>]+src="([^"]+)"/g)){const rel=match[1].split('?')[0];await readFile(join(out,rel))}}
console.log('Packaged local iOS game assets. Ads mode: '+(conf.test?'TEST':'PRODUCTION'));
