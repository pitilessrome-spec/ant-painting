/* ANT CANVAS · 2D storybook boss art — core.
 * Bosses and arenas are drawn as layered SVG in the world maps' hand-painted style: warm brown outlines,
 * soft gradients, highlights, pastel flora and a light paper grain. Each world file
 * (boss-art-garden.js, -forest, -coral, -snow) registers its three bosses and arenas here.
 *
 *   AntBossArt.mount(el, 'beetle:small', {phase}) -> {setPhase(n), hit(), attack(), defeat(), mark(kind, on, value), destroy()}
 *
 * A world file registers: AntBossArt.register(key, {arena(id, h) -> {defs, body}, boss(id, h) -> {defs, body}, mark?(root, kind, on, value)})
 * Layers inside the boss use shared class names so one stylesheet animates all twelve:
 *   .ab-shadow .ab-body .ab-head .ab-eyes .ab-lids (blink) .ab-sway-l/.ab-sway-r (antennae, claws, fins) .ab-float (bobbing parts)
 */
(function () {
  'use strict';
  const W = 400, H = 360, INK = '#5b3a2e';
  const REG = {};
  let uid = 0;

  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const f = n => Math.round(n * 10) / 10;

  // ---------- shared painting helpers (h.*) ----------
  function flower(x, y, r, petal, centre = '#ffd45c', rot = 0, n = 5, ink = INK) {
    let s = `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})">`;
    for (let i = 0; i < n; i++) s += `<ellipse cx="0" cy="${f(-r * 0.62)}" rx="${f(r * 0.42)}" ry="${f(r * 0.6)}" transform="rotate(${f(i * 360 / n)})" fill="${petal}" stroke="${ink}" stroke-opacity=".35" stroke-width=".8"/>`;
    return s + `<circle r="${f(r * 0.3)}" fill="${centre}" stroke="${ink}" stroke-opacity=".4" stroke-width=".7"/><circle cx="${f(-r * 0.08)}" cy="${f(-r * 0.1)}" r="${f(r * 0.1)}" fill="#fff" opacity=".7"/></g>`;
  }
  function tuft(x, y, s, c = '#6fb556', edge = '#4d8a3d') {
    return `<path d="M${f(x - 6 * s)} ${f(y)} q${f(2 * s)} ${f(-9 * s)} ${f(4 * s)} ${f(-12 * s)} q0 ${f(8 * s)} ${f(2 * s)} ${f(12 * s)} q${f(2 * s)} ${f(-10 * s)} ${f(6 * s)} ${f(-14 * s)} q${f(-2 * s)} ${f(9 * s)} 0 ${f(14 * s)} q${f(3 * s)} ${f(-6 * s)} ${f(6 * s)} ${f(-8 * s)} q${f(-s)} ${f(5 * s)} ${f(-2 * s)} ${f(8 * s)}z" fill="${c}" stroke="${edge}" stroke-width=".7" stroke-linejoin="round"/>`;
  }
  function tree(x, y, s, leaf, dark, trunk = '#9a6a46') {
    return `<g transform="translate(${f(x)} ${f(y)}) scale(${s})"><path d="M-5 0 q-2 -20 2 -38 h6 q4 18 2 38z" fill="${trunk}" stroke="${INK}" stroke-width="1.2"/>
      <circle cx="-16" cy="-44" r="20" fill="${dark}" stroke="${INK}" stroke-opacity=".5" stroke-width="1.1"/><circle cx="16" cy="-46" r="21" fill="${dark}" stroke="${INK}" stroke-opacity=".5" stroke-width="1.1"/>
      <circle cx="0" cy="-62" r="25" fill="${leaf}" stroke="${INK}" stroke-opacity=".5" stroke-width="1.1"/><circle cx="-10" cy="-50" r="16" fill="${leaf}"/><ellipse cx="-8" cy="-72" rx="9" ry="6" fill="#fff" opacity=".28"/></g>`;
  }
  function pine(x, y, s, snow = true) {
    return `<g transform="translate(${f(x)} ${f(y)}) scale(${s})"><rect x="-4" y="-10" width="8" height="12" rx="2" fill="#8a5e42" stroke="${INK}" stroke-width="1"/>
      <path d="M0 -70 L-26 -24 H26Z M0 -52 L-32 -6 H32Z" fill="#4f8f6a" stroke="#2f5a44" stroke-width="1.2" stroke-linejoin="round"/>
      ${snow ? `<path d="M0 -70 L-12 -49 q6 4 12 0 q6 4 12 0Z M-18 -34 q10 6 18 0 q10 6 18 0 l-6 -8 q-12 5 -24 0z" fill="#fbfeff" stroke="#b9d3e4" stroke-width=".8"/>` : ''}</g>`;
  }
  function stone(x, y, w, h, r, fill = '#efe2c4', edge = '#b69a73') {
    const j = () => f((r() - 0.5) * w * 0.18);
    return `<path d="M${f(x - w / 2)} ${f(y)} q${j()} ${f(-h * 0.6)} ${f(w * 0.25)} ${f(-h * 0.55)} q${f(w * 0.3)} ${j()} ${f(w * 0.5)} ${f(-h * 0.05)} q${f(w * 0.25)} ${f(h * 0.25)} ${f(w * 0.25)} ${f(h * 0.6)} q${f(-w * 0.45)} ${f(h * 0.25)} ${f(-w)} 0z" fill="${fill}" stroke="${edge}" stroke-width="1.1"/>
      <path d="M${f(x - w * 0.3)} ${f(y - h * 0.35)} q${f(w * 0.2)} ${f(-h * 0.12)} ${f(w * 0.4)} ${f(-h * 0.05)}" stroke="#fff" stroke-width="1.6" fill="none" opacity=".6" stroke-linecap="round"/>`;
  }
  function butterfly(x, y, c, cls = 'ab-flutter') {
    return `<g transform="translate(${x} ${y})"><g class="${cls}"><ellipse cx="-5" cy="-3" rx="6" ry="5" fill="${c}" stroke="${INK}" stroke-opacity=".5" stroke-width=".7"/><ellipse cx="5" cy="-3" rx="6" ry="5" fill="${c}" stroke="${INK}" stroke-opacity=".5" stroke-width=".7"/>
      <ellipse cx="-4" cy="3" rx="4" ry="3.4" fill="${c}" opacity=".85"/><ellipse cx="4" cy="3" rx="4" ry="3.4" fill="${c}" opacity=".85"/><rect x="-.8" y="-6" width="1.6" height="11" rx=".8" fill="${INK}"/></g></g>`;
  }
  function mushroom(x, y, s, cap, spots = '#fff', stem = '#f3e6cf', glow = false) {
    return `<g transform="translate(${f(x)} ${f(y)}) scale(${s})"><path d="M-6 0 q-2 -14 1 -22 h10 q3 8 1 22z" fill="${stem}" stroke="${INK}" stroke-width="1.1"/>
      <path d="M-22 -18 q2 -22 22 -24 q20 2 22 24 q-22 6 -44 0z" fill="${cap}" stroke="${INK}" stroke-width="1.3"${glow ? ' class="ab-glow-soft"' : ''}/>
      <circle cx="-9" cy="-30" r="3.6" fill="${spots}" opacity=".9"/><circle cx="6" cy="-34" r="3" fill="${spots}" opacity=".9"/><circle cx="13" cy="-24" r="2.6" fill="${spots}" opacity=".9"/><ellipse cx="-6" cy="-36" rx="7" ry="3" fill="#fff" opacity=".3"/></g>`;
  }
  function crystal(x, y, s, c1, c2, rot = 0) {
    return `<g transform="translate(${f(x)} ${f(y)}) rotate(${rot}) scale(${s})"><path d="M0 -40 L12 -14 L8 0 H-8 L-12 -14Z" fill="${c1}" stroke="#5c7fa6" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M0 -40 L4 -12 L0 0 L-8 0 L-12 -14Z" fill="${c2}" opacity=".7"/><path d="M-4 -30 L-1 -16" stroke="#fff" stroke-width="2" opacity=".8" stroke-linecap="round"/></g>`;
  }
  function shell(x, y, s, c = '#ffd2c2', rot = 0) {
    return `<g transform="translate(${f(x)} ${f(y)}) rotate(${rot}) scale(${s})"><path d="M0 0 L-12 -14 q12 -12 24 0z" fill="${c}" stroke="${INK}" stroke-width="1"/>
      <path d="M0 0 L-6 -17 M0 0 L0 -19 M0 0 L6 -17" stroke="${INK}" stroke-opacity=".45" stroke-width=".9"/></g>`;
  }
  // Big friendly storybook eyes; pupils look slightly down at the player. kind: 'round' | 'stern' | 'sleepy'
  function eyes(cx, cy, gap, rx, ry, opts = {}) {
    const { iris = '#2b2235', lid = '#3b3550', brow = true, stern = false, glow = null, ink = '#1d1922' } = opts;
    const one = (x, side) => `<ellipse cx="${x}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fffdf7" stroke="${ink}" stroke-width="1.5"/>
      <ellipse cx="${x + side * rx * 0.18}" cy="${cy + ry * 0.18}" rx="${rx * 0.55}" ry="${ry * 0.6}" fill="${glow || iris}"${glow ? ' class="ab-glow-soft"' : ''}/>
      <circle cx="${x + side * rx * 0.36}" cy="${cy - ry * 0.12}" r="${rx * 0.22}" fill="#fff"/><circle cx="${x - side * rx * 0.05}" cy="${cy + ry * 0.45}" r="${rx * 0.1}" fill="#fff" opacity=".8"/>`;
    const browPath = stern
      ? `M${cx - gap - rx} ${cy - ry - 4} l${rx * 1.7} ${ry * 0.5} M${cx + gap + rx} ${cy - ry - 4} l${-rx * 1.7} ${ry * 0.5}`
      : `M${cx - gap - rx} ${cy - ry - 3} q${rx} ${-ry * 0.45} ${rx * 1.7} ${ry * 0.12} M${cx + gap + rx} ${cy - ry - 3} q${-rx} ${-ry * 0.45} ${-rx * 1.7} ${ry * 0.12}`;
    return `<g class="ab-eyes">${one(cx - gap, 1)}${one(cx + gap, -1)}${brow ? `<path class="ab-brow" d="${browPath}" stroke="${ink}" stroke-width="3" fill="none" stroke-linecap="round"/>` : ''}</g>
      <g class="ab-lids" style="transform-origin:${cx}px ${cy}px"><ellipse cx="${cx - gap}" cy="${cy}" rx="${rx + 1}" ry="${ry + 1}" fill="${lid}"/><ellipse cx="${cx + gap}" cy="${cy}" rx="${rx + 1}" ry="${ry + 1}" fill="${lid}"/></g>`;
  }
  const blush = (cx, cy, gap, c = '#ff8fa8') => `<ellipse cx="${cx - gap}" cy="${cy}" rx="8" ry="4.5" fill="${c}" opacity=".55"/><ellipse cx="${cx + gap}" cy="${cy}" rx="8" ry="4.5" fill="${c}" opacity=".55"/>`;
  const shadowOf = (id, cx = 200, cy = 292, rx = 98, ry = 15) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#2a1d14" opacity=".28" filter="url(#${id}-soft)" class="ab-shadow"/>`;
  function scatter(seed, n, fn) { const r = rng(seed); let s = ''; for (let i = 0; i < n; i++) s += fn(r, i); return s; }

  const h = { W, H, INK, f, rng, flower, tuft, tree, pine, stone, butterfly, mushroom, crystal, shell, eyes, blush, shadowOf, scatter };

  // ---------- frame shared by every arena ----------
  function baseDefs(id) {
    return `<filter id="${id}-grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="7"/><feColorMatrix values="0 0 0 0 .35  0 0 0 0 .25  0 0 0 0 .15  0 0 0 .9 0"/></filter>
      <radialGradient id="${id}-vig" cx="50%" cy="45%" r="75%"><stop offset="70%" stop-color="#2b1e15" stop-opacity="0"/><stop offset="100%" stop-color="#2b1e15" stop-opacity=".24"/></radialGradient>
      <filter id="${id}-soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4"/></filter>
      <filter id="${id}-blur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="8"/></filter>
      <filter id="${id}-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
  }
  const finish = id => `<rect width="${W}" height="${H}" filter="url(#${id}-grain)" opacity=".1" style="mix-blend-mode:multiply"/><rect width="${W}" height="${H}" fill="url(#${id}-vig)"/>`;

  const CSS = `
    .ab-root{display:block;width:100%;height:auto;overflow:hidden}
    .ab-root .ab-boss{transform-origin:200px 292px;animation:ab-breathe 2.6s ease-in-out infinite}
    .ab-root .ab-shadow{transform-origin:200px 292px;animation:ab-shadow 2.6s ease-in-out infinite}
    .ab-root .ab-lids{transform:scaleY(0);animation:ab-blink 4.6s infinite}
    .ab-root .ab-sway-l{transform-box:fill-box;transform-origin:100% 100%;animation:ab-sway 3.2s ease-in-out infinite}
    .ab-root .ab-sway-r{transform-box:fill-box;transform-origin:0% 100%;animation:ab-sway 3.2s ease-in-out infinite reverse}
    .ab-root .ab-float{animation:ab-float 3.4s ease-in-out infinite}
    .ab-root .ab-float.d2{animation-delay:-1.1s}.ab-root .ab-float.d3{animation-delay:-2.2s}
    .ab-root .ab-spin{transform-box:fill-box;transform-origin:50% 50%;animation:ab-spin 9s linear infinite}
    .ab-root .ab-glow-soft{animation:ab-glowp 2.2s ease-in-out infinite}
    .ab-root .ab-flutter{animation:ab-fly 5s ease-in-out infinite}
    .ab-root .ab-late{animation-delay:-2.3s}
    .ab-root .ab-drift{animation:ab-drift 7s ease-in-out infinite}
    .ab-root .ab-rise{animation:ab-rise 4s linear infinite}.ab-root .ab-rise.d2{animation-delay:-1.3s}.ab-root .ab-rise.d3{animation-delay:-2.6s}
    .ab-root .ab-twinkle{animation:ab-twinkle 2.8s ease-in-out infinite}.ab-root .ab-twinkle.d2{animation-delay:-1s}.ab-root .ab-twinkle.d3{animation-delay:-1.9s}
    .ab-root .ab-wave{animation:ab-wave 6s ease-in-out infinite}
    .ab-root .ab-mech{opacity:0;transition:opacity .45s}
    .ab-root.ab-hit .ab-boss{animation:ab-shake .38s linear;filter:brightness(1.8) saturate(.6)}
    .ab-root.ab-attack .ab-boss{animation:ab-lunge .7s cubic-bezier(.3,0,.2,1)}
    .ab-root.ab-phase2 .ab-brow{transform:translateY(3px)}
    .ab-root.ab-phase3 .ab-body{filter:saturate(1.35) brightness(.95)}
    .ab-root.ab-phase3 .ab-boss{animation-duration:1.4s}
    .ab-root.ab-phase3 .ab-rage{opacity:1}
    .ab-root .ab-rage{opacity:0;transition:opacity .6s}
    .ab-root.ab-defeat .ab-boss{animation:ab-down 1.2s ease-in forwards}
    @keyframes ab-breathe{0%,100%{transform:scale(1,1)}50%{transform:scale(1.015,.985)}}
    @keyframes ab-shadow{0%,100%{transform:scale(1)}50%{transform:scale(1.04,1)}}
    @keyframes ab-blink{0%,93%,100%{transform:scaleY(0)}96%{transform:scaleY(1)}}
    @keyframes ab-sway{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(5deg)}}
    @keyframes ab-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
    @keyframes ab-spin{to{transform:rotate(360deg)}}
    @keyframes ab-glowp{0%,100%{opacity:.75}50%{opacity:1}}
    @keyframes ab-fly{0%,100%{transform:translate(0,0)}25%{transform:translate(14px,-10px)}50%{transform:translate(26px,2px)}75%{transform:translate(10px,8px)}}
    @keyframes ab-drift{0%,100%{transform:translateX(0)}50%{transform:translateX(14px)}}
    @keyframes ab-rise{0%{transform:translateY(0);opacity:0}15%{opacity:.9}100%{transform:translateY(-70px);opacity:0}}
    @keyframes ab-twinkle{0%,100%{opacity:.35}50%{opacity:1}}
    @keyframes ab-wave{0%,100%{transform:translateX(0)}50%{transform:translateX(-12px)}}
    @keyframes ab-shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-7px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(3px)}}
    @keyframes ab-lunge{0%{transform:scale(1)}35%{transform:scale(.94,1.04) translateY(6px)}60%{transform:scale(1.08) translateY(-10px)}100%{transform:scale(1)}}
    @keyframes ab-down{to{transform:translateY(40px) scale(1.1,.4);opacity:0}}
    @media (prefers-reduced-motion:reduce){.ab-root *{animation:none!important}}`;

  function register(key, def) { REG[key] = def; if (def.css) extraCss.push(def.css); }
  const extraCss = [];

  function svg(key) {
    const id = 'ab' + (++uid), d = REG[key];
    const a = d.arena(id, h), b = d.boss(id, h), scale = d.scale || 0.84;
    return `<svg class="ab-root" data-boss="${key}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${d.name || key}">
      <defs>${baseDefs(id)}${a.defs || ''}${b.defs || ''}</defs>
      <g class="ab-arena">${a.body}</g>
      <g class="ab-boss"><g transform="translate(200 300) scale(${scale}) translate(-200 -300)">${b.body}</g></g>
      ${a.front ? `<g class="ab-front">${a.front}</g>` : ''}
      ${finish(id)}
    </svg>`;
  }

  function ensureCss() {
    let st = document.getElementById('ab-css');
    if (!st) { st = document.createElement('style'); st.id = 'ab-css'; document.head.appendChild(st); }
    const text = CSS + extraCss.join('\n');
    if (st.textContent !== text) st.textContent = text;
  }

  function mount(el, key, opts = {}) {
    if (!REG[key]) { el.textContent = ''; return null; }
    ensureCss();
    el.innerHTML = svg(key);
    const root = el.firstElementChild, d = REG[key];
    const pulse = (cls, ms) => { root.classList.remove(cls); void root.getBoundingClientRect(); root.classList.add(cls); setTimeout(() => root.classList.remove(cls), ms); };
    const api = {
      key,
      setPhase(n) { root.classList.toggle('ab-phase2', n >= 2); root.classList.toggle('ab-phase3', n >= 3); },
      hit() { pulse('ab-hit', 400); },
      attack() { pulse('ab-attack', 720); },
      defeat() { root.classList.add('ab-defeat'); },
      // Mechanic overlays: default toggles .ab-m-<kind> on the root; a boss can draw more in its own mark().
      mark(kind, on, value) { root.classList.toggle('ab-m-' + kind, !!on); if (d.mark) d.mark(root, kind, on, value); },
      destroy() { el.innerHTML = ''; },
    };
    api.setPhase(opts.phase || 1);
    return api;
  }

  window.AntBossArt = { mount, register, helpers: h, keys: () => Object.keys(REG), get: k => REG[k], size: { W, H } };
})();
