/* ANT CANVAS — first-play home screen, no framework and no external assets. */
(function () {
  'use strict';
  const stage = document.getElementById('stage');
  const toolbar = document.getElementById('top');
  if (!stage || !toolbar) return;
  let open = true;
  let hideTimer = null,navTimer=null,navigating=false;
  const root = document.createElement('section');
  root.id = 'ant-home';
  root.setAttribute('aria-label', 'ANT CANVAS start screen');
  root.innerHTML = [
    "<div class='ah-inner'>",
      "<header class='ah-head'>",
        "<div class='ah-brand'><span class='ah-brand-mark' aria-hidden='true'>🐜</span><span>ANT CANVAS</span></div>",
        "<div style='display:flex;gap:6px;align-items:center'><button type='button' data-home-action='share' aria-label='Share ANT CANVAS'>↗ Share</button><button type='button' data-home-action='sound' aria-label='Toggle sound'><span id='ah-sound'>♫ ON</span></button></div>",
      "</header>",
      "<div class='ah-eyebrow'>A LITTLE COLOR ADVENTURE</div>",
      "<h1 class='ah-title'>Little ants.<br><em>Big art.</em></h1>",
      "<p class='ah-desc'>Pick a color. Send your ants.<br>Reveal the mystery picture!</p>",
      "<div class='ah-hero' aria-hidden='true'>",
        "<span class='ah-shiny one'>✦</span><span class='ah-shiny two'>✦</span>",
        "<div class='ah-tray'><div class='ah-grid' id='ah-grid'></div></div>",
        "<span class='ah-ant one'>🐜</span><span class='ah-ant two'>🐜</span><span class='ah-ant three'>🐜</span>",
        "<span class='ah-demo-label'>✦ COLOR → ART</span>",
      "</div>",
      "<div class='ah-progress' aria-live='polite'>",
        "<div><small>YOUR ADVENTURE</small><strong id='ah-resume-level'>Level 1</strong></div>",
        "<button type='button' class='ah-toggle' data-home-action='mode'>🌈 HYBRID ANTS<b id='ah-mode'>ON</b></button>",
      "</div>",
      "<button type='button' class='ah-start' data-home-action='play'><span>▶</span><span id='ah-play-copy'>PLAY NOW</span><span class='ah-arrow'>→</span></button>",
      "<div class='ah-secondary-row'>",
        "<button type='button' class='ah-secondary' data-home-action='daily'>📅 Daily</button>",
        "<button type='button' class='ah-secondary' data-home-action='gallery'>🖼 Gallery</button>",
        "<button type='button' class='ah-secondary' data-home-action='village'>🌿 World</button>",
        "<button type='button' class='ah-secondary' data-home-action='how'>❔ Help</button>",
      "</div>",
      "<p class='ah-footer' id='ah-status' aria-live='polite'>PUZZLE · COLONY · WORLD &nbsp; | &nbsp; V5.1.2 RC</p>",
    "</div>",
    "<div class='ah-how' id='ah-how' hidden role='dialog' aria-label='How to play ANT CANVAS'>",
      "<div class='ah-how-card'>",
        "<h2>🐜 How to play</h2><p>Three easy steps to uncover the artwork</p>",
        "<div class='ah-step'><div class='ah-step-ico'>🎨</div><div><strong>1. Choose a box</strong><span>Tap a color box to send it into an empty slot.</span></div></div>",
        "<div class='ah-step'><div class='ah-step-ico'>🐜</div><div><strong>2. Let ants work</strong><span>Each ant takes one matching block away, from the bottom up.</span></div></div>",
        "<div class='ah-step'><div class='ah-step-ico'>✨</div><div><strong>3. Reveal the art</strong><span>Clear every block to finish the level and discover a new picture.</span></div></div>",
        "<button type='button' class='ah-start' data-home-action='play'>LET'S PLAY →</button>",
        "<button type='button' class='ah-how-back' data-home-action='guide'>📖 Full game guide</button><button type='button' class='ah-how-back' data-home-action='back'>← Back to start</button>",
      "</div>",
    "</div>"
  ].join('');
  stage.appendChild(root);

  const art = [
    '.....PPP.....',
    '....PPPPP....',
    '...PPYYYPP...',
    '..PPYYYYYPP..',
    '...PPYYYPP...',
    '....PPPPP....',
    '.....PPP.....',
    '......G......',
    '...GG.G.GG...',
    '..GGG.G.GGG..',
    '...GGGGGGG...',
    '......G......',
    '......G......'
  ];
  const grid = document.getElementById('ah-grid');
  const pixels = document.createDocumentFragment();
  art.join('').split('').forEach(function (letter, i) {
    const tile = document.createElement('i');
    tile.className = 'ah-pixel' + (letter === '.' ? '' : ' ' + letter.toLowerCase());
    tile.style.setProperty('--seq', String((i * 7) % 31));
    pixels.appendChild(tile);
  });
  grid.appendChild(pixels);

  const nav = document.createElement('button');
  nav.id = 'ah-return';
  nav.type = 'button';
  nav.title = 'Main menu';
  nav.setAttribute('aria-label', 'Back to the main menu');
  nav.textContent = '⌂';
  toolbar.insertBefore(nav, document.getElementById('lvbox'));

  function readProgress() {
    let state = {};
    try { state = JSON.parse(localStorage.getItem('mbh3') || '{}') || {}; } catch (_) {}
    const lv = Math.max(1, Math.min(999999, parseInt(state.lv, 10) || parseInt(state.maxLv, 10) || 1));
    const best = Math.max(1, parseInt(state.maxLv, 10) || 1);
    return {lv: lv, best: best};
  }
  function updateHome() {
    const progress = readProgress();
    document.getElementById('ah-resume-level').textContent = 'Level ' + progress.lv;
    document.getElementById('ah-play-copy').textContent = progress.best > 1 ? 'CONTINUE PLAYING' : 'PLAY NOW';
    if (typeof SND !== 'undefined') document.getElementById('ah-sound').textContent = SND ? '♫ ON' : '♫ OFF';
    if(window.AntWorkshop)window.AntWorkshop.render(window.ANT_CANVAS_GAME||null);
  }
  function show() {
    navigating=false;clearTimeout(navTimer);document.getElementById('ah-status').textContent='PUZZLE · COLONY · WORLD | V5.1.2 RC';
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    updateHome();
    root.hidden = false;
    root.classList.remove('ah-leave');
    document.getElementById('ah-how').hidden = true;
    open = true;
    if (window.AntPolish) window.AntPolish.onMenuOpened();
    if (window.AntMystery) window.AntMystery.hide();
    if (window.Ads && typeof Ads.gameplay === 'function') Ads.gameplay(false);
  }
  function start() {
    window.AntSFX?.unlock();
    navigating=false;clearTimeout(navTimer);
    document.getElementById('ah-how').hidden = true;
    if (!open) return;
    open = false;
    root.classList.add('ah-leave');
    if (window.AntPolish) window.AntPolish.onGameOpened();
    if (window.AntMystery) window.AntMystery.show();
    if (window.Ads && typeof Ads.gameplay === 'function') Ads.gameplay(true);
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
      try { window.Telegram.WebApp.HapticFeedback.impactOccurred('light'); } catch (_) {}
    }
    hideTimer = setTimeout(function () { root.hidden = true; hideTimer = null; }, 370);
  }
  function share() {
    if (window.AntTelegram && typeof window.AntTelegram.share === 'function') { window.AntTelegram.share(); return; }
    const url = 'https://pitilessrome-spec.github.io/ant-painting/';
    const label = 'ANT CANVAS — Little ants. Big art.';
    if (navigator.share) { navigator.share({title: label, text: 'Reveal colorful pictures with tiny ants!', url: url}).catch(function () {}); return; }
    window.open('https://t.me/share/url?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(label), '_blank', 'noopener,noreferrer');
  }

  function navigate(url,label){if(navigating)return;navigating=true;const status=document.getElementById('ah-status');status.textContent='Opening '+label+'…';navTimer=setTimeout(()=>{navigating=false;status.textContent='Still here? Tap again to retry.'},5000);try{window.location.assign(url)}catch(_){clearTimeout(navTimer);navigating=false;status.textContent='Could not open. Tap to retry.'}}
  root.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
  root.addEventListener('click', function (e) {
    const control = e.target.closest('[data-home-action]');
    if (!control) return;
    e.stopPropagation();const action = control.getAttribute('data-home-action');
    if (action === 'play') {window.exitDailyChallenge?.();start();}
    else if(action==='daily'){window.startDailyChallenge?.();start();}
    else if (action === 'how') { document.getElementById('ah-how').hidden = false; }
    else if (action === 'guide') { navigate('guide.html','guide'); }
    else if (action === 'back') { document.getElementById('ah-how').hidden = true; }
    else if (action === 'share') share();
    else if (action === 'gallery') navigate('collection.html','gallery');
    else if (action === 'village') navigate('village.html?v=world-v504','world');
    else if (action === 'mode' && window.AntWorkshop){window.AntWorkshop.toggle();updateHome();}
    else if (action === 'sound' && typeof SND !== 'undefined') {
      SND = SND ? 0 : 1;
      if (typeof save === 'function') save();
      updateHome();
      window.AntSFX?.setEnabled(!!SND);
    }
  });
  nav.addEventListener('click', function () { show(); });
  window.AntHome = Object.freeze({
    show: show,
    start: start,
    afterBoot: function () { updateHome(); if (window.Ads && typeof Ads.gameplay === 'function') Ads.gameplay(false); },
    get isOpen() { return open; }
  });
})();
