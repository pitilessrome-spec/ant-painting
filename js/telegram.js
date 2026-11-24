/* ANT CANVAS Telegram integration. No bot credentials are ever embedded in a web page. */
(function () {
  'use strict';
  const CONFIG = Object.freeze({
    botUsername: 'AntCanvasArtBot',
    miniAppShortName: 'antcanvas',
    apiBaseUrl: 'https://ant-canvas-telegram-api.vercel.app' // Public HTTPS API, bot and DB secrets live only on backend
  });
  const GAME_URL = 'https://pitilessrome-spec.github.io/ant-painting/';
  const tg = (window.Telegram && window.Telegram.WebApp) || null;
  const active = !!(tg && tg.initData);
  let validated = false;
  let connecting=false,authNote='';
  let playerId = '',playerName='',namePublic=null;
  let bestOnline = 0;
  let busy = false;
  let isPanelOpen = false;
  const tickets = new Map();
  const $ = (s) => document.querySelector(s);

  const safeText = (value) => String(value || '').slice(0, 80);
  function currentLevel() {
    try { const s = JSON.parse(localStorage.getItem('mbh3') || '{}'); return Number(s.maxLv) || 1; }
    catch (_) { return 1; }
  }
  function makePanel() {
    if ($('#telegram-hub')) return;
    const css = document.createElement('style');
    css.textContent = `
      #tgtools{position:absolute;right:15px;top:47px;z-index:42;display:flex;gap:7px}
      .tgchip{border:1px solid #ffffffb0;color:#28446e;cursor:pointer;padding:6px 10px;font-size:11px;font-weight:800;background:#ffffffe0;border-radius:18px;box-shadow:0 2px 7px #234a7040}
      #telegram-hub{display:none;position:absolute;inset:0;z-index:85;background:#132343ad;align-items:center;justify-content:center}
      #telegram-hub.on{display:flex}
      #telegram-hub .tgpanel{width:316px;max-height:570px;overflow:auto;padding:21px 16px;border-radius:24px;background:linear-gradient(180deg,#fbfdff,#e7f3ff);box-shadow:0 12px 38px #0c214d70;color:#223a60;text-align:center}
      #telegram-hub h2{font-size:22px;margin:2px 0 6px}
      #telegram-hub .tgsmall{font-size:12px;line-height:1.5;margin:7px 0 12px;color:#5d708e}
      #telegram-hub .tgstats{display:flex;gap:9px;margin:12px 0}
      #telegram-hub .tgstat{flex:1;background:#fff;border-radius:12px;padding:10px 5px;font-size:11px}
      #telegram-hub .tgstat strong{font-size:25px;display:block;color:#286aa8}
      #telegram-hub .tgbtn{width:100%;border:0;background:#2b91dc;color:#fff;padding:11px 8px;margin:6px 0;border-radius:13px;font-weight:850;cursor:pointer;font-size:13px}
      #telegram-hub .tgbtn.secondary{background:#e0eefa;color:#316085}
      #tg-ranks{list-style:none;padding:0;margin:9px 0;text-align:left;font-size:12px}
      #tg-ranks li{display:flex;justify-content:space-between;padding:9px;border-bottom:1px solid #ccdfed}
      #telegram-hub .tgbadge{font-size:10px;color:#49698c}
      #tg-toast{font-size:12px;color:#2b6b86;min-height:14px}
    `;
    document.head.appendChild(css);
    const tools = document.createElement('div');
    tools.id = 'tgtools';
    tools.innerHTML = '<button class="tgchip" id="tg-profile-btn" type="button">🏆 Scores</button><button class="tgchip" id="tg-share-btn" type="button">↗ Share</button>';
    $('#stage').appendChild(tools);
    const overlay = document.createElement('div');
    overlay.id = 'telegram-hub';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-label', 'ANT CANVAS player dashboard');
    overlay.innerHTML = `
      <div class="tgpanel">
        <h2>🐜 ANT CANVAS</h2>
        <div id="tg-account" class="tgsmall">Your game progress</div>
        <div class="tgstats"><div class="tgstat">Local best<strong id="tg-local-best">1</strong>level reached</div><div class="tgstat">Telegram best<strong id="tg-global-best">—</strong>level cleared</div></div>
        <div id="tg-online-note" class="tgsmall">Online ranking requires a registered Telegram bot and secure sign-in.</div>
        <h3 style="font-size:14px;text-align:left;margin:15px 0 5px">🏆 Global leaderboard</h3>
        <ol id="tg-ranks"><li>Waiting for Telegram game service</li></ol>
        <div id="tg-name-settings" hidden style="text-align:left;background:#fff;border-radius:12px;padding:10px;margin:8px 0">
          <p class="tgsmall" id="tg-name-note"></p>
          <button class="tgbtn secondary" id="tg-name-show" type="button">Show my Telegram name</button>
          <button class="tgbtn secondary" id="tg-name-hide" type="button">Use anonymous name</button>
        </div>
        <button class="tgbtn" id="tg-invite" type="button">Invite friends</button>
        <button class="tgbtn secondary" id="tg-cloud" type="button">☁️ Friends &amp; Cloud</button>
        <button class="tgbtn secondary" id="tg-online-start" type="button" hidden>Play verified level</button>
        <button class="tgbtn secondary" id="tg-refresh" type="button">Refresh rankings</button>
        <button class="tgbtn secondary" id="tg-close" type="button">Continue playing</button>
        <p id="tg-toast"></p>
        <p class="tgbadge">Telegram identity is verified on the server; your browser's saved game stays available.</p>
        <p class="tgbadge"><a href="privacy.html" target="_blank" rel="noopener noreferrer">Privacy Policy</a> · <a href="terms.html" target="_blank" rel="noopener noreferrer">Terms</a></p>
      </div>`;
    $('#stage').appendChild(overlay);
    $('#tg-profile-btn').addEventListener('click', openPanel);
    $('#tg-share-btn').addEventListener('click', share);
    $('#tg-invite').addEventListener('click', share);
    $('#tg-name-show').addEventListener('click',()=>setNamePreference(true));
    $('#tg-name-hide').addEventListener('click',()=>setNamePreference(false));
    $('#tg-cloud').addEventListener('click',()=>{location.href='social.html?v=hall-v32'});
    $('#tg-refresh').addEventListener('click', () => validated ? fetchRanks() : connect());
    $('#tg-online-start').addEventListener('click', () => { closePanel(); if (typeof window.newLevel === 'function') window.newLevel(bestOnline + 1); });
    $('#tg-close').addEventListener('click', closePanel);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closePanel(); });
    render();
  }
  function openPanel() { isPanelOpen = true; render(); $('#telegram-hub').classList.add('on'); if(validated)fetchRanks();else connect(); }
  function closePanel() { isPanelOpen = false; $('#telegram-hub').classList.remove('on'); }
  function message(t) { const e = $('#tg-toast'); if (e) e.textContent = t; }
  function inviteUrl() {
    const bot = CONFIG.botUsername.replace(/^@/, '');
    const ref = validated && playerId ? '?startapp=ref_' + encodeURIComponent(playerId) : '?startapp';
    return bot ? ('https://t.me/' + bot + (CONFIG.miniAppShortName ? '/' + CONFIG.miniAppShortName : '') + ref) : GAME_URL;
  }
  function share() {
    const url = inviteUrl();
    const text = 'Play ANT CANVAS 🐜 — a colorful puzzle adventure!';
    const shareLink = 'https://t.me/share/url?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(text);
    try {
      if (tg && tg.openTelegramLink) tg.openTelegramLink(shareLink);
      else window.open(shareLink, '_blank', 'noopener,noreferrer');
      message('Choose a chat to share the game.');
    } catch (_) {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(() => message('Game link copied'));
      else message('Share this link: ' + url);
    }
  }
  function render() {
    if (!$('#telegram-hub')) return;
    $('#tg-local-best').textContent = currentLevel();
    $('#tg-global-best').textContent = validated ? bestOnline : '—';
    $('#tg-online-start').hidden = !validated;
    let account = active ? (connecting?'Telegram detected · connecting securely':'Telegram detected · sign-in required') : 'Browser mode · local progress';
    if (validated) account = playerName || 'Telegram player';
    $('#tg-name-settings').hidden=!validated;
    $('#tg-name-note').textContent=namePublic===true?'Your Telegram display name is visible on the leaderboard and to linked friends.':namePublic===false?'Your ranking uses an anonymous label.':'Choose how other players see you. Your Telegram name is private until you allow sharing.';
    $('#tg-name-show').hidden=namePublic===true||!playerName;
    $('#tg-name-hide').hidden=namePublic===false;
    $('#tg-account').textContent = account;
    $('#tg-online-note').textContent = validated
      ? 'Your verified level score is stored online. Use Friends & Cloud to back up your village.'
      : active ? (authNote||'Connecting to Telegram game service…')
      : 'Open the game from its Telegram bot to join the verified leaderboard. Browser progress is local.';
  }
  async function api(path, method, data) {
    if (!CONFIG.apiBaseUrl || !active) throw Error('Telegram game service not configured');
    const target = CONFIG.apiBaseUrl.replace(/\/$/, '') + '/api/' + path;
    const res = await fetch(target, {
      method: method || 'GET',
      headers: {'Authorization': 'tma ' + tg.initData, 'Content-Type': 'application/json'},
      ...(data ? {body: JSON.stringify(data)} : {})
    });
    const result=await res.json().catch(()=>({}));
    if(!res.ok){const e=Error('Game service HTTP '+res.status);e.code=result.code||'HTTP_'+res.status;throw e;}
    return result;
  }
  async function connect() {
    if (!active || !CONFIG.apiBaseUrl || connecting || validated) return;
    connecting=true;authNote='';render();
    try {
      const profile = await api('profile');
      validated = true;
      playerId = safeText(profile.playerId);
      playerName=safeText(profile.displayName);namePublic=profile.namePublic??null;
      bestOnline = profile.bestLevel || 0;
      render();
      await fetchRanks();
      if (Number.isInteger(window.ANT_CANVAS_CURRENT_LEVEL)) await onLevelStart(window.ANT_CANVAS_CURRENT_LEVEL);
    } catch (e) { const notes={INIT_DATA_EXPIRED:'Telegram session expired. Close the Mini App completely and reopen it from the bot.',SIGNATURE_MISMATCH:'Telegram signature does not match the configured bot token. Contact the game administrator.',INIT_DATA_MISSING:'Open the game using its Telegram Mini App link.',INIT_DATA_INVALID:'Invalid Telegram session. Reopen the Mini App.',BOT_NOT_CONFIGURED:'Bot token is not configured on the server.',HTTP_503:'Game database or API temporarily unavailable.'};authNote=notes[e.code]||'Connection failed. Tap Refresh rankings to retry ('+(e.code||'NETWORK')+').';console.warn('ANT CANVAS sign-in failed:',e.code||'NETWORK'); }
    finally{connecting=false;render();}
  }
  let nameBusy=false;
  async function setNamePreference(enabled){
    if(!validated||nameBusy)return;nameBusy=true;$('#tg-name-show').disabled=$('#tg-name-hide').disabled=true;
    try{const r=await api('profile/name','POST',{enabled});namePublic=r.namePublic;render();await fetchRanks();message(enabled?'Telegram name now visible':'Anonymous ranking enabled');}
    catch(_){message('Could not change name preference. Please retry.');}
    finally{nameBusy=false;$('#tg-name-show').disabled=$('#tg-name-hide').disabled=false;}
  }
  async function fetchRanks() {
    if (!$('#tg-ranks')) return;
    if (!validated) { $('#tg-ranks').innerHTML = '<li>Global ranking not active yet</li>'; return; }
    try {
      const data = await api('leaderboard');
      const el = $('#tg-ranks');
      el.replaceChildren();
      (data.leaders || []).slice(0, 30).forEach((p, i) => {
        const li = document.createElement('li');
        const name = document.createElement('span');
        const score = document.createElement('strong');
        name.textContent = (i + 1) + '. ' + safeText(p.name);
        score.textContent = 'Level ' + Number(p.level || 0);
        li.append(name, score);
        el.appendChild(li);
      });
      if (!el.children.length) el.innerHTML = '<li>Be the first to complete a level!</li>';
    } catch (_) { $('#tg-ranks').innerHTML = '<li>Ranking temporarily unavailable</li>'; }
  }
  async function onLevelStart(lv) {
    if (!validated || !Number.isInteger(lv) || lv !== bestOnline + 1 || tickets.has(lv)) return;
    try { const response = await api('start-level', 'POST', {level: lv}); tickets.set(lv, response.ticket); }
    catch (e) { console.warn('Telegram level ticket unavailable:', e.message); }
  }
  async function onLevelComplete(lv) {
    render();
    if (!validated || busy || !Number.isInteger(lv) || lv < 1) return;
    if (!tickets.has(lv)) await onLevelStart(lv);
    if (!tickets.has(lv)) return;
    busy = true;
    try {
      const result = await api('progress', 'POST', {level: lv, ticket: tickets.get(lv)});
      tickets.delete(lv);
      bestOnline = Math.max(bestOnline, Number(result.bestLevel) || 0);
      render();
      if (isPanelOpen) await fetchRanks();
    } catch (e) { console.warn('Telegram score not saved:', e.message); }
    finally { busy = false; }
  }
  function init() {
    makePanel();
    if (tg) {
      try {
        tg.ready(); tg.expand();
        if (typeof tg.disableVerticalSwipes === 'function') tg.disableVerticalSwipes();
        if (typeof tg.setHeaderColor === 'function') tg.setHeaderColor('#bfdef7');
      } catch (e) { console.warn('Telegram UI integration:', e.message); }
    }
    connect();
  }
  window.AntTelegram = Object.freeze({init, onLevelStart, onLevelComplete, openPanel, share, get active() {return active;}, get authorized() {return validated;}});
})();
