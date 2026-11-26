import {readFile,writeFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url),a=await readFile(new URL('js/art.js',root),'utf8'),g=await readFile(new URL('js/game.js',root),'utf8');
await writeFile(new URL('core.js',import.meta.url),a+'\n'+g+'\nmodule.exports={makeGame,SKILL_TYPES,iceLocked,bossLocked,treasureLocked};\n');
console.log('Generated shared puzzle core from main sources.');
const village=await readFile(new URL('js/village.js',root),'utf8');
await writeFile(new URL('village-core.js',import.meta.url),"const localStorage={getItem:k=>wx.getStorageSync(k)||null,setItem:(k,v)=>wx.setStorageSync(k,v)};const window={};\n"+village+"\nmodule.exports=window.AntVillage;\n");
import {mkdir,copyFile} from 'node:fs/promises';await mkdir(new URL('maps/',import.meta.url),{recursive:true});for(const k of ['garden','forest','island','snow'])await copyFile(new URL('assets/maps/v36/'+k+'.webp',root),new URL('maps/'+k+'.webp',import.meta.url));
console.log('Generated shared V7 colony engine and bundled original maps. Raid omitted.');
