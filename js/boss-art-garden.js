/* ANT CANVAS · Storybook Garden bosses: Giant Ladybug, Thorn Mantis, Golden Scarab King. */
(function () {
  'use strict';
  const A = window.AntBossArt; if (!A) return;
  const h = A.helpers, { W, H, INK, flower, tuft, tree, stone, butterfly, eyes, blush, shadowOf, scatter } = h;
  const PETALS = ['#f7a8c0', '#fbd0dc', '#ffffff', '#f6c6e8', '#ffd98a'];

  function sky(id, top, mid, low) {
    return `<linearGradient id="${id}-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset=".55" stop-color="${mid}"/><stop offset="1" stop-color="${low}"/></linearGradient>
      <radialGradient id="${id}-sun" cx="82%" cy="10%" r="35%"><stop offset="0" stop-color="#fff8d2"/><stop offset="1" stop-color="#fff8d2" stop-opacity="0"/></radialGradient>`;
  }
  const clouds = `<g opacity=".9" class="ab-drift"><ellipse cx="60" cy="58" rx="34" ry="11" fill="#fff"/><ellipse cx="82" cy="52" rx="22" ry="12" fill="#fff"/><ellipse cx="300" cy="44" rx="28" ry="9" fill="#fff"/><ellipse cx="318" cy="39" rx="17" ry="10" fill="#fff"/></g>`;
  const rose = (x, y, r, c = '#e8546a', d = '#b83248') => `<g transform="translate(${x} ${y})"><circle r="${r}" fill="${c}" stroke="${d}" stroke-width="1"/><path d="M${-r * .5} 0 a${r * .5} ${r * .5} 0 1 1 ${r * .5} ${r * .45} a${r * .3} ${r * .3} 0 1 1 ${-r * .1} ${-r * .55}" fill="none" stroke="${d}" stroke-width="1.1"/><circle cx="${-r * .35}" cy="${-r * .35}" r="${r * .22}" fill="#fff" opacity=".35"/></g>`;
  const bush = (x, y, s, roses) => `<g transform="translate(${x} ${y}) scale(${s})"><circle cx="-18" cy="-14" r="18" fill="#4f9a4a" stroke="#2f5a2a" stroke-width="1.1"/><circle cx="16" cy="-14" r="19" fill="#4f9a4a" stroke="#2f5a2a" stroke-width="1.1"/><circle cx="0" cy="-28" r="22" fill="#5fae55" stroke="#2f5a2a" stroke-width="1.1"/><ellipse cx="-6" cy="-40" rx="9" ry="5" fill="#fff" opacity=".2"/>${roses}</g>`;

  // ===================== Giant Ladybug · Flower Path =====================
  A.register('beetle:small', {
    name: 'Giant Ladybug',
    arena(id) {
      const far = scatter(1201, 46, (r, i) => { const side = i % 2 ? 1 : -1; return flower(200 + side * (70 + r() * 125), 150 + r() * 70, 3.5 + r() * 2.5, PETALS[Math.floor(r() * 5)], '#ffd45c', r() * 70); });
      const near = scatter(1202, 30, r => { const x = r() * W, y = 300 + r() * 60; return Math.abs(x - 200) < 70 && y < 330 ? '' : flower(x, y, 7 + r() * 6, PETALS[Math.floor(r() * 5)], '#ffd45c', r() * 70); });
      const tufts = scatter(1203, 26, r => tuft(r() * W, 230 + r() * 120, 0.7 + r() * 0.6));
      const st = h.rng(1204); let stones = '';
      for (const [x, y, w, hh] of [[200, 352, 54, 20], [176, 326, 46, 17], [206, 304, 40, 15], [184, 186, 22, 9], [205, 172, 18, 8], [188, 160, 15, 7]]) stones += stone(x, y, w, hh, st);
      return {
        defs: sky(id, '#bfe7f7', '#e3f4ee', '#f4f9e4') + `<linearGradient id="${id}-meadow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a9db84"/><stop offset="1" stop-color="#7fbf5f"/></linearGradient>
          <radialGradient id="${id}-ring" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff3c9" stop-opacity=".85"/><stop offset=".7" stop-color="#ffe7a8" stop-opacity=".45"/><stop offset="1" stop-color="#ffe7a8" stop-opacity="0"/></radialGradient>`,
        body: `<rect width="${W}" height="${H}" fill="url(#${id}-sky)"/><rect width="${W}" height="${H}" fill="url(#${id}-sun)"/>${clouds}
          <path d="M0 150 q70 -46 150 -18 q70 22 130 -10 q60 -28 120 6 v60 H0z" fill="#b9e09b" stroke="#86b96a"/>
          ${tree(36, 150, 1.05, '#8fd06f', '#6fb556')}${tree(92, 140, .8, '#f5b9cf', '#ec9dbb', '#a1704c')}${tree(318, 144, .9, '#f5b9cf', '#ec9dbb', '#a1704c')}${tree(372, 152, 1.1, '#8fd06f', '#6fb556')}
          <path d="M0 168 q100 -26 200 -12 q100 12 200 -6 V${H} H0z" fill="url(#${id}-meadow)"/>
          <path d="M28 182 v-26 M60 180 v-26 M92 178 v-26 M308 178 v-26 M340 180 v-26 M372 182 v-26" stroke="#9a6a46" stroke-width="5" stroke-linecap="round"/>
          <path d="M22 164 q35 -6 76 -8 M22 174 q35 -6 76 -8 M302 158 q40 2 76 8 M302 168 q40 2 76 8" stroke="#b07d55" stroke-width="3" fill="none" stroke-linecap="round"/>
          ${far}<ellipse cx="200" cy="272" rx="150" ry="48" fill="url(#${id}-ring)"/>${stones}${tufts}
          ${butterfly(96, 112, '#ffd1e3')}${butterfly(330, 120, '#cfe8ff', 'ab-flutter ab-late')}<g>${near}</g>`,
      };
    },
    boss(id) {
      const spots = [[160, 172, 15], [146, 212, 12], [178, 236, 10], [240, 172, 15], [254, 212, 12], [222, 236, 10], [200, 140, 9]];
      const leg = (x, y, dx, dy, fl) => `<path d="M${x} ${y} q${dx * 0.5} ${dy * 0.2} ${dx} ${dy} q${fl * 4} 3 ${fl * 9} 2" stroke="#2c2838" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
      return {
        defs: `<radialGradient id="${id}-shell" cx="38%" cy="28%" r="78%"><stop offset="0" stop-color="#ff9c86"/><stop offset=".45" stop-color="#ef4f3f"/><stop offset="1" stop-color="#b42d2a"/></radialGradient>
          <radialGradient id="${id}-head" cx="45%" cy="30%" r="75%"><stop offset="0" stop-color="#5a5472"/><stop offset="1" stop-color="#2c2838"/></radialGradient>
          <radialGradient id="${id}-spot" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#4a4256"/><stop offset="1" stop-color="#231f2c"/></radialGradient>
          <radialGradient id="${id}-gold" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff3a8"/><stop offset=".6" stop-color="#ffd24a" stop-opacity=".8"/><stop offset="1" stop-color="#ffb52e" stop-opacity="0"/></radialGradient>`,
        body: `${shadowOf(id, 200, 290)}
          <g>${leg(132, 250, -26, 30, -1)}${leg(126, 228, -34, 18, -1)}${leg(140, 266, -10, 24, -1)}${leg(268, 250, 26, 30, 1)}${leg(274, 228, 34, 18, 1)}${leg(260, 266, 10, 24, 1)}</g>
          <g class="ab-body">
            <path d="M108 222 C108 150 150 116 200 116 C250 116 292 150 292 222 C292 268 250 290 200 290 C150 290 108 268 108 222Z" fill="url(#${id}-shell)" stroke="#7a2420" stroke-width="3"/>
            <path d="M200 120 V286" stroke="#7a2420" stroke-width="2.5" opacity=".75"/>
            <path d="M126 196 C134 150 166 128 196 126" stroke="#fff" stroke-width="7" fill="none" opacity=".35" stroke-linecap="round"/>
            <ellipse cx="160" cy="150" rx="16" ry="8" fill="#fff" opacity=".45" transform="rotate(-28 160 150)"/>
            ${spots.map(([x, y, s], i) => `<g class="ab-spot" data-i="${i}"><circle cx="${x}" cy="${y}" r="${s * 1.9}" fill="url(#${id}-gold)" class="ab-spot-glow"/><ellipse cx="${x}" cy="${y}" rx="${s}" ry="${s * .9}" fill="url(#${id}-spot)" stroke="#1d1922"/><ellipse cx="${x - s * .3}" cy="${y - s * .35}" rx="${s * .32}" ry="${s * .2}" fill="#fff" opacity=".35"/></g>`).join('')}
            <g transform="translate(200 122)"><path d="M-10 -4 q-8 -14 4 -18 q4 8 6 14 q2 -6 6 -14 q12 4 4 18z" fill="#7ccb62" stroke="#4d8a3d" stroke-width="1.2"/>${flower(0, -18, 7, '#fbd0dc')}</g>
          </g>
          <g class="ab-head">
            <ellipse cx="200" cy="268" rx="58" ry="40" fill="url(#${id}-head)" stroke="#1d1922" stroke-width="2.5"/><ellipse cx="186" cy="246" rx="22" ry="8" fill="#fff" opacity=".18"/>
            <g class="ab-sway-l"><path d="M178 236 q-14 -40 -40 -48" stroke="#2c2838" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="136" cy="187" r="7" fill="#ff8fb1" stroke="#1d1922" stroke-width="1.5"/></g>
            <g class="ab-sway-r"><path d="M222 236 q14 -40 40 -48" stroke="#2c2838" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="264" cy="187" r="7" fill="#ff8fb1" stroke="#1d1922" stroke-width="1.5"/></g>
            ${eyes(200, 266, 21, 15, 17)}${blush(200, 288, 34)}
            <path d="M192 293 q8 6 16 0" stroke="#fffdf7" stroke-width="2.4" fill="none" stroke-linecap="round"/>
          </g>`,
      };
    },
    css: `.ab-root .ab-spot-glow{opacity:0;transition:opacity .4s}.ab-root .ab-spot.on .ab-spot-glow{opacity:1;animation:ab-glowp 1.2s ease-in-out infinite}`,
    mark(root, kind, on, n = 3) { if (kind === 'spot') root.querySelectorAll('.ab-spot').forEach((g, i) => g.classList.toggle('on', !!on && i < n)); },
  });

  // ===================== Thorn Mantis · Thorn Arena =====================
  A.register('beetle:medium', {
    name: 'Thorn Mantis',
    arena(id) {
      const roses = (s) => scatter(s, 5, r => rose(-26 + r() * 52, -38 + r() * 26, 4 + r() * 2, r() < .5 ? '#e8546a' : '#f48fb1', '#b83248'));
      const hedge = [[20, 182, 1.1], [70, 172, .9], [118, 166, .8], [282, 166, .8], [330, 172, .9], [380, 182, 1.1]].map(([x, y, s], i) => bush(x, y, s, roses(1300 + i))).join('');
      const brambles = `<g fill="none" stroke="#6b4a2e" stroke-width="3" stroke-linecap="round">
          <path d="M0 330 q60 -30 120 -6 q40 16 70 2"/><path d="M400 336 q-70 -34 -130 -8 q-30 12 -60 0"/></g>
        <g fill="#6b4a2e">${scatter(1310, 18, r => { const x = r() * 190, y = 330 - Math.sin(x / 40) * 10 - 8; return `<path d="M${x} ${y} l3 -7 l3 7z"/>`; })}${scatter(1311, 18, r => { const x = 210 + r() * 190, y = 330 - Math.sin(x / 40) * 10 - 6; return `<path d="M${x} ${y} l3 -7 l3 7z"/>`; })}</g>`;
      const near = scatter(1312, 10, r => rose(r() * W, 316 + r() * 40, 7 + r() * 4, r() < .5 ? '#e8546a' : '#f48fb1'));
      return {
        defs: sky(id, '#ffd9b8', '#fde8cf', '#f3edd2') + `<linearGradient id="${id}-dirt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9c29a"/><stop offset="1" stop-color="#bd9f72"/></linearGradient>`,
        body: `<rect width="${W}" height="${H}" fill="url(#${id}-sky)"/><rect width="${W}" height="${H}" fill="url(#${id}-sun)"/>${clouds}
          <path d="M0 140 q90 -40 200 -24 q110 16 200 -10 v60 H0z" fill="#9fcf7e" stroke="#6fa456"/>
          ${tree(40, 134, .9, '#7cc36a', '#5aa34f')}${tree(360, 130, .95, '#7cc36a', '#5aa34f')}
          <path d="M0 168 q100 -24 200 -14 q100 10 200 -4 V${H} H0z" fill="#8cc66a"/>
          <ellipse cx="200" cy="262" rx="176" ry="70" fill="url(#${id}-dirt)" stroke="#9c7d52" stroke-width="2"/>
          <ellipse cx="200" cy="262" rx="150" ry="56" fill="none" stroke="#efe0bd" stroke-width="2" stroke-dasharray="6 7" opacity=".8"/>
          ${hedge}
          <g stroke="#9a6a46" stroke-width="5" stroke-linecap="round"><path d="M150 168 v-34 M250 168 v-34"/></g>
          <path d="M146 140 q54 -34 108 0" stroke="#b07d55" stroke-width="6" fill="none" stroke-linecap="round"/>
          ${rose(176, 128, 6)}${rose(200, 118, 7, '#f48fb1')}${rose(224, 128, 6)}
          ${scatter(1313, 16, r => tuft(r() * W, 300 + r() * 50, .7 + r() * .5, '#5fa64e'))}`,
        front: brambles + near,
      };
    },
    boss(id) {
      const G = '#8fd36a', D = '#5aa34f', E = '#2f5a2a';
      // Raptorial forelegs: the upper arm rises outwards, the serrated blade folds back down towards the face.
      const scythe = s => {
        const sx = 200 + s * 26, sy = 214, ex = 200 + s * 90, ey = 128, tx = 200 + s * 50, ty = 204;
        return `<g class="${s < 0 ? 'ab-sway-l' : 'ab-sway-r'}">
          <path d="M${sx} ${sy} Q${200 + s * 70} ${190} ${ex} ${ey}" stroke="${E}" stroke-width="17" fill="none" stroke-linecap="round"/>
          <path d="M${sx} ${sy} Q${200 + s * 70} ${190} ${ex} ${ey}" stroke="${G}" stroke-width="12" fill="none" stroke-linecap="round"/>
          <path d="M${200 + s * 40} ${206} q${s * 22} -10 ${s * 34} -40" stroke="#fff" stroke-width="2.4" fill="none" opacity=".4" stroke-linecap="round"/>
          ${[0, 1, 2, 3].map(i => { const t = .3 + i * .17, px = sx + (ex - sx) * t - s * 4, py = sy + (ey - sy) * t + 6; return `<path d="M${px} ${py} l${-s * 7} 3 l${s * 2} -7z" fill="#f4f9e8" stroke="${E}" stroke-width="1.1" stroke-linejoin="round"/>`; }).join('')}
          <path d="M${ex - s * 4} ${ey - 4} Q${200 + s * 104} ${ty - 34} ${tx} ${ty} Q${200 + s * 70} ${ty - 30} ${ex - s * 8} ${ey + 14}Z" fill="#c7ee9a" stroke="${E}" stroke-width="2.2" stroke-linejoin="round"/>
          ${[0, 1, 2].map(i => { const px = ex - s * (12 + i * 11), py = ey + 18 + i * 9; return `<path d="M${px} ${py} l${-s * 3} 6" stroke="${E}" stroke-width="1.6" stroke-linecap="round"/>`; }).join('')}
          <circle cx="${ex}" cy="${ey}" r="6" fill="${D}" stroke="${E}" stroke-width="1.6"/></g>`;
      };
      return {
        defs: `<linearGradient id="${id}-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b6ea8c"/><stop offset="1" stop-color="#6cbb53"/></linearGradient>`,
        body: `${shadowOf(id, 200, 292, 90, 13)}
          <g stroke="${E}" stroke-width="4" fill="none" stroke-linecap="round"><path d="M178 262 q-40 10 -58 30 M222 262 q40 10 58 30 M184 274 q-24 14 -30 22 M216 274 q24 14 30 22"/></g>
          <g class="ab-body">
            <path d="M200 236 q-44 18 -40 54 q4 22 40 22 q36 0 40 -22 q4 -36 -40 -54z" fill="url(#${id}-g)" stroke="${E}" stroke-width="2.4"/>
            <path d="M172 268 q28 8 56 0 M168 284 q32 9 64 0" stroke="${E}" stroke-opacity=".5" stroke-width="1.6" fill="none"/>
            <path d="M188 200 q12 -6 24 0 l6 44 q-18 8 -36 0z" fill="${G}" stroke="${E}" stroke-width="2.2"/>
            <g class="ab-thorns ab-mech"><path d="M176 214 q24 16 48 -2 q-20 26 -44 14 q22 18 46 2" stroke="#6b4a2e" stroke-width="3" fill="none"/>${scatter(1320, 9, r => `<path d="M${180 + r() * 40} ${214 + r() * 26} l3 -6 l3 6z" fill="#6b4a2e"/>`)}</g>
            ${rose(222, 214, 7)}<path d="M208 220 q8 -10 16 -4" stroke="#4d8a3d" stroke-width="2" fill="none"/>
          </g>
          ${scythe(-1)}${scythe(1)}
          <g class="ab-head">
            <g class="ab-sway-l"><path d="M186 140 q-20 -40 -46 -50" stroke="${E}" stroke-width="2.2" fill="none" stroke-linecap="round"/></g>
            <g class="ab-sway-r"><path d="M214 140 q20 -40 46 -50" stroke="${E}" stroke-width="2.2" fill="none" stroke-linecap="round"/></g>
            <path d="M152 150 q48 -30 96 0 q-10 40 -48 56 q-38 -16 -48 -56z" fill="url(#${id}-g)" stroke="${E}" stroke-width="2.6" stroke-linejoin="round"/>
            <ellipse cx="184" cy="146" rx="20" ry="6" fill="#fff" opacity=".3"/>
            ${eyes(200, 158, 26, 15, 17, { iris: '#264d2a', lid: '#5aa34f', stern: true, ink: E })}
            <path d="M192 192 q8 5 16 0" stroke="${E}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
            <path d="M193 196 l-3 6 M207 196 l3 6" stroke="${E}" stroke-width="2" stroke-linecap="round"/>
          </g>`,
      };
    },
    scale: 0.94,
    css: `.ab-root.ab-m-thorns .ab-thorns{opacity:1}`,
  });

  // ===================== Golden Scarab King · Garden Palace =====================
  A.register('beetle:world', {
    name: 'Golden Scarab King',
    arena(id) {
      const tower = (x, w, hgt, roof) => `<g><rect x="${x - w / 2}" y="${150 - hgt}" width="${w}" height="${hgt}" fill="#fbf1e2" stroke="#b69a73" stroke-width="1.4"/>
          <path d="M${x - w / 2 - 6} ${150 - hgt} L${x} ${150 - hgt - w * 1.2} L${x + w / 2 + 6} ${150 - hgt}Z" fill="${roof}" stroke="#a0465a" stroke-width="1.4" stroke-linejoin="round"/>
          <rect x="${x - 5}" y="${150 - hgt + 14}" width="10" height="16" rx="5" fill="#9fd2f2" stroke="#b69a73"/><circle cx="${x}" cy="${150 - hgt - w * 1.2 - 4}" r="3" fill="#ffd45c"/></g>`;
      const arch = (x) => `<path d="M${x - 26} 238 v-40 q26 -36 52 0 v40" stroke="#7ccb62" stroke-width="7" fill="none" stroke-linecap="round"/>${scatter(1400 + x, 9, r => flower(x - 28 + r() * 56, 196 - r() * 28 + (r() * 30), 4 + r() * 2, PETALS[Math.floor(r() * 5)]))}`;
      const rays = scatter(1410, 7, (r, i) => `<path d="M200 -20 L${60 + i * 48} 200 L${84 + i * 48} 200Z" fill="#fff6c4" opacity=".16"/>`);
      return {
        defs: sky(id, '#ffe9b0', '#fff3d6', '#fbf1e0') + `<radialGradient id="${id}-floor" cx="50%" cy="35%" r="70%"><stop offset="0" stop-color="#fffaf0"/><stop offset="1" stop-color="#e9d9bb"/></radialGradient>`,
        body: `<rect width="${W}" height="${H}" fill="url(#${id}-sky)"/>${rays}
          <rect x="60" y="88" width="280" height="64" fill="#fbf1e2" stroke="#b69a73" stroke-width="1.4"/>
          ${tower(70, 34, 86, '#f48fb1')}${tower(330, 34, 86, '#f48fb1')}${tower(140, 28, 74, '#f7a8c0')}${tower(260, 28, 74, '#f7a8c0')}${tower(200, 44, 100, '#ef6f8e')}
          <path d="M96 100 v26 l10 -6 l10 6 v-26z M284 100 v26 l10 -6 l10 6 v-26z" fill="#e8546a" stroke="#a0465a"/>
          <path d="M0 150 H400 V${H} H0z" fill="url(#${id}-floor)"/>
          <path d="M0 180 H400 M0 212 H400 M0 250 H400 M0 296 H400 M140 150 L80 360 M260 150 L320 360 M200 150 V360" stroke="#d9c6a0" stroke-width="1.2" opacity=".7"/>
          <ellipse cx="200" cy="270" rx="150" ry="52" fill="none" stroke="#e3b44c" stroke-width="3"/><ellipse cx="200" cy="270" rx="126" ry="42" fill="none" stroke="#e3b44c" stroke-width="1.4" stroke-dasharray="3 6"/>
          ${arch(50)}${arch(350)}
          ${scatter(1411, 12, r => `<circle cx="${r() * W}" cy="${40 + r() * 120}" r="${1.2 + r() * 1.6}" fill="#fff6b0" class="ab-twinkle ${['', 'd2', 'd3'][Math.floor(r() * 3)]}"/>`)}`,
        front: scatter(1412, 16, r => { const x = r() * W; return Math.abs(x - 200) < 90 ? '' : flower(x, 322 + r() * 34, 7 + r() * 5, PETALS[Math.floor(r() * 5)]); }),
      };
    },
    boss(id) {
      const leg = (x, y, dx, dy) => `<path d="M${x} ${y} q${dx * .4} ${dy * .1} ${dx} ${dy}" stroke="#6b4a1e" stroke-width="7" fill="none" stroke-linecap="round"/>`;
      return {
        defs: `<radialGradient id="${id}-gold" cx="38%" cy="26%" r="80%"><stop offset="0" stop-color="#fff2b0"/><stop offset=".45" stop-color="#f3c552"/><stop offset="1" stop-color="#b07a1c"/></radialGradient>
          <radialGradient id="${id}-ball" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#fff6c8"/><stop offset=".5" stop-color="#f1c04a"/><stop offset="1" stop-color="#a8701a"/></radialGradient>
          <radialGradient id="${id}-bronze" cx="45%" cy="30%" r="75%"><stop offset="0" stop-color="#8a6a3a"/><stop offset="1" stop-color="#4a3418"/></radialGradient>`,
        body: `${shadowOf(id, 196, 294, 120, 16)}
          <g class="ab-ball-g"><circle cx="318" cy="250" r="42" fill="url(#${id}-ball)" stroke="#8a5a14" stroke-width="2.5" class="ab-ball"/>
            <path d="M292 236 q20 -14 44 -6 M290 258 q26 10 54 -2" stroke="#b78629" stroke-width="2" fill="none" opacity=".7"/><ellipse cx="304" cy="226" rx="10" ry="6" fill="#fff" opacity=".55"/></g>
          <g>${leg(124, 240, -30, 40)}${leg(118, 214, -40, 22)}${leg(276, 240, 30, 40)}${leg(282, 214, 40, 22)}</g>
          <g class="ab-body">
            <path d="M104 214 C104 136 148 104 200 104 C252 104 296 136 296 214 C296 262 252 288 200 288 C148 288 104 262 104 214Z" fill="url(#${id}-gold)" stroke="#8a5a14" stroke-width="3"/>
            <path d="M200 108 V284" stroke="#8a5a14" stroke-width="2.5"/>
            <path d="M150 140 q-24 40 -12 96 M250 140 q24 40 12 96 M176 120 q-10 50 0 120 M224 120 q10 50 0 120" stroke="#c99633" stroke-width="2" fill="none" opacity=".8"/>
            <g transform="translate(200 168)"><circle r="26" fill="none" stroke="#b07a1c" stroke-width="2"/>${Array.from({ length: 12 }, (_, k) => `<path d="M0 -30 L3 -40 L-3 -40Z" fill="#b07a1c" transform="rotate(${k * 30})"/>`).join('')}<circle r="15" fill="#ffe9a0" stroke="#8a5a14" stroke-width="1.6"/><circle r="9" fill="#e2364d"/><circle cx="-3" cy="-3" r="2.4" fill="#fff" opacity=".85"/></g>
            <path d="M122 190 C128 146 160 122 192 118" stroke="#fff" stroke-width="7" fill="none" opacity=".4" stroke-linecap="round"/>
            <path d="M136 272 q64 26 128 0 l-6 14 q-58 20 -116 0z" fill="#d6344a" stroke="#8a2030" stroke-width="1.6"/>
            <path d="M138 272 q62 24 124 0" stroke="#ffd45c" stroke-width="3" fill="none"/>
          </g>
          <g class="ab-head">
            <ellipse cx="200" cy="270" rx="60" ry="38" fill="url(#${id}-bronze)" stroke="#2e2010" stroke-width="2.5"/>
            <ellipse cx="184" cy="250" rx="24" ry="8" fill="#fff" opacity=".18"/>
            ${eyes(200, 266, 22, 14, 15, { stern: true, lid: '#5a4222', iris: '#3a2410' })}
            <path d="M190 290 q10 -5 20 0" stroke="#fffdf7" stroke-width="2.4" fill="none" stroke-linecap="round"/>
            <g transform="translate(200 230) scale(1.35)"><g class="ab-float">
              <path d="M-30 4 L-24 -16 L-12 -4 L0 -22 L12 -4 L24 -16 L30 4Z" fill="#ffd45c" stroke="#9c6b1c" stroke-width="1.8" stroke-linejoin="round"/>
              ${flower(-18, 2, 6, '#f7a8c0')}${flower(0, -2, 7, '#ffffff')}${flower(18, 2, 6, '#f7a8c0')}<circle cx="0" cy="-22" r="3.5" fill="#e8546a"/>
            </g></g>
          </g>`,
      };
    },
    scale: 0.8,
    css: `.ab-root .ab-ball{transform-box:fill-box;transform-origin:50% 50%}.ab-root.ab-m-ball .ab-ball{animation:ab-spin 1.6s linear infinite;filter:drop-shadow(0 0 10px #ffd24a)}.ab-root.ab-m-ball .ab-ball-g{animation:ab-roll 1.6s ease-in-out infinite alternate}@keyframes ab-roll{to{transform:translateX(-22px)}}`,
  });
})();
