/* ANT CANVAS — headless mystery progress.
   Main board already displays the puzzle, so do not place a redundant preview on top.
   Special bonus artwork is genuinely hidden until every fifth level is completed.
 */
(function(){
'use strict';
let level=0,total=0,mask=null,count=0;
function begin(game){
 level=game?game.lv:0;
 total=game?game.n*game.n:0;
 mask=game?new Uint8Array(total):null;
 count=0;
}
function reveal(i){
 if(!mask||!Number.isInteger(i)||i<0||i>=total||mask[i])return;
 mask[i]=1;count++;
}
function complete(){count=total;mask=null;}
function show(){}function hide(){}
window.AntMystery=Object.freeze({begin,reveal,complete,show,hide,
 get count(){return count},get size(){return total},
 get secretUnlocked(){return level>0&&level%5===0&&count===total}});
})();
