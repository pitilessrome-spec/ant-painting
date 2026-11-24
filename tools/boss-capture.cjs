const {chromium}=require('playwright'),fs=require('node:fs');(async()=>{
fs.mkdirSync('screenshots',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
page.on('pageerror',e=>console.log('pageerror',e.message));
await page.goto('https://pitilessrome-spec.github.io/ant-painting/?capture=512',{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForFunction(()=>typeof newLevel==='function'&&window.AntBossFX&&window.AntHome,{timeout:30000});
await page.locator('[data-home-action="play"]').first().click({timeout:15000}).catch(()=>{});
await page.evaluate(()=>{MAXLV=40;});
for(const lv of [10,20,30,40]){
 await page.evaluate(l=>newLevel(l),lv);
 await page.waitForTimeout(1500);
 const result=await page.evaluate(()=>({level:LV,boss:G.bossHealth(),home:window.AntHome.isOpen,visible:getComputedStyle(document.querySelector('#stage')).visibility}));
 console.log(JSON.stringify(result));
 if(result.level!==lv||!result.boss.total||result.home||result.visible!=='visible')throw Error('Actual game view unavailable '+lv);
 await page.screenshot({path:'screenshots/boss-'+lv+'.png'});
}
}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});