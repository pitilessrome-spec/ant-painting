/* Admin-only official export import. Platform aggregate, not a settlement statement. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.AntAdReport=api})(typeof window==='undefined'?globalThis:window,function(){
'use strict';
const name='ANT CANVAS';
function csvRows(raw,delimiter){
 let rows=[],row=[],cell='',quoted=false,closed=false;raw=raw.replace(/^\uFEFF/,'');
 for(let i=0;i<raw.length;i++){const c=raw[i];if(quoted){if(c==='"'){if(raw[i+1]==='"'){cell+='"';i++}else{quoted=false;closed=true}}else cell+=c;continue}
 if(c==='"'&&!cell&&!closed){quoted=true;continue}
 if(c===delimiter||c==='\n'||c==='\r'){row.push(cell);cell='';closed=false;if(c!==delimiter){if(c==='\r'&&raw[i+1]==='\n')i++;if(row.some(s=>s.trim()))rows.push(row);row=[]}continue}
 if(closed||c==='"')throw Error('Invalid CSV quoting');cell+=c}
 if(quoted)throw Error('Incomplete CSV quotes');row.push(cell);if(row.some(s=>s.trim()))rows.push(row);return rows;
}
function date(s){if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s))throw Error('Choose the exact export start and end dates');const d=new Date(s+'T00:00:00Z');if(!Number.isFinite(+d)||d.toISOString().slice(0,10)!==s)throw Error('Invalid date');return s}
function parse(raw,from,to){
 date(from);date(to);if(from>to||to>new Date(Date.now()+86400000).toISOString().slice(0,10))throw Error('Invalid report date range');
 if(typeof raw!=='string'||!raw.trim()||raw.length>200000)throw Error('CSV must be nonempty and at most 200 KB');
 const norm=s=>s.trim().toLowerCase().replace(/\s+/g,' ');
 const header=raw.replace(/^\uFEFF/,'').split(/\r?\n/,1)[0];const delimiter=header.includes('\t')?'\t':header.includes(';')&&!header.includes(',')?';':',';
 const [head,...rows]=csvRows(raw,delimiter);const headers=head.map(norm);
 const idx=aliases=>{const matches=headers.map((x,i)=>aliases.includes(x)?i:-1).filter(x=>x>=0);return matches.length===1?matches[0]:-1};
 const a=idx(['name','platform','platform name','application','app name']),b=idx(['impressions','impression','views']),c=idx(['earned','earnings','earned usdt','earned, usdt','earnings usdt','revenue','revenue usdt','earned, usd₮','earned, $','earned (usdt)','earnings (usdt)']);
 if(Math.min(a,b,c)<0)throw Error('Unknown CSV columns. Export Platforms report with Name, Impressions, Earned; send sample for adaptation if needed.');
 // A platform summary is exactly one row; never sum possible overlapping periods or totals.
 const matches=rows.filter(r=>[name,'TMA '+name].map(norm).includes(norm(r[a]||'')));if(matches.length!==1)throw Error('CSV must contain exactly one ANT CANVAS platform total');
 const row=matches[0];if(row.length!==head.length)throw Error('Invalid row width');
 const im=row[b].trim(),earned=row[c].trim().replace(/^\$\s*/,'').replace(/\s*(USDT|USD₮)$/i,'');
 if(!/^(?:0|[1-9]\d{0,11}|[1-9]\d{0,2}(?:,\d{3})+)$/.test(im)||!/^\d{1,12}(?:\.\d{1,8})?$/.test(earned))throw Error('Invalid or missing report metrics (use decimal point)');
 const impressions=Number(im.replace(/,/g,'')),revenue=Number(earned);if(!Number.isSafeInteger(impressions)||impressions>1e12||!Number.isFinite(revenue)||revenue>1e12)throw Error('Metric out of range');
 return {platform:name,from,to,impressions,revenue:earned,source:'admin_csv',currency:'USDT'};
}
return Object.freeze({parse});
});
