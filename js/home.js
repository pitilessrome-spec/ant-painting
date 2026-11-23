/* ANT CANVAS — first-play home screen, no framework and no external assets. */
(function () {
  'use strict';
  const stage = document.getElementById('stage');
  const toolbar = document.getElementById('top');
  if (!stage || !toolbar) return;
  let open = true;
  let hideTimer = null;
  const root = document.createElement('section');
  root.id = 'ant-home';
  root.setAttribute('aria-label', 'ANT CANVAS start screen');
  root.innerHTML = [
    "<div class='ah-inner'>",
      "<header class='ah-head'>",
        "<div class='ah-brand'><span class='ah-brand-mark' aria-hidden='true'>🐜</span><span>ANT CANVAS</span></div>",
        "<button type='button' data-home-action='sound' aria-label='Toggle sound'><span id='ah-sound'>♫ ON</span></button>",
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
        "<div class='ah-endless'>✦ ENDLESS<br>PUZZLES</div>",
      "</div>",
      "<button type='button' class='ah-start' data-home-action='play'><span>▶</span><span id='ah-play-copy'>PLAY NOW</span><span class='ah-arrow'>→</span></button>",
      "<div class='ah-secondary-row'>",
        "<button type='button' class='ah-secondary' data-home-action='how'>❔ How to play</button>",
        "<button type='button' class='ah-secondary' data-home-action='share'>↗ Share game</button>",
      "</div>",
      "<p class='ah-footer'>SORT THE COLORS · REVEAL THE MAGIC</p>",
    "</div>",
    "<div class='ah-how' id='ah-how' hidden role='dialog' aria-label='How to play ANT CANVAS'>",
      "<div class='ah-how-card'>",
        "<h2>🐜 How to play</h2><p>Three easy steps to uncover the artwork</p>",
        "<div class='ah-step'><div class='ah-step-ico'>🎨</div><div><strong>1. Choose a box</strong><span>Tap a color box to send it into an empty slot.</span></div></div>",
        "<div class='ah-step'><div class='ah-step-ico'>🐜</div><div><strong>2. Let ants work</strong><span>Each ant takes one matching block away, from the bottom up.</span></div></div>",
        "<div class='ah-step'><div class='ah-step-ico'>✨</div><div><strong>3. Reveal the art</strong><span>Clear every block to finish the level and discover a new picture.</span></div></div>",
        "<button type='button' class='ah-start' data-home-action='play'>LET'S PLAY →</button>",
        "<button type='button' class='ah-how-back' data-home-action='back'>← Back to start</button>",
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
  }
  function show() {
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    updateHome();
    root.hidden = false;
    root.classList.remove('ah-leave');
    document.getElementById('ah-how').hidden = true;
    open = true;
    if (window.Ads && typeof Ads.gameplay === 'function') Ads.gameplay(false);
  }
  function start() {
    document.getElementById('ah-how').hidden = true;
    if (!open) return;
    open = false;
    root.classList.add('ah-leave');
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

  root.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
  root.addEventListener('click', function (e) {
    const control = e.target.closest('[data-home-action]');
    if (!control) return;
    const action = control.getAttribute('data-home-action');
    if (action === 'play') start();
    else if (action === 'how') { document.getElementById('ah-how').hidden = false; }
    else if (action === 'back') { document.getElementById('ah-how').hidden = true; }
    else if (action === 'share') share();
    else if (action === 'sound' && typeof SND !== 'undefined') {
      SND = SND ? 0 : 1;
      if (typeof save === 'function') save();
      updateHome();
      if (SND && typeof beep === 'function') beep(620, .12, .035);
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
