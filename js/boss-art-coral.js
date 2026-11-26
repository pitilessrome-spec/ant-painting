/* ANT CANVAS · Coral Island bosses: Giant Hermit Crab, Coral Shark, Rainbow Leviathan. */
(function () {
  'use strict';
  const A = window.AntBossArt; if (!A) return;
  const h = A.helpers, { W, H, INK, shell, eyes, blush, shadowOf, scatter } = h;

  const bubbles = (seed, n, y0 = 120, y1 = 330) => scatter(seed, n, (r, i) => `<circle cx="${(r() * W).toFixed(0)}" cy="${(y0 + r() * (y1 - y0)).toFixed(0)}" r="${(2 + r() * 4).toFixed(1)}" fill="#ffffff" fill-opacity=".18" stroke="#e8fbff" stroke-width="1.2" class="ab-rise ${['', 'd2', 'd3'][i % 3]}"/>`);
  const coral = (x, y, s, c, d) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0 V-30 M0 -18 q-14 -6 -16 -24 M0 -24 q12 -4 14 -22 M-12 -34 q-6 -8 -4 -16 M10 -38 q8 -6 6 -14" stroke="${d}" stroke-width="9" fill="none" stroke-linecap="round"/>
      <path d="M0 0 V-30 M0 -18 q-14 -6 -16 -24 M0 -24 q12 -4 14 -22 M-12 -34 q-6 -8 -4 -16 M10 -38 q8 -6 6 -14" stroke="${c}" stroke-width="6" fill="none" stroke-linecap="round"/></g>`;
  const fan = (x, y, s, c) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0 C-30 -10 -34 -46 -16 -58 C-4 -66 4 -66 16 -58 C34 -46 30 -10 0 0Z" fill="${c}" stroke="${INK}" stroke-opacity=".5" stroke-width="1.4"/>
      <path d="M0 0 L-18 -50 M0 0 L-6 -60 M0 0 L6 -60 M0 0 L18 -50" stroke="#fff" stroke-opacity=".45" stroke-width="1.4"/></g>`;
  const kelp = (x, y, len, cls) => `<g class="${cls}"><path d="M${x} ${y} q-12 ${-len * .25} 0 ${-len * .5} q12 ${-len * .25} 0 ${-len * .5}" stroke="#3f8f6a" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M${x} ${y} q-12 ${-len * .25} 0 ${-len * .5} q12 ${-len * .25} 0 ${-len * .5}" stroke="#5fb98a" stroke-width="5" fill="none" stroke-linecap="round"/></g>`;
  const rays = (id) => scatter(1890, 5, (r, i) => `<path d="M${40 + i * 80} -10 L${10 + i * 80} 260 L${60 + i * 80} 260 L${70 + i * 80} -10Z" fill="#e8fbff" opacity=".1" filter="url(#${id}-soft)"/>`);
  const star = (x, y, s, c) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 -12 L3.5 -4 L12 -4 L5 1.5 L7.5 10 L0 5 L-7.5 10 L-5 1.5 L-12 -4 L-3.5 -4Z" fill="${c}" stroke="${INK}" stroke-opacity=".5" stroke-width="1" stroke-linejoin="round"/></g>`;

  // ===================== Giant Hermit Crab · Shell Shallows =====================
  A.register('prism:small', {
    name: 'Giant Hermit Crab',
    arena(id) {
      const palm = (x, s, flip) => `<g transform="translate(${x} 176) scale(${flip * s} ${s})"><path d="M0 0 q-6 -50 10 -92" stroke="#a8784e" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M0 0 q-6 -50 10 -92" stroke="#c99a68" stroke-width="5" fill="none" stroke-dasharray="6 5" stroke-linecap="round"/>
          <g fill="#5fb06a" stroke="#357a44" stroke-width="1.2"><path d="M10 -92 q-40 -10 -56 14 q30 -16 56 -14z"/><path d="M10 -92 q40 -12 58 10 q-30 -14 -58 -10z"/><path d="M10 -92 q-20 -30 -46 -26 q30 2 46 26z"/><path d="M10 -92 q24 -28 48 -20 q-30 0 -48 20z"/></g></g>`;
      return {
        defs: `<linearGradient id="${id}-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a9e4f7"/><stop offset="1" stop-color="#e6f8f6"/></linearGradient>
          <linearGradient id="${id}-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4fc3d8"/><stop offset="1" stop-color="#8fe0e2"/></linearGradient>
          <linearGradient id="${id}-sand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbe7bd"/><stop offset="1" stop-color="#efd09a"/></linearGradient>`,
        body: `<rect width="${W}" height="${H}" fill="url(#${id}-sky)"/>
          <g opacity=".9" class="ab-drift"><ellipse cx="80" cy="50" rx="34" ry="11" fill="#fff"/><ellipse cx="300" cy="40" rx="30" ry="10" fill="#fff"/></g>
          <path d="M0 120 H400 V190 H0z" fill="url(#${id}-sea)"/>
          <g class="ab-wave" stroke="#ffffff" stroke-width="2.4" fill="none" opacity=".75" stroke-linecap="round"><path d="M20 140 q20 -6 40 0 M120 152 q24 -6 48 0 M240 138 q20 -6 40 0 M320 160 q22 -6 44 0"/></g>
          <path d="M0 186 q50 -10 100 -2 q50 8 100 0 q50 -8 100 0 q50 8 100 -2 V${H} H0z" fill="url(#${id}-sand)"/>
          <path d="M0 186 q50 -10 100 -2 q50 8 100 0 q50 -8 100 0 q50 8 100 -2" stroke="#ffffff" stroke-width="5" fill="none" opacity=".85" class="ab-wave"/>
          ${palm(34, 1, 1)}${palm(372, 1.05, -1)}
          <ellipse cx="200" cy="278" rx="160" ry="48" fill="#fff4d6" opacity=".7"/>
          ${shell(66, 236, 1.2, '#ffc6d4', -10)}${shell(332, 248, 1, '#ffe0b2', 14)}${shell(92, 318, 1.4, '#ffd2c2', 6)}${star(318, 316, 1.4, '#ff9f7a')}${star(48, 282, 1, '#ffc46b')}
          ${scatter(1801, 22, r => `<circle cx="${(r() * W).toFixed(0)}" cy="${(200 + r() * 150).toFixed(0)}" r="${(0.8 + r()).toFixed(1)}" fill="#d9b77c"/>`)}`,
      };
    },
    boss(id) {
      const claw = (s, big) => { const k = big ? 1.25 : 1, x = 200 + s * (big ? 92 : 84), y = 236;
        return `<g class="ab-claw ${s < 0 ? 'ab-sway-l' : 'ab-sway-r'}"><path d="M${200 + s * 46} 262 q${s * 26} -2 ${s * (big ? 40 : 34)} -18" stroke="#b8442e" stroke-width="13" fill="none" stroke-linecap="round"/>
          <g transform="translate(${x} ${y}) scale(${s * k} ${k})"><path d="M-10 6 C-14 -18 6 -34 26 -26 L14 -10 L30 -8 C30 10 10 20 -10 6Z" fill="url(#${id}-claw)" stroke="#8a2a1c" stroke-width="2.2" stroke-linejoin="round"/>
          <path d="M14 -10 L28 -20" stroke="#8a2a1c" stroke-width="1.6"/><ellipse cx="4" cy="-14" rx="8" ry="4" fill="#fff" opacity=".35"/></g></g>`; };
      return {
        defs: `<radialGradient id="${id}-shell" cx="40%" cy="30%" r="75%"><stop offset="0" stop-color="#fff2e6"/><stop offset=".6" stop-color="#f6c6b0"/><stop offset="1" stop-color="#d4917a"/></radialGradient>
          <radialGradient id="${id}-claw" cx="40%" cy="30%" r="75%"><stop offset="0" stop-color="#ffab8a"/><stop offset="1" stop-color="#d4553a"/></radialGradient>`,
        body: `${shadowOf(id, 200, 294, 112, 15)}
          <g class="ab-body">
            <path d="M118 236 C110 160 160 104 220 108 C282 112 306 170 290 222 C278 262 230 276 190 270 C150 266 122 260 118 236Z" fill="url(#${id}-shell)" stroke="#9a5a44" stroke-width="3"/>
            <path d="M214 136 C252 136 274 166 266 196 C258 222 226 230 206 214 C190 200 194 176 214 172 C230 170 236 184 228 192" stroke="#b9765e" stroke-width="3" fill="none" stroke-linecap="round"/>
            <path d="M140 200 C146 156 176 128 206 122" stroke="#fff" stroke-width="7" fill="none" opacity=".45" stroke-linecap="round"/>
            ${coral(150, 122, .55, '#ff8fb1', '#c9506f')}${coral(270, 132, .45, '#ffb36b', '#c97a3a')}
            ${scatter(1810, 6, r => `<circle cx="${(150 + r() * 120).toFixed(0)}" cy="${(160 + r() * 80).toFixed(0)}" r="${(2 + r() * 2).toFixed(1)}" fill="#c98a74" opacity=".5"/>`)}
          </g>
          <g class="ab-head ab-peek">
            <path d="M136 280 q-20 10 -30 22 M150 286 q-12 12 -16 22 M264 280 q20 10 30 22 M250 286 q12 12 16 22" stroke="#b8442e" stroke-width="7" fill="none" stroke-linecap="round"/>
            <ellipse cx="200" cy="270" rx="56" ry="30" fill="url(#${id}-claw)" stroke="#8a2a1c" stroke-width="2.6"/>
            <path d="M184 252 v-30 M216 252 v-30" stroke="#b8442e" stroke-width="6" stroke-linecap="round"/>
            ${eyes(200, 218, 16, 12, 13, { lid: '#c9553c' })}
            ${blush(200, 276, 30, '#ff7a8a')}<path d="M190 282 q10 7 20 0" stroke="#8a2a1c" stroke-width="2.4" fill="none" stroke-linecap="round"/>
          </g>
          ${claw(-1, false)}${claw(1, true)}`,
      };
    },
    scale: 0.92,
    css: `.ab-root .ab-peek,.ab-root .ab-claw{transition:transform .35s,opacity .35s}.ab-root.ab-m-shell .ab-peek{transform:translateY(-14px) scale(.55);transform-origin:200px 230px;opacity:.15}.ab-root.ab-m-shell .ab-claw{opacity:0;transform:scale(.4);transform-origin:200px 250px}.ab-root.ab-m-shell .ab-body{animation:ab-shake 1.2s linear infinite}`,
  });

  // ===================== Coral Shark · Deep Trench =====================
  A.register('prism:medium', {
    name: 'Coral Shark',
    arena(id) {
      return {
        defs: `<linearGradient id="${id}-deep" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4fb6d8"/><stop offset=".55" stop-color="#2b7fb4"/><stop offset="1" stop-color="#1c4f86"/></linearGradient>`,
        body: `<rect width="${W}" height="${H}" fill="url(#${id}-deep)"/>${rays(id)}
          <path d="M0 120 q40 -20 70 10 q20 -40 60 -20 V${H} H0z" fill="#1f5a8a" opacity=".7"/><path d="M400 110 q-40 -20 -70 10 q-20 -40 -60 -20 V${H} H400z" fill="#1f5a8a" opacity=".7"/>
          <path d="M0 230 q100 -26 200 -12 q100 14 200 -6 V${H} H0z" fill="#e6d4a4"/><path d="M0 230 q100 -26 200 -12 q100 14 200 -6" stroke="#f6ead0" stroke-width="3" fill="none"/>
          ${kelp(30, 300, 170, 'ab-sway-l')}${kelp(62, 290, 120, 'ab-sway-r')}${kelp(352, 300, 160, 'ab-sway-r')}${kelp(380, 296, 110, 'ab-sway-l')}
          ${coral(98, 248, 1, '#ff8fb1', '#c9506f')}${fan(130, 252, .8, '#ffb36b')}${coral(306, 250, 1.1, '#ff9f7a', '#c9603a')}${fan(272, 248, .7, '#c88bff')}
          ${bubbles(1820, 12)}`,
        front: `<g class="ab-tide ab-mech"><path d="M-20 160 q60 -30 120 0 q60 30 120 0 q60 -30 120 0 q60 30 120 0 V400 H-20z" fill="#bff3ff" opacity=".22" class="ab-wave"/><path d="M-20 160 q60 -30 120 0 q60 30 120 0 q60 -30 120 0 q60 30 120 0" stroke="#e8fbff" stroke-width="3" fill="none" class="ab-wave"/></g>`,
      };
    },
    boss(id) {
      return {
        defs: `<linearGradient id="${id}-skin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fb7e8"/><stop offset=".55" stop-color="#4f86c6"/><stop offset="1" stop-color="#3a6aa8"/></linearGradient>`,
        body: `${shadowOf(id, 200, 296, 104, 14)}
          <g transform="translate(0 -6)"><g class="ab-float">
          <g class="ab-body">
            <path d="M200 96 C214 120 220 140 222 150 L178 150 C180 140 186 120 200 96Z" fill="url(#${id}-skin)" stroke="#23466e" stroke-width="2.4"/>
            ${coral(200, 128, .5, '#ff8fb1', '#c9506f')}
            <g class="ab-sway-l"><path d="M120 226 C92 230 72 256 66 278 C92 268 112 258 128 248Z" fill="url(#${id}-skin)" stroke="#23466e" stroke-width="2.2"/></g>
            <g class="ab-sway-r"><path d="M280 226 C308 230 328 256 334 278 C308 268 288 258 272 248Z" fill="url(#${id}-skin)" stroke="#23466e" stroke-width="2.2"/></g>
            <path d="M200 140 C262 140 296 190 290 236 C284 278 246 296 200 296 C154 296 116 278 110 236 C104 190 138 140 200 140Z" fill="url(#${id}-skin)" stroke="#23466e" stroke-width="3"/>
            <path d="M140 250 C150 284 250 284 260 250 C254 280 230 292 200 292 C170 292 146 280 140 250Z" fill="#f2f8ff" stroke="#23466e" stroke-width="1.8"/>
            <path d="M132 200 C140 170 164 152 190 148" stroke="#fff" stroke-width="7" fill="none" opacity=".35" stroke-linecap="round"/>
            <path d="M126 230 l10 -4 M128 240 l10 -3 M274 230 l-10 -4 M272 240 l-10 -3" stroke="#23466e" stroke-width="2" stroke-linecap="round"/>
          </g>
          <g class="ab-head">
            ${eyes(200, 204, 34, 13, 14, { stern: true, lid: '#4f86c6', iris: '#1c2d4a', ink: '#1c2d4a' })}
            <path d="M156 244 Q200 276 244 244 Q200 262 156 244Z" fill="#7a2a3a" stroke="#1c2d4a" stroke-width="2.2"/>
            <path d="M162 246 l6 8 l6 -6 l6 8 l6 -7 l7 8 l7 -8 l6 7 l6 -8 l6 6 l6 -8" fill="#ffffff" stroke="#1c2d4a" stroke-width="1" stroke-linejoin="round"/>
          </g></g></g>`,
      };
    },
    scale: 0.92,
    css: `.ab-root.ab-m-tide .ab-tide{opacity:1}`,
  });

  // ===================== Rainbow Leviathan · Sunken Coral Temple =====================
  A.register('prism:world', {
    name: 'Rainbow Leviathan',
    arena(id) {
      const column = (x, hgt, broken) => `<g><rect x="${x - 14}" y="${236 - hgt}" width="28" height="${hgt}" fill="#d8e8e8" stroke="#6f8f96" stroke-width="1.4"/>
          <path d="M${x - 6} ${236 - hgt} V236 M${x + 6} ${236 - hgt} V236" stroke="#a8c4c8" stroke-width="1.4"/>
          ${broken ? `<path d="M${x - 14} ${236 - hgt} l8 -10 l8 6 l6 -8 l6 12z" fill="#d8e8e8" stroke="#6f8f96" stroke-width="1.4"/>` : `<rect x="${x - 20}" y="${232 - hgt}" width="40" height="10" rx="2" fill="#e8f2f2" stroke="#6f8f96" stroke-width="1.4"/>`}
          <rect x="${x - 20}" y="230" width="40" height="10" rx="2" fill="#e8f2f2" stroke="#6f8f96" stroke-width="1.4"/>
          <path d="M${x - 14} ${230 - hgt * .4} q14 8 28 0" stroke="#5fb98a" stroke-width="3" fill="none"/></g>`;
      const rainbow = ['#ff8fb1', '#ffb36b', '#ffe07a', '#8fe0a0', '#7fc8ff', '#c88bff'];
      return {
        defs: `<linearGradient id="${id}-deep" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3fa8c8"/><stop offset=".55" stop-color="#2a6ea8"/><stop offset="1" stop-color="#25447e"/></linearGradient>`,
        body: `<rect width="${W}" height="${H}" fill="url(#${id}-deep)"/>${rays(id)}
          <path d="M70 86 Q200 20 330 86" stroke="#d8e8e8" stroke-width="16" fill="none"/><path d="M70 86 Q200 20 330 86" stroke="#6f8f96" stroke-width="1.4" fill="none" transform="translate(0 8)"/>
          ${column(70, 150, false)}${column(330, 150, false)}${column(128, 96, true)}${column(272, 104, true)}
          <path d="M0 236 q100 -14 200 -6 q100 8 200 -4 V${H} H0z" fill="#d9e6d8"/>
          <ellipse cx="200" cy="282" rx="158" ry="46" fill="none" stroke="#f1d27a" stroke-width="2.4" opacity=".7"/>
          ${rainbow.map((c, i) => fan(26 + i * 12, 322 - (i % 2) * 8, .55, c)).join('')}${rainbow.map((c, i) => fan(314 + i * 13, 320 - (i % 2) * 8, .55, c)).join('')}
          ${coral(30, 250, .9, '#ff8fb1', '#c9506f')}${coral(372, 252, .95, '#ffb36b', '#c97a3a')}
          ${scatter(1830, 10, (r, i) => `<path d="M${(r() * W).toFixed(0)} ${(250 + r() * 90).toFixed(0)} l2 -5 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2z" fill="#fff6b0" class="ab-twinkle ${['', 'd2', 'd3'][i % 3]}"/>`)}
          ${bubbles(1831, 14, 60, 320)}`,
      };
    },
    boss(id) {
      const coil = 'M92 290 C70 250 96 210 150 214 C196 218 210 256 250 258 C296 260 322 228 310 196 C298 164 256 160 238 182';
      const fanFin = side => { const x = 200 + side * 52, y = 146, tip = [[side * 46, -40], [side * 58, -12], [side * 50, 18]];
        return `<path d="M${x} ${y} L${x + tip[0][0]} ${y + tip[0][1]} Q${x + side * 66} ${y - 14} ${x + tip[1][0]} ${y + tip[1][1]} Q${x + side * 62} ${y + 8} ${x + tip[2][0]} ${y + tip[2][1]}Z" fill="${side < 0 ? '#c88bff' : '#7fc8ff'}" fill-opacity=".9" stroke="#2d3f6e" stroke-width="2" stroke-linejoin="round"/>
          ${tip.map(([dx, dy]) => `<path d="M${x} ${y} L${x + dx * .92} ${y + dy * .92}" stroke="#2d3f6e" stroke-width="1.4" opacity=".6"/>`).join('')}`; };
      const back = 'M150 214 C112 200 96 160 118 120 C134 92 168 84 190 98';
      return {
        defs: `<linearGradient id="${id}-rain" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff8fb1"/><stop offset=".2" stop-color="#ffb36b"/><stop offset=".4" stop-color="#ffe07a"/><stop offset=".6" stop-color="#8fe0a0"/><stop offset=".8" stop-color="#7fc8ff"/><stop offset="1" stop-color="#c88bff"/></linearGradient>
          <linearGradient id="${id}-rain2" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#c88bff"/><stop offset=".5" stop-color="#7fc8ff"/><stop offset="1" stop-color="#8fe0a0"/></linearGradient>
          <radialGradient id="${id}-head" cx="45%" cy="30%" r="75%"><stop offset="0" stop-color="#e6f6ff"/><stop offset=".6" stop-color="#9fd4f0"/><stop offset="1" stop-color="#6aa4d8"/></radialGradient>`,
        body: `${shadowOf(id, 200, 298, 128, 16)}
          <g class="ab-body">
            <path d="${back}" stroke="#2d3f6e" stroke-width="34" fill="none" stroke-linecap="round"/><path d="${back}" stroke="url(#${id}-rain2)" stroke-width="28" fill="none" stroke-linecap="round"/>
            <path d="${back}" stroke="#2d3f6e" stroke-width="28" fill="none" stroke-dasharray="1 9" stroke-linecap="round" opacity=".18"/>
            ${[[104, 160], [120, 118], [150, 92]].map(([x, y]) => `<path d="M${x} ${y} l-14 -10 l16 -2z" fill="#c88bff" stroke="#2d3f6e" stroke-width="1.6" stroke-linejoin="round"/>`).join('')}
            <path d="${coil}" stroke="#2d3f6e" stroke-width="46" fill="none" stroke-linecap="round"/>
            <path d="${coil}" stroke="url(#${id}-rain)" stroke-width="40" fill="none" stroke-linecap="round"/>
            <path d="${coil}" stroke="#2d3f6e" stroke-width="40" fill="none" stroke-dasharray="1 10" stroke-linecap="round" opacity=".16"/>
            <path d="${coil}" stroke="#ffffff" stroke-width="12" fill="none" stroke-linecap="round" opacity=".28" transform="translate(-3 -8)"/>
            <path d="M96 268 C88 240 110 222 140 224" stroke="#fff" stroke-width="5" fill="none" opacity=".5" stroke-linecap="round"/>
            <path d="M84 298 l-22 10 l10 -20z" fill="#c88bff" stroke="#2d3f6e" stroke-width="2"/>
            ${[[150, 196], [196, 224], [244, 236], [296, 210]].map(([x, y], i) => `<path d="M${x} ${y} l-8 -18 l16 4z" fill="${['#ffb36b', '#ffe07a', '#8fe0a0', '#7fc8ff'][i]}" stroke="#2d3f6e" stroke-width="1.6" stroke-linejoin="round"/>`).join('')}
          </g>
          <g class="ab-head">
            <path d="M200 236 C210 210 236 196 238 182" stroke="#2d3f6e" stroke-width="40" fill="none" stroke-linecap="round"/><path d="M200 236 C210 210 236 196 238 182" stroke="#9fd4f0" stroke-width="34" fill="none" stroke-linecap="round"/>
            <g class="ab-sway-l">${fanFin(-1)}</g><g class="ab-sway-r">${fanFin(1)}</g>
            <path d="M144 160 C144 118 172 100 200 100 C228 100 256 118 256 160 C256 196 230 214 200 214 C170 214 144 196 144 160Z" fill="url(#${id}-head)" stroke="#2d3f6e" stroke-width="2.8"/>
            <path d="M160 140 C166 120 184 110 200 108" stroke="#fff" stroke-width="5" fill="none" opacity=".55" stroke-linecap="round"/>
            ${eyes(200, 156, 24, 14, 16, { stern: true, lid: '#7fb8e0', iris: '#2d3f6e', ink: '#1f2c52' })}
            <path d="M168 190 q-26 4 -40 20 M232 190 q26 4 40 20" stroke="#2d3f6e" stroke-width="2.4" fill="none" stroke-linecap="round"/>
            <path d="M188 192 q12 8 24 0" stroke="#1f2c52" stroke-width="2.4" fill="none" stroke-linecap="round"/>
            <g transform="translate(200 102)"><g class="ab-float">${coral(-18, 0, .45, '#ff8fb1', '#c9506f')}${coral(0, -4, .55, '#ffe07a', '#c9a03a')}${coral(18, 0, .45, '#7fc8ff', '#3a7ac9')}<circle cx="0" cy="-6" r="5" fill="#fff6b0" class="ab-glow-soft"/></g></g>
          </g>
          <g class="ab-stun ab-mech"><g transform="translate(200 92)"><g class="ab-spin">${[0, 1, 2, 3, 4].map(i => `<path transform="rotate(${i * 72}) translate(40 0)" d="M0 -8 L2.4 -2.6 L8 -2.4 L3.8 1.2 L5 7 L0 4 L-5 7 L-3.8 1.2 L-8 -2.4 L-2.4 -2.6Z" fill="#ffe07a" stroke="#c9a03a" stroke-width="1"/>`).join('')}</g></g></g>`,
      };
    },
    scale: 0.88,
    css: `.ab-root.ab-m-stun .ab-stun{opacity:1}.ab-root.ab-m-stun .ab-head{animation:ab-sway 1.2s ease-in-out infinite;transform-origin:200px 230px}`,
  });
})();
