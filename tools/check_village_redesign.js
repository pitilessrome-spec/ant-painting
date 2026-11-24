const fs=require('node:fs'),assert=require('node:assert/strict');
const model=fs.readFileSync(require('node:path').join(__dirname,'../js/village.js'),'utf8');
function make(w,p){let data=JSON.stringify({v:1,wood:w,petals:p,chests:0,placements:{},claimedHigh:0,claimedExtra:[]});const win={};new Function("window","localStorage",model)(win,{getItem:()=>data,setItem:(k,v)=>data=v});return win.AntVillage}
function test(make,assert){
 const result=[];
 function check(name,fn){fn();result.push(name)}
 check("remove level 1 and block double refund",()=>{const v=make(5,2);assert(v.place(3,"flower").ok);assert(v.remove(3,"flower").ok);assert(v.snapshot().wood===5&&v.snapshot().petals===2&&v.count()===0);assert(!v.remove(3,"flower").ok)});
 check("replace after refund; net cost correct",()=>{const v=make(5,3);v.place(3,"flower");assert(v.replace(3,"mushroom","flower").ok);assert(v.snapshot().wood===0&&v.snapshot().petals===0&&v.snapshot().placements[3]==="mushroom"&&v.getLevel(3)===1);assert(!v.replace(3,"mushroom","flower").ok)});
 check("insufficient replacement atomic",()=>{const v=make(5,2);v.place(3,"flower");const before=JSON.stringify(v.snapshot());assert(!v.replace(3,"mushroom","flower").ok);assert(JSON.stringify(v.snapshot())===before)});
 check("level 3 full cost refunded",()=>{const v=make(20,10);assert(v.place(3,"flower").ok&&v.upgrade(3).ok&&v.upgrade(3).ok);assert(v.getLevel(3)===3);const refund=v.refundCost(3);assert(refund.wood===12&&refund.petals===6);assert(v.remove(3,"flower").ok);assert(v.snapshot().wood===20&&v.snapshot().petals===10)});
 check("replace upgraded building resets level",()=>{const v=make(20,10);v.place(3,"flower");v.upgrade(3);assert(v.replace(3,"mushroom","flower").ok);assert(v.getLevel(3)===1&&v.snapshot().wood===15&&v.snapshot().petals===7)});
 check("invalid plot/item and same item rejected",()=>{const v=make(20,10);v.place(3,"flower");const before=JSON.stringify(v.snapshot());assert(!v.replace(3,"flower","flower").ok&&!v.replace(3,"__proto__","flower").ok&&!v.remove(4,"flower").ok);assert(JSON.stringify(v.snapshot())===before)});
 return result;
}
for(const name of test(make,assert.ok))console.log('PASS '+name);
