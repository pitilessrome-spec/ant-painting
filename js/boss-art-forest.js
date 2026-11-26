/* ANT CANVAS · Mushroom Forest bosses: Toxic Slime, Phantom Centipede, Abyss Spider Queen. */
(function () {
  'use strict';
  const A = window.AntBossArt; if (!A) return;
  const h = A.helpers, { W, H, flower, tuft, mushroom, crystal, eyes, blush, shadowOf, scatter } = h;

  const spores = (seed, n, c, y0 = 40, y1 = 300) => scatter(seed, n, (r, i) => `<circle cx="${(r() * W).toFixed(1)}" cy="${(y0 + r() * (y1 - y0)).toFixed(1)}" r="${(1 + r() * 2).toFixed(1)}" fill="${c}" class="ab-twinkle ${['', 'd2', 'd3'][i % 3]}"/>`);
  const glowShroom = (id, x, y, s, c) => `<g><circle cx="${x}" cy="${y - 26 * s}" r="${24 * s}" fill="${c}" opacity=".5" filter="url(#${id}-blur)" class="ab-glow-soft"/>${mushroom(x, y, s, c, '#ffffff', '#e8e2f2', true)}</g>`;

  // ===================== Toxic Slime · Toxic Bog =====================
  A.register('spider:small', {
    name: 'Toxic Slime',
    arena(id) {
      const tree = (x, s) => `<g transform="translate(${x} 170) scale(${s})"><path d="M-8 0 q-6 -40 -2 -70 q-20 -16 -30 -10 q16 -2 26 6 q-2 -18 8 -30 q2 20 4 30 q12 -12 28 -10 q-18 4 -22 18 q4 30 4 66z" fill="#4b3a52" stroke="#2c2234" stroke-width="1.4"/></g>`;
      const pad = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0 a22 9 0 1 0 2 -9 l-2 9z" fill="#6fae63" stroke="#3e6d3a" stroke-width="1.2"/><path d="M-12 -2 q10 -5 22 -2" stroke="#9fd08c" stroke-width="1.4" fill="none"/></g>`;
      const bubbles = scatter(1501, 9, (r, i) => `<circle cx="${(60 + r() * 280).toFixed(0)}" cy="${(268 + r() * 40).toFixed(0)}" r="${(2 + r() * 4).toFixed(1)}" fill="none" stroke="#c8f0a0" stroke-width="1.4" class="ab-rise ${['', 'd2', 'd3'][i % 3]}"/>`);
      return {
        defs: `<linearGradient id="${id}-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5d5a8a"/><stop offset=".5" stop-color="#8e86a8"/><stop offset="1" stop-color="#b7c49a"/></linearGradient>
          <linearGradient id="${id}-bog" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fbf6e"/><stop offset="1" stop-color="#5f8f4e"/></linearGradient>
          <radialGradient id="${id}-pond" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#a8d86a"/><stop offset=".7" stop-color="#6fa652"/><stop offset="1" stop-color="#4f7d3d"/></radialGradient>`,
        body: `<rect width="${W}" height="${H}" fill="url(#${id}-sky)"/>
          <circle cx="320" cy="62" r="26" fill="#f3f0c8" opacity=".85"/><circle cx="320" cy="62" r="44" fill="#f3f0c8" opacity=".15"/>
          ${tree(30, 1.1)}${tree(96, .8)}${tree(318, .85)}${tree(378, 1.15)}
          <path d="M0 160 q100 -24 200 -10 q100 12 200 -6 V${H} H0z" fill="url(#${id}-bog)"/>
          <ellipse cx="200" cy="276" rx="176" ry="58" fill="url(#${id}-pond)" stroke="#3e6d3a" stroke-width="2"/>
          <path d="M60 268 q40 -8 80 0 M250 290 q40 -8 80 0" stroke="#d7f3a8" stroke-width="2" opacity=".5" fill="none" stroke-linecap="round"/>
          ${pad(70, 300, 1)}${pad(330, 262, .8)}${pad(110, 252, .7)}${pad(300, 318, 1.1)}
          ${glowShroom(id, 40, 214, 1, '#b46bd6')}${glowShroom(id, 78, 224, .7, '#d07ae0')}${glowShroom(id, 352, 220, .9, '#b46bd6')}${glowShroom(id, 380, 236, .6, '#d07ae0')}
          ${scatter(1502, 14, r => `<path d="M${(r() * W).toFixed(0)} ${(200 + r() * 30).toFixed(0)} q-2 -26 3 -40" stroke="#6b8f4a" stroke-width="2.2" fill="none"/>`)}
          ${bubbles}${spores(1503, 14, '#e6ffb8')}`,
        front: scatter(1504, 14, r => tuft(r() * W, 330 + r() * 30, .8 + r() * .5, '#5f8f4e', '#3e6d3a')),
      };
    },
    boss(id) {
      const mini = (x, c) => `<g class="ab-mini ab-mech"><path d="M${x - 34} 290 q-2 -50 34 -54 q36 4 34 54z" fill="${c}" stroke="#5b2c74" stroke-width="2" opacity=".95"/>${eyes(x, 268, 10, 7, 8, { brow: false, lid: '#7d3fa0' })}</g>`;
      return {
        defs: `<radialGradient id="${id}-jelly" cx="40%" cy="30%" r="75%"><stop offset="0" stop-color="#e6b8ff"/><stop offset=".55" stop-color="#b36fe0"/><stop offset="1" stop-color="#7d3fa0"/></radialGradient>
          <radialGradient id="${id}-cap" cx="40%" cy="30%" r="75%"><stop offset="0" stop-color="#ff8fb1"/><stop offset="1" stop-color="#b8325f"/></radialGradient>`,
        body: `${shadowOf(id, 200, 294, 104, 15)}
          <g class="ab-body ab-main">
            <path d="M96 290 C92 214 132 160 200 158 C268 160 308 214 304 290 C290 300 268 296 258 288 C250 304 230 306 220 292 C210 306 190 306 180 292 C170 306 150 304 142 288 C132 296 110 300 96 290Z" fill="url(#${id}-jelly)" stroke="#5b2c74" stroke-width="3" opacity=".96"/>
            <path d="M120 236 C124 196 152 176 184 170" stroke="#fff" stroke-width="8" fill="none" opacity=".35" stroke-linecap="round"/>
            <circle cx="248" cy="250" r="9" fill="#fff" opacity=".22"/><circle cx="264" cy="232" r="5" fill="#fff" opacity=".22"/><circle cx="138" cy="270" r="6" fill="#fff" opacity=".2"/>
            <circle cx="236" cy="276" r="4" fill="none" stroke="#f2dcff" stroke-width="1.4" class="ab-rise"/><circle cx="168" cy="282" r="3" fill="none" stroke="#f2dcff" stroke-width="1.4" class="ab-rise d2"/>
          </g>
          <g class="ab-head">
            <g transform="translate(200 166)"><g class="ab-float">
              <path d="M-8 4 q-2 -14 2 -22 h12 q4 8 2 22z" fill="#f3e6cf" stroke="#5b2c74" stroke-width="1.6"/>
              <path d="M-62 -12 q6 -54 62 -58 q56 4 62 58 q-62 14 -124 0z" fill="url(#${id}-cap)" stroke="#7a1f42" stroke-width="2.6"/>
              <circle cx="-30" cy="-36" r="9" fill="#fff"/><circle cx="8" cy="-52" r="7" fill="#fff"/><circle cx="36" cy="-28" r="8" fill="#fff"/><circle cx="-4" cy="-24" r="5" fill="#fff"/>
              <ellipse cx="-24" cy="-52" rx="16" ry="6" fill="#fff" opacity=".35"/>
            </g></g>
            ${eyes(200, 236, 26, 17, 19, { lid: '#9d58c8' })}${blush(200, 262, 46, '#ff9ad0')}
            <path d="M184 266 q16 14 32 0 q-16 6 -32 0z" fill="#5b2c74"/><path d="M193 270 q7 6 14 0" fill="#ff8fb1"/>
          </g>
          ${mini(92, '#c98bf0')}${mini(308, '#c98bf0')}`,
      };
    },
    css: `.ab-root .ab-main{transition:transform .5s}.ab-root.ab-m-split .ab-mini{opacity:1}.ab-root.ab-m-split .ab-main,.ab-root.ab-m-split .ab-head{transform:scale(.82);transform-origin:200px 292px}`,
  });

  // ===================== Phantom Centipede · Dark Fungus Cave =====================
  A.register('spider:medium', {
    name: 'Phantom Centipede',
    arena(id) {
      return {
        defs: `<radialGradient id="${id}-cave" cx="50%" cy="40%" r="75%"><stop offset="0" stop-color="#3d4c7a"/><stop offset=".6" stop-color="#26305a"/><stop offset="1" stop-color="#161b38"/></radialGradient>
          <linearGradient id="${id}-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3e5a6a"/><stop offset="1" stop-color="#26394a"/></linearGradient>`,
        body: `<rect width="${W}" height="${H}" fill="url(#${id}-cave)"/>
          <path d="M0 0 H400 V60 q-40 30 -70 10 q-30 40 -70 16 q-40 30 -70 4 q-40 34 -70 8 q-40 26 -60 -6 q-30 30 -60 6z" fill="#1b2142" stroke="#0f1430" stroke-width="2"/>
          ${scatter(1601, 7, (r, i) => `<path d="M${30 + i * 58} 40 q${4 + r() * 6} ${30 + r() * 40} 0 ${60 + r() * 40}" stroke="#2a3466" stroke-width="${6 + r() * 6}" fill="none" stroke-linecap="round"/>`)}
          <path d="M0 140 q40 -60 90 -40 q30 -50 80 -30 V180 H0z M400 140 q-40 -60 -90 -40 q-30 -50 -80 -30 V180 H400z" fill="#202a52" stroke="#121838" stroke-width="2"/>
          <path d="M0 176 q100 -20 200 -8 q100 10 200 -6 V${H} H0z" fill="url(#${id}-floor)"/>
          <ellipse cx="200" cy="276" rx="160" ry="50" fill="#5fe3f0" opacity=".08"/>
          ${glowShroom(id, 40, 200, 1.1, '#5fd8f0')}${glowShroom(id, 84, 190, .7, '#7ee6c8')}${glowShroom(id, 64, 230, .8, '#5fd8f0')}
          ${glowShroom(id, 352, 196, 1.05, '#5fd8f0')}${glowShroom(id, 316, 186, .65, '#7ee6c8')}${glowShroom(id, 368, 236, .75, '#9be8ff')}
          ${crystal(130, 182, .6, '#9be8ff', '#d8f8ff', -12)}${crystal(276, 180, .55, '#9be8ff', '#d8f8ff', 10)}
          ${spores(1602, 26, '#a8f6ff', 30, 260)}`,
        front: `${glowShroom(id, 24, 344, 1.2, '#5fd8f0')}${glowShroom(id, 380, 350, 1.3, '#7ee6c8')}` + scatter(1603, 10, r => tuft(r() * W, 336 + r() * 24, .8, '#3f7a74', '#24504c')),
      };
    },
    boss(id) {
      // Body curls from the back left to the head at the front; each segment glows faintly.
      const segs = [[132, 132, 20], [160, 116, 23], [196, 112, 25], [232, 124, 27], [252, 154, 29], [246, 190, 31], [222, 214, 32]];
      const seg = ([x, y, r], i) => `<g><path d="M${x - r * .9} ${y + r * .6} l-14 16 M${x + r * .9} ${y + r * .6} l14 16" stroke="#3a3f8a" stroke-width="4" stroke-linecap="round"/>
          <ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * .82}" fill="url(#${id}-seg)" stroke="#3a3f8a" stroke-width="2.2"/>
          <ellipse cx="${x}" cy="${y + 2}" rx="${r * .42}" ry="${r * .3}" fill="#bff6ff" opacity=".75" class="ab-glow-soft"/>
          <ellipse cx="${x - r * .35}" cy="${y - r * .4}" rx="${r * .3}" ry="${r * .14}" fill="#fff" opacity=".35"/></g>`;
      return {
        defs: `<radialGradient id="${id}-seg" cx="40%" cy="30%" r="75%"><stop offset="0" stop-color="#c9d6ff"/><stop offset=".55" stop-color="#8f97e8"/><stop offset="1" stop-color="#5a5fb8"/></radialGradient>`,
        body: `${shadowOf(id, 204, 294, 96, 14)}
          <g class="ab-body ab-phantom">${segs.map(seg).join('')}
            <path d="M120 128 q-20 -16 -34 -6 M120 140 q-24 -4 -32 8" stroke="#3a3f8a" stroke-width="3" fill="none" stroke-linecap="round"/></g>
          <g class="ab-head ab-phantom">
            <path d="M174 272 q-18 18 -8 34 q8 -14 20 -18z M226 272 q18 18 8 34 q-8 -14 -20 -18z" fill="#e7ecff" stroke="#3a3f8a" stroke-width="2" stroke-linejoin="round"/>
            <ellipse cx="200" cy="250" rx="52" ry="40" fill="url(#${id}-seg)" stroke="#3a3f8a" stroke-width="2.6"/>
            <ellipse cx="184" cy="226" rx="20" ry="7" fill="#fff" opacity=".3"/>
            <g class="ab-sway-l"><path d="M178 214 q-16 -48 -54 -60" stroke="#3a3f8a" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="122" cy="153" r="5" fill="#bff6ff" class="ab-glow-soft"/></g>
            <g class="ab-sway-r"><path d="M222 214 q16 -48 54 -60" stroke="#3a3f8a" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="278" cy="153" r="5" fill="#bff6ff" class="ab-glow-soft"/></g>
            ${eyes(200, 248, 21, 14, 16, { stern: true, lid: '#6c72c8', glow: '#43d6ee', ink: '#22265a' })}
            <path d="M190 276 q10 5 20 0" stroke="#22265a" stroke-width="2.2" fill="none" stroke-linecap="round"/>
          </g>
          <g class="ab-rage">${scatter(1610, 6, r => `<circle cx="${140 + r() * 120}" cy="${110 + r() * 160}" r="${2 + r() * 2}" fill="#bff6ff" class="ab-twinkle"/>`)}</g>`,
      };
    },
    scale: 0.92,
    css: `.ab-root .ab-phantom{transition:opacity .6s,filter .6s}.ab-root.ab-m-hidden .ab-phantom{opacity:.22;filter:blur(1.2px)}.ab-root.ab-m-hidden .ab-shadow{opacity:.08}`,
  });

  // ===================== Abyss Spider Queen · Glowing Web Cave =====================
  A.register('spider:world', {
    name: 'Abyss Spider Queen',
    arena(id) {
      let web = '';
      for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; web += `<path d="M200 150 L${(200 + Math.cos(a) * 260).toFixed(0)} ${(150 + Math.sin(a) * 260).toFixed(0)}"/>`; }
      for (let k = 1; k <= 6; k++) { let d = ''; for (let i = 0; i <= 12; i++) { const a = i * Math.PI / 6, r = k * 34 + (i % 2) * 4; d += (i ? 'L' : 'M') + (200 + Math.cos(a) * r).toFixed(0) + ' ' + (150 + Math.sin(a) * r).toFixed(0); } web += `<path d="${d}"/>`; }
      const thread = (x, len) => `<path d="M${x} 0 V${len}" stroke="#d8c8ff" stroke-width="1" opacity=".6"/><circle cx="${x}" cy="${len}" r="3" fill="#f0e8ff" class="ab-twinkle"/>`;
      return {
        defs: `<radialGradient id="${id}-cave" cx="50%" cy="40%" r="75%"><stop offset="0" stop-color="#5b3f86"/><stop offset=".6" stop-color="#352358"/><stop offset="1" stop-color="#1c1233"/></radialGradient>
          <linearGradient id="${id}-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4c3a6e"/><stop offset="1" stop-color="#2e2248"/></linearGradient>`,
        body: `<rect width="${W}" height="${H}" fill="url(#${id}-cave)"/>
          <g stroke="#cdb8ff" stroke-width="1.2" fill="none" opacity=".55" class="ab-glow-soft">${web}</g>
          ${thread(40, 90)}${thread(78, 60)}${thread(330, 80)}${thread(364, 110)}
          <path d="M0 176 q100 -18 200 -8 q100 10 200 -6 V${H} H0z" fill="url(#${id}-floor)"/>
          <ellipse cx="200" cy="276" rx="168" ry="52" fill="#e0b8ff" opacity=".09"/>
          ${glowShroom(id, 36, 214, .9, '#ff8fd0')}${glowShroom(id, 364, 214, .9, '#ff8fd0')}${glowShroom(id, 70, 236, .6, '#c88bff')}${glowShroom(id, 332, 238, .6, '#c88bff')}
          ${crystal(104, 206, .7, '#d9b8ff', '#f4e8ff', -10)}${crystal(298, 204, .7, '#d9b8ff', '#f4e8ff', 12)}
          ${spores(1702, 22, '#f2d8ff', 20, 280)}`,
        front: scatter(1703, 12, r => { const x = r() * W; return Math.abs(x - 200) < 100 ? '' : flower(x, 330 + r() * 26, 7 + r() * 4, r() < .5 ? '#ff9ad0' : '#d6b0ff', '#fff1a8', r() * 60, 5, '#3a1f52'); }),
      };
    },
    boss(id) {
      // Legs fan out to the sides: rear pair high and back, front pair reaching forward to the ground.
      const LEGS = [[110, 104, 172, 196], [132, 138, 188, 238], [130, 178, 182, 280], [108, 214, 150, 312]];
      const leg = (s, i) => {
        const [kxo, ky, fxo, fy] = LEGS[i], bx = 200 + s * 46, by = 236 + i * 8, kx = 200 + s * kxo, fx = 200 + s * fxo;
        const d = `M${bx} ${by} Q${200 + s * (kxo - 30)} ${ky + 10} ${kx} ${ky} Q${kx + s * (fxo - kxo) * .9} ${ky + 6} ${fx} ${fy}`;
        return `<path d="${d}" stroke="#2a1840" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" stroke="#7a52b0" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="${kx}" cy="${ky}" r="5" fill="#c9a2ff" stroke="#2a1840" stroke-width="1.4"/><circle cx="${fx}" cy="${fy}" r="3.5" fill="#2a1840"/>`;
      };
      const egg = (x, y, i) => `<g class="ab-egg ab-mech" data-i="${i}"><ellipse cx="${x}" cy="${y}" rx="15" ry="19" fill="#f4ecff" stroke="#8d6bc0" stroke-width="1.8"/><path d="M${x - 12} ${y - 6} q12 6 24 0 M${x - 13} ${y + 6} q13 6 26 0 M${x} ${y - 19} v38" stroke="#c4aef0" stroke-width="1" fill="none"/><ellipse cx="${x - 5}" cy="${y - 8}" rx="4" ry="6" fill="#fff" opacity=".7"/></g>`;
      return {
        defs: `<radialGradient id="${id}-abd" cx="40%" cy="30%" r="75%"><stop offset="0" stop-color="#b48ae8"/><stop offset=".6" stop-color="#6e46a8"/><stop offset="1" stop-color="#3a2263"/></radialGradient>
          <radialGradient id="${id}-head" cx="45%" cy="30%" r="75%"><stop offset="0" stop-color="#8c66c8"/><stop offset="1" stop-color="#3e2668"/></radialGradient>`,
        body: `${shadowOf(id, 200, 298, 130, 16)}
          <g>${[0, 1, 2, 3].map(i => leg(-1, i) + leg(1, i)).join('')}</g>
          <g class="ab-body">
            <ellipse cx="200" cy="168" rx="84" ry="74" fill="url(#${id}-abd)" stroke="#2a1840" stroke-width="3"/>
            <path d="M200 112 l18 28 l-18 28 l-18 -28z M200 172 l14 22 l-14 22 l-14 -22z" fill="#ff8fd0" opacity=".85" class="ab-glow-soft"/>
            <path d="M142 150 C146 122 168 104 194 100" stroke="#fff" stroke-width="7" fill="none" opacity=".3" stroke-linecap="round"/>
          </g>
          <g class="ab-head">
            <ellipse cx="200" cy="262" rx="62" ry="44" fill="url(#${id}-head)" stroke="#2a1840" stroke-width="2.6"/>
            <ellipse cx="184" cy="236" rx="22" ry="8" fill="#fff" opacity=".2"/>
            <circle cx="170" cy="232" r="4.5" fill="#ff8fd0" class="ab-glow-soft"/><circle cx="230" cy="232" r="4.5" fill="#ff8fd0" class="ab-glow-soft"/><circle cx="184" cy="226" r="3.5" fill="#ff8fd0" class="ab-glow-soft"/><circle cx="216" cy="226" r="3.5" fill="#ff8fd0" class="ab-glow-soft"/>
            ${eyes(200, 260, 22, 15, 17, { stern: true, lid: '#5a3a8c', iris: '#2a1840', ink: '#1c1030' })}
            <path d="M186 292 q-6 12 -2 18 M214 292 q6 12 2 18" stroke="#2a1840" stroke-width="4" fill="none" stroke-linecap="round"/>
            <g transform="translate(200 220)"><g class="ab-float"><path d="M-34 6 L-28 -16 L-14 -2 L0 -26 L14 -2 L28 -16 L34 6Z" fill="#e8d4ff" stroke="#6e46a8" stroke-width="1.8" stroke-linejoin="round"/>
              <circle cx="0" cy="-26" r="4" fill="#ff8fd0" class="ab-glow-soft"/><circle cx="-28" cy="-16" r="3" fill="#9be8ff"/><circle cx="28" cy="-16" r="3" fill="#9be8ff"/><circle cx="0" cy="-2" r="5" fill="#ff8fd0"/></g></g>
          </g>
          ${egg(96, 282, 0)}${egg(304, 282, 1)}${egg(132, 306, 2)}${egg(268, 306, 3)}`,
      };
    },
    scale: 0.8,
    css: `.ab-root .ab-egg{transition:opacity .4s}.ab-root .ab-egg.on{opacity:1}`,
    mark(root, kind, on, n = 2) { if (kind === 'eggs') root.querySelectorAll('.ab-egg').forEach((g, i) => g.classList.toggle('on', !!on && i < n)); },
  });
})();
