/* ANT CANVAS · Snowlight Valley bosses: Snowfield Scorpion, Crystal Giant, Frost Dragon Emperor. */
(function () {
  'use strict';
  const A = window.AntBossArt; if (!A) return;
  const h = A.helpers, { W, H, pine, crystal, eyes, blush, shadowOf, scatter } = h;

  const flakes = (seed, n) => scatter(seed, n, (r, i) => `<circle cx="${(r() * W).toFixed(0)}" cy="${(r() * 300).toFixed(0)}" r="${(1.2 + r() * 2).toFixed(1)}" fill="#ffffff" opacity=".9" class="ab-fall f${i % 4}"/>`);
  const mountains = (c1, c2) => `<path d="M-10 170 L60 70 L110 130 L170 50 L240 140 L300 76 L370 150 L410 110 V200 H-10z" fill="${c1}" stroke="${c2}" stroke-width="1.4" stroke-linejoin="round"/>
      <path d="M60 70 L48 88 q6 6 12 0 q6 6 12 0z M170 50 L154 74 q8 6 16 0 q8 6 16 0z M300 76 L288 94 q6 6 12 0 q6 6 12 0z" fill="#ffffff"/>`;
  const snowGround = (id) => `<path d="M0 176 q100 -22 200 -10 q100 12 200 -6 V${H} H0z" fill="url(#${id}-snow)"/><path d="M0 176 q100 -22 200 -10 q100 12 200 -6" stroke="#ffffff" stroke-width="4" fill="none"/>`;
  const snowDefs = id => `<linearGradient id="${id}-snow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4fbff"/><stop offset="1" stop-color="#d6e8f4"/></linearGradient>`;
  const drifts = scatter(1901, 6, r => `<ellipse cx="${(r() * W).toFixed(0)}" cy="${(250 + r() * 90).toFixed(0)}" rx="${(30 + r() * 30).toFixed(0)}" ry="7" fill="#ffffff" opacity=".8"/>`);

  // ===================== Snowfield Scorpion · Snowy Plain =====================
  A.register('frost:small', {
    name: 'Snowfield Scorpion',
    arena(id) {
      return {
        defs: snowDefs(id) + `<linearGradient id="${id}-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe0f5"/><stop offset="1" stop-color="#eef7fb"/></linearGradient>`,
        body: `<rect width="${W}" height="${H}" fill="url(#${id}-sky)"/>${mountains('#c9dced', '#93b3cc')}
          ${pine(30, 186, 1.1)}${pine(70, 176, .8)}${pine(332, 178, .85)}${pine(374, 188, 1.15)}
          ${snowGround(id)}<ellipse cx="200" cy="280" rx="160" ry="46" fill="#e6f3fb"/>${drifts}${flakes(1902, 26)}`,
        front: `${pine(-6, 380, 1.4)}${pine(410, 384, 1.5)}`,
      };
    },
    boss(id) {
      const tail = 'M232 236 C284 214 300 160 280 118 C262 82 222 76 204 100';
      const pincer = s => `<g class="${s < 0 ? 'ab-sway-l' : 'ab-sway-r'}"><path d="M${200 + s * 44} 262 q${s * 30} 0 ${s * 50} -24" stroke="#5f86ad" stroke-width="12" fill="none" stroke-linecap="round"/><path d="M${200 + s * 44} 262 q${s * 30} 0 ${s * 50} -24" stroke="#cfe6f8" stroke-width="7" fill="none" stroke-linecap="round"/>
          <g transform="translate(${200 + s * 96} 232) scale(${s} 1)"><path d="M-6 8 C-14 -14 4 -32 24 -28 L12 -12 L28 -10 C28 8 12 18 -6 8Z" fill="url(#${id}-ice)" stroke="#3f6a92" stroke-width="2.2" stroke-linejoin="round"/><ellipse cx="6" cy="-14" rx="7" ry="3.5" fill="#fff" opacity=".6"/></g></g>`;
      return {
        defs: `<radialGradient id="${id}-ice" cx="40%" cy="30%" r="75%"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#cfe6f8"/><stop offset="1" stop-color="#8fb6d8"/></radialGradient>`,
        body: `${shadowOf(id, 200, 296, 110, 14)}
          <g stroke="#5f86ad" stroke-width="6" fill="none" stroke-linecap="round"><path d="M164 278 l-34 18 M168 286 l-24 22 M236 278 l34 18 M232 286 l24 22"/></g>
          <g class="ab-body">
            <path d="${tail}" stroke="#3f6a92" stroke-width="26" fill="none" stroke-linecap="round"/><path d="${tail}" stroke="url(#${id}-ice)" stroke-width="20" fill="none" stroke-linecap="round"/>
            <path d="${tail}" stroke="#3f6a92" stroke-width="20" fill="none" stroke-dasharray="2 16" opacity=".35"/>
            <g class="ab-sting"><g transform="translate(204 100) rotate(200)">${crystal(0, 0, .8, '#9be8ff', '#e8fbff')}</g><circle cx="200" cy="112" r="16" fill="#9be8ff" opacity=".0" class="ab-sting-glow"/></g>
            <ellipse cx="200" cy="248" rx="62" ry="44" fill="url(#${id}-ice)" stroke="#3f6a92" stroke-width="2.6"/>
            <path d="M150 238 q50 14 100 0 M156 258 q44 12 88 0" stroke="#8fb6d8" stroke-width="2" fill="none"/>
          </g>
          ${pincer(-1)}${pincer(1)}
          <g class="ab-head">
            <ellipse cx="200" cy="274" rx="40" ry="26" fill="url(#${id}-ice)" stroke="#3f6a92" stroke-width="2.4"/>
            ${eyes(200, 270, 16, 11, 12, { stern: true, lid: '#a8c8e4', iris: '#2a4466', ink: '#203a5a' })}
            ${blush(200, 286, 26, '#9bc8ff')}<path d="M194 290 q6 4 12 0" stroke="#203a5a" stroke-width="2" fill="none" stroke-linecap="round"/>
          </g>`,
      };
    },
    scale: 0.92,
    css: `.ab-root .ab-sting-glow{transition:opacity .4s}.ab-root.ab-m-sting .ab-sting-glow{opacity:.55;animation:ab-glowp 1s ease-in-out infinite}.ab-root.ab-m-sting .ab-sting{filter:drop-shadow(0 0 8px #9be8ff)}
      .ab-root .ab-fall{animation:ab-fall 6s linear infinite}.ab-root .ab-fall.f1{animation-delay:-1.5s}.ab-root .ab-fall.f2{animation-delay:-3s}.ab-root .ab-fall.f3{animation-delay:-4.5s}
      @keyframes ab-fall{0%{transform:translate(0,-30px);opacity:0}10%{opacity:.9}100%{transform:translate(18px,90px);opacity:0}}`,
  });

  // ===================== Crystal Giant · Crystal Ruins =====================
  A.register('frost:medium', {
    name: 'Crystal Giant',
    arena(id) {
      const pillar = (x, hgt, tilt) => `<g transform="rotate(${tilt} ${x} 200)"><rect x="${x - 16}" y="${200 - hgt}" width="32" height="${hgt}" fill="#cfe2f2" stroke="#6f8fae" stroke-width="1.4"/><path d="M${x - 16} ${200 - hgt} l10 -12 l10 8 l12 -10 v14z" fill="#cfe2f2" stroke="#6f8fae" stroke-width="1.4"/><path d="M${x - 16} ${200 - hgt + 4} h32" stroke="#ffffff" stroke-width="3"/></g>`;
      return {
        defs: snowDefs(id) + `<linearGradient id="${id}-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6f8fd0"/><stop offset=".6" stop-color="#a9c4e8"/><stop offset="1" stop-color="#dfeaf6"/></linearGradient>`,
        body: `<rect width="${W}" height="${H}" fill="url(#${id}-sky)"/>${mountains('#b4c8e6', '#7f9ac4')}
          ${pillar(70, 110, -4)}${pillar(118, 70, 6)}${pillar(282, 80, -6)}${pillar(332, 116, 4)}
          ${snowGround(id)}
          ${crystal(40, 230, 1.2, '#9be8ff', '#e8fbff', -14)}${crystal(64, 236, .8, '#c8b8ff', '#f2ecff', 10)}${crystal(356, 232, 1.1, '#9be8ff', '#e8fbff', 12)}${crystal(334, 240, .7, '#c8b8ff', '#f2ecff', -8)}
          <ellipse cx="200" cy="282" rx="160" ry="44" fill="#e6f3fb"/>${drifts}${flakes(1911, 18)}`,
      };
    },
    boss(id) {
      const block = (x, y, w, hh, r = 10) => `<rect x="${x - w / 2}" y="${y - hh / 2}" width="${w}" height="${hh}" rx="${r}" fill="url(#${id}-ice)" stroke="#3f6a92" stroke-width="2.4"/><path d="M${x - w / 2 + 8} ${y - hh / 2 + 8} h${w * .4}" stroke="#ffffff" stroke-width="4" stroke-linecap="round" opacity=".7"/>`;
      const floatC = (x, y, c, i) => `<g class="ab-crystal" data-i="${i}"><g transform="translate(${x} ${y})"><g class="ab-float ${['', 'd2', 'd3'][i]}"><circle r="28" fill="${c}" opacity=".45" filter="url(#${id}-soft)"/>${crystal(0, 24, 1.25, c, '#ffffff')}</g></g></g>`;
      return {
        defs: `<linearGradient id="${id}-ice" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eaf6ff"/><stop offset="1" stop-color="#9ec4e4"/></linearGradient>
          <radialGradient id="${id}-core" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffffff"/><stop offset=".4" stop-color="#7fe0ff"/><stop offset="1" stop-color="#2a8ad0"/></radialGradient>`,
        body: `${shadowOf(id, 200, 298, 116, 15)}
          <g class="ab-body">
            ${block(156, 286, 40, 30, 8)}${block(244, 286, 40, 30, 8)}
            ${block(200, 230, 132, 104, 18)}
            <path d="M136 186 q30 -12 60 -2 q30 -10 68 4 v8 q-64 -10 -128 0z" fill="#ffffff" stroke="#b9d3e4" stroke-width="1"/>
            <circle cx="200" cy="232" r="20" fill="url(#${id}-core)" stroke="#2a6aa0" stroke-width="2" class="ab-glow-soft"/><circle cx="200" cy="232" r="34" fill="#7fe0ff" opacity=".25" filter="url(#${id}-soft)"/>
            <path d="M152 210 l14 10 M246 252 l-12 -8 M160 262 l10 -4" stroke="#7fa6c8" stroke-width="1.6"/>
            <g class="ab-sway-l">${block(118, 214, 34, 40)}${block(110, 258, 38, 42)}</g>
            <g class="ab-sway-r">${block(282, 214, 34, 40)}${block(290, 258, 38, 42)}</g>
          </g>
          <g class="ab-head">
            ${block(200, 152, 78, 62, 16)}
            <path d="M162 124 q18 -10 38 -4 q20 -6 38 4 v6 q-38 -8 -76 0z" fill="#ffffff" stroke="#b9d3e4" stroke-width="1"/>
            ${eyes(200, 156, 18, 11, 12, { stern: true, lid: '#a8c8e4', glow: '#4fd0ff', ink: '#203a5a' })}
            <path d="M190 178 h20" stroke="#203a5a" stroke-width="2.4" stroke-linecap="round"/>
          </g>
          ${floatC(96, 132, '#ff9ad0', 0)}${floatC(304, 132, '#7fc8ff', 1)}${floatC(200, 62, '#ffe07a', 2)}`,
      };
    },
    scale: 0.9,
    css: `.ab-root .ab-crystal{transition:opacity .4s,filter .4s}.ab-root .ab-crystal.broken{opacity:.18;filter:grayscale(1)}`,
    mark(root, kind, on, value) { if (kind === 'crystals' && Array.isArray(value)) root.querySelectorAll('.ab-crystal').forEach((g, i) => g.classList.toggle('broken', on && value[i] === false)); },
  });

  // ===================== Frost Dragon Emperor · Aurora Throne =====================
  A.register('frost:world', {
    name: 'Frost Dragon Emperor',
    arena(id) {
      const band = (y, c, d) => `<path d="M-20 ${y} C60 ${y - 40} 120 ${y + 30} 200 ${y - 10} C280 ${y - 50} 340 ${y + 20} 420 ${y - 20}" stroke="${c}" stroke-width="26" fill="none" opacity=".45" filter="url(#${id}-blur)" class="ab-wave ${d}"/>`;
      return {
        defs: snowDefs(id) + `<linearGradient id="${id}-night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#141a3e"/><stop offset=".6" stop-color="#2a3570"/><stop offset="1" stop-color="#4f5f9a"/></linearGradient>`,
        body: `<rect width="${W}" height="${H}" fill="url(#${id}-night)"/>
          ${scatter(1921, 40, (r, i) => `<circle cx="${(r() * W).toFixed(0)}" cy="${(r() * 150).toFixed(0)}" r="${(0.6 + r() * 1.4).toFixed(1)}" fill="#ffffff" class="ab-twinkle ${['', 'd2', 'd3'][i % 3]}"/>`)}
          ${band(70, '#6fffc8', '')}${band(96, '#ff9ad0', 'ab-late')}${band(54, '#7fc8ff', '')}
          ${mountains('#5f6fa8', '#3a4680')}
          <g><path d="M120 196 V96 l20 -30 l14 24 l16 -40 l30 -24 l30 24 l16 40 l14 -24 l20 30 V196z" fill="#cfe6f8" stroke="#5f86ad" stroke-width="2" stroke-linejoin="round"/>
            <path d="M140 196 V110 l14 -12 l16 -26 l30 -22 l30 22 l16 26 l14 12 V196z" fill="#a8cdea" opacity=".7"/><circle cx="200" cy="70" r="8" fill="#7fe0ff" class="ab-glow-soft"/></g>
          ${snowGround(id)}<ellipse cx="200" cy="282" rx="164" ry="46" fill="#dfeefa"/>
          ${crystal(46, 236, 1.1, '#9be8ff', '#e8fbff', -12)}${crystal(354, 238, 1.15, '#c8b8ff', '#f2ecff', 12)}${flakes(1922, 20)}`,
      };
    },
    boss(id) {
      const wing = s => `<g class="${s < 0 ? 'ab-sway-l' : 'ab-sway-r'}"><path d="M${200 + s * 40} 200 C${200 + s * 90} 120 ${200 + s * 150} 100 ${200 + s * 180} 120 C${200 + s * 160} 140 ${200 + s * 170} 170 ${200 + s * 150} 190 C${200 + s * 140} 170 ${200 + s * 120} 190 ${200 + s * 110} 214 C${200 + s * 96} 200 ${200 + s * 80} 214 ${200 + s * 60} 230Z" fill="url(#${id}-wing)" stroke="#3a4680" stroke-width="2.4" stroke-linejoin="round"/>
          <path d="M${200 + s * 40} 200 L${200 + s * 180} 120 M${200 + s * 60} 214 L${200 + s * 150} 190 M${200 + s * 52} 206 L${200 + s * 112} 214" stroke="#3a4680" stroke-width="2" opacity=".55"/></g>`;
      return {
        defs: `<radialGradient id="${id}-scale" cx="40%" cy="30%" r="75%"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#dcecfa"/><stop offset="1" stop-color="#9ebce0"/></radialGradient>
          <linearGradient id="${id}-wing" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9ff5d8"/><stop offset=".5" stop-color="#9fc8ff"/><stop offset="1" stop-color="#e0a8ff"/></linearGradient>
          <radialGradient id="${id}-gem" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#6fffc8"/><stop offset="1" stop-color="#2aa88a"/></radialGradient>`,
        body: `${shadowOf(id, 200, 300, 132, 16)}
          ${wing(-1)}${wing(1)}
          <g class="ab-body">
            <path d="M262 286 C306 290 330 262 316 236 C306 220 288 226 292 240" stroke="#3a4680" stroke-width="22" fill="none" stroke-linecap="round"/><path d="M262 286 C306 290 330 262 316 236 C306 220 288 226 292 240" stroke="url(#${id}-scale)" stroke-width="16" fill="none" stroke-linecap="round"/>
            <path d="M140 292 C130 236 156 196 200 194 C244 196 270 236 260 292 C240 302 160 302 140 292Z" fill="url(#${id}-scale)" stroke="#3a4680" stroke-width="3"/>
            <path d="M176 220 q24 -8 48 0 v64 q-24 8 -48 0z" fill="#eaf4ff" stroke="#9ebce0" stroke-width="1.6"/>
            <path d="M176 236 h48 M176 252 h48 M176 268 h48" stroke="#9ebce0" stroke-width="1.4"/>
            <circle cx="200" cy="214" r="10" fill="url(#${id}-gem)" stroke="#2a6a5a" stroke-width="1.6" class="ab-gem"/>
            <path d="M150 290 q-8 10 -2 16 h20 M250 290 q8 10 2 16 h-20" stroke="#3a4680" stroke-width="3" fill="#dcecfa"/>
          </g>
          <g class="ab-head">
            <path d="M172 132 q-20 -30 -10 -58 q6 24 24 40z M228 132 q20 -30 10 -58 q-6 24 -24 40z" fill="#cfe6f8" stroke="#3a4680" stroke-width="2" stroke-linejoin="round"/>
            <path d="M200 196 C160 196 148 170 150 150 C152 122 176 106 200 106 C224 106 248 122 250 150 C252 170 240 196 200 196Z" fill="url(#${id}-scale)" stroke="#3a4680" stroke-width="2.8"/>
            <path d="M176 176 q24 22 48 0 q-4 18 -24 20 q-20 -2 -24 -20z" fill="#eaf4ff" stroke="#3a4680" stroke-width="2"/>
            <circle cx="190" cy="184" r="2" fill="#3a4680"/><circle cx="210" cy="184" r="2" fill="#3a4680"/>
            <path d="M164 128 C170 116 184 110 198 108" stroke="#fff" stroke-width="5" fill="none" opacity=".7" stroke-linecap="round"/>
            ${eyes(200, 150, 22, 13, 15, { stern: true, lid: '#b8d4ee', glow: '#3fd8b0', ink: '#1f2a5a' })}
            <path d="M152 156 l-16 -6 l12 12z M248 156 l16 -6 l-12 12z" fill="#cfe6f8" stroke="#3a4680" stroke-width="1.6"/>
          </g>
          <g class="ab-breath ab-mech"><path d="M200 200 C190 230 170 250 150 262 C180 264 220 264 250 262 C230 250 210 230 200 200Z" fill="#dffaff" opacity=".7" filter="url(#${id}-soft)"/></g>`,
      };
    },
    scale: 0.84,
    css: `.ab-root .ab-gem{transition:filter .4s}.ab-root.ab-m-aurora .ab-gem{filter:drop-shadow(0 0 calc(var(--charge,1) * 3px) #6fffc8)}.ab-root.ab-m-breath .ab-breath{opacity:1}`,
    mark(root, kind, on, value) { if (kind === 'aurora') root.style.setProperty('--charge', String(value || 0)); },
  });
})();
