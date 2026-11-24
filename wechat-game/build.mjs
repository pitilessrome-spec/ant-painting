import {readFile,writeFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url),a=await readFile(new URL('js/art.js',root),'utf8'),g=await readFile(new URL('js/game.js',root),'utf8');
await writeFile(new URL('core.js',import.meta.url),a+'\n'+g+'\nmodule.exports={makeGame,SKILL_TYPES,iceLocked,bossLocked,treasureLocked};\n');
console.log('Generated shared puzzle core from main sources.');