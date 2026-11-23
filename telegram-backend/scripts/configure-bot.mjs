// Run only after BotFather has created a bot and the HTTPS API is deployed.
// Read secrets from a protected environment, never commit them.
const token=process.env.TELEGRAM_BOT_TOKEN;
const secret=process.env.TELEGRAM_WEBHOOK_SECRET;
const base=process.env.API_BASE_URL;
if(!token||!secret||!base||!base.startsWith('https://')) throw Error('Missing secure Telegram deployment environment');
const api=async(method,data)=>{
 const r=await fetch('https://api.telegram.org/bot'+token+'/'+method,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
 const parsed=await r.json();
 if(!parsed.ok)throw Error(method+' failed: '+parsed.description);
 return parsed.result;
};
await api('setWebhook',{url:base.replace(/\/$/,'')+'/api/webhook',secret_token:secret,allowed_updates:['message','callback_query'],drop_pending_updates:false});
await api('setChatMenuButton',{menu_button:{type:'web_app',text:'🎮 Play ANT CANVAS',web_app:{url:'https://pitilessrome-spec.github.io/ant-painting/'}}});
console.log('Telegram webhook and game menu configured');
