/* ANT CANVAS · 2D storybook boss art.
 * Every boss and arena is drawn as layered SVG in the same hand-painted style as the world maps:
 * warm brown outlines, soft gradients, highlights, pastel flowers and a light paper grain.
 * Layers carry class names so the battle screen can animate them (breathe, blink, hit, attack, defeat).
 *
 *   AntBossArt.mount(el, 'beetle:small', {phase:1}) -> {setPhase(n), hit(), attack(), defeat(), mark(kind,on), destroy()}
 */
(function () {
  'use strict';
  const W = 400, H = 360;
  const INK = '#5b3a2e';            // warm outline used across the maps
  let uid = 0;

  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const f = n => Math.round(n * 10) / 10;

  // ---------- shared painting helpers ----------
  function flower(x, y, r, petal, centre = '#ffd45c', rot = 0, n = 5) {
    let s = `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})">`;
    for (let i = 0; i < n; i++) {
      const a = i * 360 / n;
      s += `<ellipse cx="0" cy="${f(-r * 0.62)}" rx="${f(r * 0.42)}" ry="${f(r * 0.6)}" transform="rotate(${f(a)})" fill="${petal}" stroke="${INK}" stroke-opacity=".35" stroke-width=".8"/>`;
    }
    s += `<circle r="${f(r * 0.3)}" fill="${centre}" stroke="${INK}" stroke-opacity=".4" stroke-width=".7"/>`;
    s += `<circle cx="${f(-r * 0.08)}" cy="${f(-r * 0.1)}" r="${f(r * 0.1)}" fill="#fff" opacity=".7"/></g>`;
    return s;
  }
  function tuft(x, y, s, c = '#6fb556') {
    return `<path d="M${f(x - 6 * s)} ${f(y)} q${f(2 * s)} ${f(-9 * s)} ${f(4 * s)} ${f(-12 * s)} q${f(0)} ${f(8 * s)} ${f(2 * s)} ${f(12 * s)} q${f(2 * s)} ${f(-10 * s)} ${f(6 * s)} ${f(-14 * s)} q${f(-2 * s)} ${f(9 * s)} ${f(0)} ${f(14 * s)} q${f(3 * s)} ${f(-6 * s)} ${f(6 * s)} ${f(-8 * s)} q${f(-1 * s)} ${f(5 * s)} ${f(-2 * s)} ${f(8 * s)}z" fill="${c}" stroke="#4d8a3d" stroke-width=".7" stroke-linejoin="round"/>`;
  }
  function tree(x, y, s, leaf, dark, trunk = '#9a6a46') {
    return `<g transform="translate(${f(x)} ${f(y)}) scale(${s})">
      <path d="M-5 0 q-2 -20 2 -38 h6 q4 18 2 38z" fill="${trunk}" stroke="${INK}" stroke-width="1.2"/>
      <circle cx="-16" cy="-44" r="20" fill="${dark}" stroke="${INK}" stroke-opacity=".5" stroke-width="1.1"/>
      <circle cx="16" cy="-46" r="21" fill="${dark}" stroke="${INK}" stroke-opacity=".5" stroke-width="1.1"/>
      <circle cx="0" cy="-62" r="25" fill="${leaf}" stroke="${INK}" stroke-opacity=".5" stroke-width="1.1"/>
      <circle cx="-10" cy="-50" r="16" fill="${leaf}"/>
      <ellipse cx="-8" cy="-72" rx="9" ry="6" fill="#fff" opacity=".28"/>
    </g>`;
  }
  function stone(x, y, w, h, r) {
    const j = () => f((r() - 0.5) * w * 0.18);
    return `<path d="M${f(x - w / 2)} ${f(y)} q${j()} ${f(-h * 0.6)} ${f(w * 0.25)} ${f(-h * 0.55)} q${f(w * 0.3)} ${j()} ${f(w * 0.5)} ${f(-h * 0.05)} q${f(w * 0.25)} ${f(h * 0.25)} ${f(w * 0.25)} ${f(h * 0.6)} q${f(-w * 0.45)} ${f(h * 0.25)} ${f(-w)} 0z" fill="#efe2c4" stroke="#b69a73" stroke-width="1.1"/>
      <path d="M${f(x - w * 0.3)} ${f(y - h * 0.35)} q${f(w * 0.2)} ${f(-h * 0.12)} ${f(w * 0.4)} ${f(-h * 0.05)}" stroke="#fff" stroke-width="1.6" fill="none" opacity=".6" stroke-linecap="round"/>`;
  }
  function butterfly(x, y, c, cls = '') {
    return `<g transform="translate(${x} ${y})"><g class="${cls}">
      <ellipse cx="-5" cy="-3" rx="6" ry="5" fill="${c}" stroke="${INK}" stroke-opacity=".5" stroke-width=".7"/>
      <ellipse cx="5" cy="-3" rx="6" ry="5" fill="${c}" stroke="${INK}" stroke-opacity=".5" stroke-width=".7"/>
      <ellipse cx="-4" cy="3" rx="4" ry="3.4" fill="${c}" opacity=".85"/><ellipse cx="4" cy="3" rx="4" ry="3.4" fill="${c}" opacity=".85"/>
      <rect x="-.8" y="-6" width="1.6" height="11" rx=".8" fill="${INK}"/></g></g>`;
  }
  // Light paper grain and soft vignette, shared by every arena.
  function finish(id) {
    return `<rect width="${W}" height="${H}" filter="url(#${id}-grain)" opacity=".1" style="mix-blend-mode:multiply"/>
      <rect width="${W}" height="${H}" fill="url(#${id}-vig)"/>`;
  }
  function baseDefs(id) {
    return `<filter id="${id}-grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="7"/><feColorMatrix values="0 0 0 0 .35  0 0 0 0 .25  0 0 0 0 .15  0 0 0 .9 0"/></filter>
      <radialGradient id="${id}-vig" cx="50%" cy="45%" r="75%"><stop offset="70%" stop-color="#3b2a1e" stop-opacity="0"/><stop offset="100%" stop-color="#3b2a1e" stop-opacity=".22"/></radialGradient>
      <filter id="${id}-soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4"/></filter>
      <filter id="${id}-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
  }

  // ---------- arenas ----------
  const ARENAS = {
    // Storybook Garden · small · Flower Path (Giant Ladybug)
    'beetle:small'(id) {
      const r = rng(1201);
      let flowers = '', far = '';
      const cols = ['#f7a8c0', '#fbd0dc', '#ffffff', '#f6c6e8', '#ffd98a'];
      // mid-distance flower beds left and right of the path
      for (let i = 0; i < 46; i++) {
        const side = i % 2 ? 1 : -1, x = 200 + side * (70 + r() * 125), y = 150 + r() * 70;
        far += flower(x, y, 3.5 + r() * 2.5, cols[Math.floor(r() * cols.length)], '#ffd45c', r() * 70);
      }
      // foreground flowers framing the bottom edge
      for (let i = 0; i < 28; i++) {
        const x = r() * W, y = 300 + r() * 60;
        if (Math.abs(x - 200) < 70 && y < 330) continue;
        flowers += flower(x, y, 7 + r() * 6, cols[Math.floor(r() * cols.length)], '#ffd45c', r() * 70);
      }
      let tufts = '';
      for (let i = 0; i < 26; i++) tufts += tuft(r() * W, 230 + r() * 120, 0.7 + r() * 0.6);
      // stepping-stone path curving from the viewer to the back of the meadow
      let stones = '';
      const pathPts = [[200, 352, 54, 20], [176, 326, 46, 17], [206, 304, 40, 15], [184, 186, 22, 9], [205, 172, 18, 8], [188, 160, 15, 7]];
      for (const [x, y, w, h] of pathPts) stones += stone(x, y, w, h, r);
      return `
        <linearGradient id="${id}-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe7f7"/><stop offset=".55" stop-color="#e3f4ee"/><stop offset="1" stop-color="#f4f9e4"/></linearGradient>
        <radialGradient id="${id}-sun" cx="82%" cy="10%" r="35%"><stop offset="0" stop-color="#fff8d2"/><stop offset="1" stop-color="#fff8d2" stop-opacity="0"/></radialGradient>
        <linearGradient id="${id}-meadow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a9db84"/><stop offset="1" stop-color="#7fbf5f"/></linearGradient>
        <radialGradient id="${id}-ring" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff3c9" stop-opacity=".85"/><stop offset=".7" stop-color="#ffe7a8" stop-opacity=".45"/><stop offset="1" stop-color="#ffe7a8" stop-opacity="0"/></radialGradient>
      ` + '|' + `
        <rect width="${W}" height="${H}" fill="url(#${id}-sky)"/>
        <rect width="${W}" height="${H}" fill="url(#${id}-sun)"/>
        <g opacity=".9">
          <ellipse cx="60" cy="58" rx="34" ry="11" fill="#fff"/><ellipse cx="82" cy="52" rx="22" ry="12" fill="#fff"/>
          <ellipse cx="300" cy="44" rx="28" ry="9" fill="#fff"/><ellipse cx="318" cy="39" rx="17" ry="10" fill="#fff"/>
        </g>
        <path d="M0 150 q70 -46 150 -18 q70 22 130 -10 q60 -28 120 6 v60 H0z" fill="#b9e09b" stroke="#86b96a" stroke-width="1"/>
        ${tree(36, 150, 1.05, '#8fd06f', '#6fb556')}${tree(92, 140, .8, '#f5b9cf', '#ec9dbb', '#a1704c')}
        ${tree(318, 144, .9, '#f5b9cf', '#ec9dbb', '#a1704c')}${tree(372, 152, 1.1, '#8fd06f', '#6fb556')}
        <path d="M0 168 q100 -26 200 -12 q100 12 200 -6 V${H} H0z" fill="url(#${id}-meadow)"/>
        <g>
          <path d="M28 182 v-26 M60 180 v-26 M92 178 v-26" stroke="#9a6a46" stroke-width="5" stroke-linecap="round"/>
          <path d="M22 164 q35 -6 76 -8 M22 174 q35 -6 76 -8" stroke="#b07d55" stroke-width="3" fill="none" stroke-linecap="round"/>
          <path d="M308 178 v-26 M340 180 v-26 M372 182 v-26" stroke="#9a6a46" stroke-width="5" stroke-linecap="round"/>
          <path d="M302 158 q40 2 76 8 M302 168 q40 2 76 8" stroke="#b07d55" stroke-width="3" fill="none" stroke-linecap="round"/>
        </g>
        ${far}
        <ellipse cx="200" cy="272" rx="150" ry="48" fill="url(#${id}-ring)"/>
        ${stones}${tufts}
        ${butterfly(96, 112, '#ffd1e3', 'ab-flutter')}${butterfly(330, 120, '#cfe8ff', 'ab-flutter ab-late')}
        <g class="ab-fore">${flowers}</g>`;
    },
  };

  // ---------- bosses ----------
  const BOSSES = {
    // Giant Ladybug: a round, glossy storybook ladybug with big friendly-but-determined eyes.
    'beetle:small'(id) {
      const defs = `
        <radialGradient id="${id}-shell" cx="38%" cy="28%" r="78%"><stop offset="0" stop-color="#ff9c86"/><stop offset=".45" stop-color="#ef4f3f"/><stop offset="1" stop-color="#b42d2a"/></radialGradient>
        <radialGradient id="${id}-head" cx="45%" cy="30%" r="75%"><stop offset="0" stop-color="#5a5472"/><stop offset="1" stop-color="#2c2838"/></radialGradient>
        <radialGradient id="${id}-spot" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#4a4256"/><stop offset="1" stop-color="#231f2c"/></radialGradient>
        <radialGradient id="${id}-gold" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff3a8"/><stop offset=".6" stop-color="#ffd24a" stop-opacity=".8"/><stop offset="1" stop-color="#ffb52e" stop-opacity="0"/></radialGradient>`;
      const spots = [[160, 172, 15], [146, 212, 12], [178, 236, 10], [240, 172, 15], [254, 212, 12], [222, 236, 10], [200, 140, 9]];
      const spotSvg = spots.map(([x, y, s], i) =>
        `<g class="ab-spot" data-i="${i}"><circle cx="${x}" cy="${y}" r="${s * 1.9}" fill="url(#${id}-gold)" class="ab-spot-glow"/>
          <ellipse cx="${x}" cy="${y}" rx="${s}" ry="${s * 0.9}" fill="url(#${id}-spot)" stroke="#1d1922" stroke-width="1"/>
          <ellipse cx="${x - s * 0.3}" cy="${y - s * 0.35}" rx="${s * 0.32}" ry="${s * 0.2}" fill="#fff" opacity=".35"/></g>`).join('');
      const leg = (x, y, dx, dy, flip) => `<path d="M${x} ${y} q${dx * 0.5} ${dy * 0.2} ${dx} ${dy} q${flip * 4} 3 ${flip * 9} 2" stroke="#2c2838" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
      return defs + '|' + `
        <ellipse cx="200" cy="290" rx="98" ry="15" fill="#3b2a1e" opacity=".28" filter="url(#${id}-soft)" class="ab-shadow"/>
        <g class="ab-legs">
          ${leg(132, 250, -26, 30, -1)}${leg(126, 228, -34, 18, -1)}${leg(140, 266, -10, 24, -1)}
          ${leg(268, 250, 26, 30, 1)}${leg(274, 228, 34, 18, 1)}${leg(260, 266, 10, 24, 1)}
        </g>
        <g class="ab-body">
          <path d="M108 222 C108 150 150 116 200 116 C250 116 292 150 292 222 C292 268 250 290 200 290 C150 290 108 268 108 222Z" fill="url(#${id}-shell)" stroke="#7a2420" stroke-width="3"/>
          <path d="M200 120 V286" stroke="#7a2420" stroke-width="2.5" opacity=".75"/>
          <path d="M126 196 C134 150 166 128 196 126" stroke="#fff" stroke-width="7" fill="none" opacity=".35" stroke-linecap="round"/>
          <ellipse cx="160" cy="150" rx="16" ry="8" fill="#fff" opacity=".45" transform="rotate(-28 160 150)"/>
          <g class="ab-spots">${spotSvg}</g>
          <g class="ab-crown" transform="translate(200 122)">
            <path d="M-10 -4 q-8 -14 4 -18 q4 8 6 14 q2 -6 6 -14 q12 4 4 18z" fill="#7ccb62" stroke="#4d8a3d" stroke-width="1.2"/>
            ${flower(0, -18, 7, '#fbd0dc')}
          </g>
        </g>
        <g class="ab-head">
          <ellipse cx="200" cy="268" rx="58" ry="40" fill="url(#${id}-head)" stroke="#1d1922" stroke-width="2.5"/>
          <ellipse cx="186" cy="246" rx="22" ry="8" fill="#fff" opacity=".18"/>
          <g class="ab-antenna ab-antenna-l"><path d="M178 236 q-14 -40 -40 -48" stroke="#2c2838" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="136" cy="187" r="7" fill="#ff8fb1" stroke="#1d1922" stroke-width="1.5"/><circle cx="134" cy="185" r="2.2" fill="#fff" opacity=".8"/></g>
          <g class="ab-antenna ab-antenna-r"><path d="M222 236 q14 -40 40 -48" stroke="#2c2838" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="264" cy="187" r="7" fill="#ff8fb1" stroke="#1d1922" stroke-width="1.5"/><circle cx="262" cy="185" r="2.2" fill="#fff" opacity=".8"/></g>
          <g class="ab-eyes">
            <ellipse cx="179" cy="266" rx="15" ry="17" fill="#fffdf7" stroke="#1d1922" stroke-width="1.5"/>
            <ellipse cx="221" cy="266" rx="15" ry="17" fill="#fffdf7" stroke="#1d1922" stroke-width="1.5"/>
            <ellipse cx="182" cy="269" rx="8" ry="10" fill="#2b2235" class="ab-pupil"/><ellipse cx="218" cy="269" rx="8" ry="10" fill="#2b2235" class="ab-pupil"/>
            <circle cx="185" cy="264" r="3.2" fill="#fff"/><circle cx="221" cy="264" r="3.2" fill="#fff"/>
            <circle cx="179" cy="274" r="1.4" fill="#fff" opacity=".8"/><circle cx="215" cy="274" r="1.4" fill="#fff" opacity=".8"/>
            <path class="ab-brow" d="M163 246 q14 -6 26 2 M237 246 q-14 -6 -26 2" stroke="#1d1922" stroke-width="3" fill="none" stroke-linecap="round"/>
          </g>
          <g class="ab-lids"><ellipse cx="179" cy="266" rx="16" ry="18" fill="#3b3550"/><ellipse cx="221" cy="266" rx="16" ry="18" fill="#3b3550"/></g>
          <ellipse cx="166" cy="288" rx="8" ry="4.5" fill="#ff8fa8" opacity=".55"/><ellipse cx="234" cy="288" rx="8" ry="4.5" fill="#ff8fa8" opacity=".55"/>
          <path class="ab-mouth" d="M192 293 q8 6 16 0" stroke="#fffdf7" stroke-width="2.4" fill="none" stroke-linecap="round"/>
        </g>`;
    },
  };

  const CSS = `
    .ab-root{display:block;width:100%;height:auto;overflow:hidden}
    .ab-root .ab-boss{transform-origin:200px 290px;animation:ab-breathe 2.6s ease-in-out infinite}
    .ab-root .ab-shadow{transform-origin:200px 290px;animation:ab-shadow 2.6s ease-in-out infinite}
    .ab-root .ab-lids{transform-origin:200px 266px;transform:scaleY(0);animation:ab-blink 4.6s infinite}
    .ab-root .ab-antenna-l{transform-origin:178px 236px;animation:ab-sway 3.2s ease-in-out infinite}
    .ab-root .ab-antenna-r{transform-origin:222px 236px;animation:ab-sway 3.2s ease-in-out infinite reverse}
    .ab-root .ab-spot-glow{opacity:0;transition:opacity .4s}
    .ab-root .ab-spot.on .ab-spot-glow{opacity:1;animation:ab-pulse 1.2s ease-in-out infinite}
    .ab-root .ab-flutter{animation:ab-fly 5s ease-in-out infinite}
    .ab-root .ab-late{animation-delay:-2.3s}
    .ab-root.ab-hit .ab-boss{animation:ab-shake .38s linear;filter:brightness(1.8) saturate(.6)}
    .ab-root.ab-attack .ab-boss{animation:ab-lunge .7s cubic-bezier(.3,0,.2,1)}
    .ab-root.ab-phase2 .ab-brow{transform:translateY(3px)}
    .ab-root.ab-phase3 .ab-body{filter:saturate(1.35) brightness(.95)}
    .ab-root.ab-phase3 .ab-boss{animation-duration:1.4s}
    .ab-root.ab-defeat .ab-boss{animation:ab-down 1.2s ease-in forwards}
    @keyframes ab-breathe{0%,100%{transform:scale(1,1)}50%{transform:scale(1.015,.985)}}
    @keyframes ab-shadow{0%,100%{transform:scale(1)}50%{transform:scale(1.04,1)}}
    @keyframes ab-blink{0%,93%,100%{transform:scaleY(0)}96%{transform:scaleY(1)}}
    @keyframes ab-sway{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(5deg)}}
    @keyframes ab-pulse{0%,100%{transform:scale(1);opacity:.75}50%{opacity:1}}
    @keyframes ab-fly{0%,100%{transform:translate(0,0)}25%{transform:translate(14px,-10px)}50%{transform:translate(26px,2px)}75%{transform:translate(10px,8px)}}
    @keyframes ab-shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-7px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(3px)}}
    @keyframes ab-lunge{0%{transform:scale(1)}35%{transform:scale(.94,1.04) translateY(6px)}60%{transform:scale(1.08) translateY(-10px)}100%{transform:scale(1)}}
    @keyframes ab-down{to{transform:translateY(40px) scale(1.1,.4);opacity:0}}
    @media (prefers-reduced-motion:reduce){.ab-root *{animation:none!important}}`;

  function svg(key) {
    const id = 'ab' + (++uid);
    const [adefs, arena] = ARENAS[key](id).split('|');
    const [bdefs, boss] = BOSSES[key](id).split('|');
    return `<svg class="ab-root" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${key}">
      <defs>${baseDefs(id)}${adefs}${bdefs}</defs>
      <g class="ab-arena">${arena}</g>
      <g class="ab-boss"><g transform="translate(200 300) scale(.84) translate(-200 -300)">${boss}</g></g>
      ${finish(id)}
    </svg>`;
  }

  function ensureCss() {
    if (document.getElementById('ab-css')) return;
    const st = document.createElement('style'); st.id = 'ab-css'; st.textContent = CSS; document.head.appendChild(st);
  }

  function mount(el, key, opts = {}) {
    if (!BOSSES[key] || !ARENAS[key]) { el.textContent = ''; return null; }
    ensureCss();
    el.innerHTML = svg(key);
    const root = el.firstElementChild;
    const pulse = (cls, ms) => { root.classList.remove(cls); void root.getBoundingClientRect(); root.classList.add(cls); setTimeout(() => root.classList.remove(cls), ms); };
    const api = {
      setPhase(n) { root.classList.toggle('ab-phase2', n >= 2); root.classList.toggle('ab-phase3', n >= 3); },
      hit() { pulse('ab-hit', 400); },
      attack() { pulse('ab-attack', 720); },
      defeat() { root.classList.add('ab-defeat'); },
      // Mechanic overlays drawn on the boss itself (the ladybug's glowing spots).
      mark(kind, on, n = 3) { if (kind === 'spot') root.querySelectorAll('.ab-spot').forEach((g, i) => g.classList.toggle('on', on && i < n)); },
      destroy() { el.innerHTML = ''; },
    };
    api.setPhase(opts.phase || 1);
    return api;
  }

  window.AntBossArt = { mount, keys: () => Object.keys(BOSSES), size: { W, H } };
})();
