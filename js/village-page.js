/* ANT CANVAS — village workshop interactions, all cosmetic rewards are local. */
(function(){
 'use strict';
 const $=id=>document.getElementById(id),V=window.AntVillage;if(!V)return;
 let plot=null,item=null;
 function render(){
   const state=V.snapshot();
   $('wood').textContent=state.wood.toLocaleString();
   $('petals').textContent=state.petals.toLocaleString();
   $('chests').textContent=state.chests.toLocaleString();
   $('placed').textContent=V.count()+' / 8';
   const plots=$('plots');plots.replaceChildren();
   for(let i=0;i<9;i++){
     const b=document.createElement('button');b.type='button';
     if(i===4){b.className='plot home';b.disabled=true;b.innerHTML='<span aria-hidden="true">🐜</span>';b.setAttribute('aria-label','The central ant colony');plots.appendChild(b);continue}
     const deco=state.placements[i],selected=plot===i;
     b.className='plot '+(deco?'built':'empty')+(selected?' selected':'');
     b.setAttribute('aria-label',deco?'Plot '+(i+1)+': '+V.catalog[deco].name:'Empty plot '+(i+1));
     if(deco){b.textContent=V.catalog[deco].symbol}else{b.textContent=selected?'✨':'+';b.addEventListener('click',()=>{plot=i;render()})}
     const label=document.createElement('span');label.className='slot-label';label.textContent=deco?V.catalog[deco].name:('Plot '+(i+1));
     b.appendChild(label);plots.appendChild(b);
   }
   const shop=$('shop');shop.replaceChildren();
   for(const [id,x]of Object.entries(V.catalog)){
     const b=document.createElement('button');b.type='button';b.className='item'+(item===id?' selected':'');
     b.setAttribute('aria-pressed',item===id?'true':'false');
     b.innerHTML='<span class="emo" aria-hidden="true">'+x.symbol+'</span><b>'+x.name+'</b><span>🪵 '+x.wood+' · 🌸 '+x.petals+'</span>';
     b.addEventListener('click',()=>{item=id;render()});shop.appendChild(b);
   }
   const canBuy=plot!==null&&item!==null&&!state.placements[plot];
   const build=$('build');build.disabled=!canBuy;
   if(!canBuy)build.textContent='Select a plot + decoration';
   else{
     const selected=V.catalog[item];
     build.textContent='Build '+selected.name+' 🛠️';
   }
 }
 $('build').addEventListener('click',()=>{
   if(plot===null||item===null)return;
   const result=V.place(plot,item);
   $('message').textContent=result.ok?'🎉 '+V.catalog[item].name+' built! Your village is growing.':'⚠️ '+result.error;
   if(result.ok){plot=null;item=null}
   render();
 });
 render();
})();
