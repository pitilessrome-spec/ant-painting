/* ANT CANVAS · 关卡图案生成器（随机组合，每关一个随机种子） */
'use strict';
const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ---------- 颜色：22 个材质，每关色相整体轻微偏移 ---------- */
// [名字, 色相, 饱和度, 亮度]；饱和度为 0 的是中性色，不随关卡变色
const MATS = [
  ['OUT', 0, 0, 14], ['WHITE', 40, 20, 97], ['GRAY', 215, 8, 76], ['GRAYD', 215, 10, 52],
  ['SKYL', 195, 80, 90], ['SKY', 200, 72, 78], ['SKYD', 212, 62, 60], ['BLU', 225, 70, 50],
  ['GRN', 118, 50, 50], ['GRND', 128, 56, 32], ['GRNL', 86, 58, 68],
  ['YEL', 50, 96, 70], ['YELD', 42, 90, 54], ['ORG', 26, 92, 60], ['ORGD', 20, 85, 42],
  ['BRN', 24, 48, 40], ['BRND', 20, 46, 26], ['PNK', 344, 72, 76], ['PNKD', 340, 62, 58],
  ['RED', 355, 75, 58], ['REDD', 355, 70, 42], ['PUR', 275, 48, 60], ['PURD', 275, 48, 40]
];
const M = {}; MATS.forEach((m, i) => { M[m[0]] = i; });

function hsl(h, s, l) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = n => { const k = (n + h / 30) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
  return [f(0), f(8), f(4)].map(v => Math.round(v * 255));
}
const hex = rgb => '#' + rgb.map(v => v.toString(16).padStart(2, '0')).join('');
function palette(lv) {
  const R = rng(lv * 31 + 5), j = (R() * 2 - 1) * 14, dl = (R() * 2 - 1) * 4;
  return MATS.map(m => {
    const sat = m[2], lig = clamp(m[3] + (sat > 0 ? dl : 0), 0, 100);
    const h = (m[1] + (sat > 0 ? j : 0) + 360) % 360;
    return hex(hsl(h, sat, lig));
  });
}

/* ---------- 随机与噪声 ---------- */
function mix32(z) {
  z = (z ^ (z >>> 16)) >>> 0; z = Math.imul(z, 0x7feb352d) >>> 0;
  z = (z ^ (z >>> 15)) >>> 0; z = Math.imul(z, 0x846ca68b) >>> 0;
  return (z ^ (z >>> 16)) >>> 0;
}
function rng(seed) {
  let s = mix32((seed | 0) ^ 0x9e3779b9) || 1;
  const next = () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  for (let i = 0; i < 8; i++) next();
  return next;
}
function hf(x, y, s) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1274126177)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function vn(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const a = hf(xi, yi, s), b = hf(xi + 1, yi, s), c = hf(xi, yi + 1, s), d = hf(xi + 1, yi + 1, s);
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, s) { return vn(x, y, s) * 0.55 + vn(x * 2.03, y * 2.03, s + 7) * 0.3 + vn(x * 4.1, y * 4.1, s + 13) * 0.15; }

/* ---------- 形状：f(u,v,x,y) -> -1 外面 / 0 底色 / 1 暗面 / 2 高光 ---------- */
// 明暗统一规则：s 在 [-1,1]，越靠右下越暗；过渡带打格子，颜色更柔和
function tone(s, x, y) {
  if (s > 0.06 && s <= 0.15 && ((x + y) & 1)) return 1;
  return s > 0.15 ? 1 : 0;
}
function ell(cx, cy, rx, ry, ang) {
  const c = Math.cos(ang || 0), sn = Math.sin(ang || 0);
  return (u, v, x, y) => {
    const dx = u - cx, dy = v - cy;
    const X = (dx * c + dy * sn) / rx, Y = (-dx * sn + dy * c) / ry;
    if (X * X + Y * Y > 1) return -1;
    if ((X + 0.45) * (X + 0.45) + (Y + 0.45) * (Y + 0.45) < 0.06) return 2;
    return tone((X + Y) / 2, x, y);
  };
}
function rr(x0, y0, x1, y1, r) {
  r = Math.min(r || 0.01, (x1 - x0) / 2, (y1 - y0) / 2);
  return (u, v, x, y) => {
    if (u < x0 || u > x1 || v < y0 || v > y1) return -1;
    const cx = clamp(u, x0 + r, x1 - r), cy = clamp(v, y0 + r, y1 - r);
    if ((u - cx) * (u - cx) + (v - cy) * (v - cy) > r * r) return -1;
    return tone((u - x0) / (x1 - x0) + (v - y0) / (y1 - y0) - 1, x, y);
  };
}
// 圆环的一段：从角度 a1 转到 a2（屏幕坐标，y 向下）
function arc(cx, cy, r1, r2, a1, a2) {
  return (u, v, x, y) => {
    const dx = u - cx, dy = v - cy, d = Math.hypot(dx, dy);
    if (d < r1 || d > r2) return -1;
    let t = Math.atan2(dy, dx) - a1;
    while (t < 0) t += TAU;
    while (t >= TAU) t -= TAU;
    if (t > a2 - a1) return -1;
    return tone((d - r1) / (r2 - r1) * 2 - 1, x, y);
  };
}
function inPoly(u, v, p) {
  let c = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const xi = p[i][0], yi = p[i][1], xj = p[j][0], yj = p[j][1];
    if ((yi > v) !== (yj > v) && u < (xj - xi) * (v - yi) / (yj - yi) + xi) c = !c;
  }
  return c;
}
function poly(p) {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const q of p) { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); }
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, hw = (x1 - x0) / 2 + 1e-6, hh = (y1 - y0) / 2 + 1e-6;
  return (u, v, x, y) => {
    if (u < x0 || u > x1 || v < y0 || v > y1 || !inPoly(u, v, p)) return -1;
    return tone(clamp(((u - cx) / hw + (v - cy) / hh) / 2, -1, 1), x, y);
  };
}
function heart(cx, cy, sz) {
  return (u, v, x, y) => {
    const X = (u - cx) / sz, Y = (cy - v) / sz + 0.05;
    const a = X * X + Y * Y - 1;
    if (a * a * a - X * X * Y * Y * Y > 0) return -1;
    if ((X + 0.5) * (X + 0.5) + (Y - 0.5) * (Y - 0.5) < 0.02) return 2;
    return tone(clamp(X * 0.5 - Y * 0.5, -1, 1), x, y);
  };
}
function starPts(cx, cy, R1, R2, k, rot) {
  const p = [];
  for (let i = 0; i < 2 * k; i++) {
    const r = i % 2 ? R2 : R1, a = rot + i * Math.PI / k;
    p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return p;
}
function hull(...fs) { return (u, v, x, y) => { for (const f of fs) { const t = f(u, v, x, y); if (t >= 0) return t; } return -1; }; }
function cloudShape(cx, cy, w) { return hull(ell(cx, cy, w, w * 0.5), ell(cx - w * 0.8, cy + w * 0.2, w * 0.6, w * 0.42), ell(cx + w * 0.8, cy + w * 0.2, w * 0.6, w * 0.42)); }

/* ---------- 画布：先画背景，再一层层画物体，最后描黑边 ---------- */
class Cv {
  constructor(n) { this.n = n; this.role = new Uint8Array(n * n); this.obj = new Uint16Array(n * n); this.nid = 1; }
  bg(f) { const n = this.n; for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) this.role[y * n + x] = f(x, y, (x + 0.5) / n, (y + 0.5) / n); }
  paint(f, mats, id) {
    const n = this.n;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const t = f((x + 0.5) / n, (y + 0.5) / n, x, y);
      if (t >= 0) { const i = y * n + x; this.role[i] = mats[t]; this.obj[i] = id; }
    }
  }
  add(f, m) { this.paint(f, m, this.nid++); }
  // 物体的边缘挨着后面的东西，就描成黑边
  outline() {
    const n = this.n, o = this.obj, mark = [];
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const i = y * n + x, id = o[i];
      if (!id) continue;
      if ((x > 0 && o[i - 1] < id) || (x < n - 1 && o[i + 1] < id) || (y > 0 && o[i - n] < id) || (y < n - 1 && o[i + n] < id)) mark.push(i);
    }
    for (const i of mark) this.role[i] = M.OUT;
  }
}

/* ---------- 颜色家族：每个家族是 [底色, 暗面, 高光] ---------- */
const FAM = {
  red: [M.RED, M.REDD, M.PNK], pink: [M.PNK, M.PNKD, M.WHITE], orange: [M.ORG, M.ORGD, M.YEL], yellow: [M.YEL, M.YELD, M.WHITE],
  green: [M.GRN, M.GRND, M.GRNL], lime: [M.GRNL, M.GRN, M.YEL], sky: [M.SKY, M.SKYD, M.SKYL], blue: [M.BLU, M.SKYD, M.SKYL],
  purple: [M.PUR, M.PURD, M.PNK], brown: [M.BRN, M.BRND, M.ORG], gray: [M.GRAY, M.GRAYD, M.WHITE], white: [M.WHITE, M.GRAY, M.WHITE]
};
const OBJ_FAMS = ['red', 'pink', 'orange', 'yellow', 'green', 'lime', 'sky', 'blue', 'purple', 'brown', 'white', 'gray'];
const BG_FAMS = ['sky', 'blue', 'green', 'lime', 'pink', 'purple', 'yellow', 'orange', 'gray', 'brown'];
const famOf = (R, list) => FAM[list[Math.floor(R() * list.length)]];

/* ---------- 背景：八种，每种都有随机的颜色和花纹 ---------- */
function bgBands(C, R) {
  const f = famOf(R, BG_FAMS), e1 = 0.25 + R() * 0.25, e2 = e1 + 0.2 + R() * 0.3;
  C.bg((x, y, u, v) => {
    if (Math.abs(v - e1) < 0.035) return ((x + y) & 1) ? f[2] : f[0];
    if (Math.abs(v - e2) < 0.035) return ((x + y) & 1) ? f[0] : f[1];
    return v < e1 ? f[2] : v < e2 ? f[0] : f[1];
  });
}
function bgRadial(C, R) {
  const f = famOf(R, BG_FAMS), cx = R(), cy = R() * 0.7, k = 3 + Math.floor(R() * 5);
  C.bg((x, y, u, v) => {
    const d = Math.hypot(u - cx, v - cy) * k, band = Math.floor(d), frac = d - band;
    const even = band % 2 === 0;
    if (frac > 0.9 && ((x + y) & 1)) return even ? f[0] : f[2];
    return even ? f[2] : f[0];
  });
}
function bgFoliage(C, R) {
  const f = famOf(R, ['green', 'lime', 'blue', 'sky']), s = R() * 999;
  C.bg((x, y, u, v) => {
    const q = fbm(u * (3 + R() * 3), v * (3 + R() * 3), s);
    return q < 0.42 ? f[1] : q < 0.56 ? f[0] : q < 0.7 ? f[2] : q < 0.8 ? f[0] : f[1];
  });
}
function bgPolka(C, R) {
  const f = famOf(R, BG_FAMS), dot = R() < 0.5 ? M.WHITE : f[0], sp = 4 + Math.floor(R() * 4), ox = Math.floor(R() * sp), oy = Math.floor(R() * sp);
  C.bg((x, y) => ((x + ox) % sp === 0 && (y + oy) % sp === 0) ? dot : f[2]);
}
function bgStripes(C, R) {
  const f = famOf(R, BG_FAMS), w = 2 + Math.floor(R() * 4), diag = R() < 0.5;
  C.bg((x, y) => (Math.floor((diag ? x + y : x) / w) & 1) ? f[2] : f[0]);
}
function bgWaves(C, R) {
  const f = famOf(R, ['blue', 'sky']), h = 0.4 + R() * 0.3;
  C.bg((x, y, u, v) => {
    if (v < h) return f[2];
    const band = Math.floor((v - h) * 14);
    if (Math.sin(u * 22 + band * 1.7) > 0.6) return M.WHITE;
    return (band & 1) ? f[0] : f[1];
  });
}
function bgNight(C, R) {
  const s = R() * 999, hz = 0.4 + R() * 0.2;
  C.bg((x, y, u, v) => {
    if (hf(x, y, s) > 0.985) return M.WHITE;
    if (hf(x, y, s + 7) > 0.997) return M.YEL;
    return v < hz ? M.BLU : M.SKYD;
  });
}
function bgMeadow(C, R) {
  const f = famOf(R, ['green', 'lime']), s = R() * 999;
  C.bg((x, y) => {
    const q = hf(x, y, s);
    if (q > 0.96) return M.PNK;
    if (q > 0.92) return M.YEL;
    return (Math.floor(y / 2) & 1) ? f[0] : f[1];
  });
}
const BGS = [bgBands, bgRadial, bgFoliage, bgPolka, bgStripes, bgWaves, bgNight, bgMeadow];

/* ---------- 物体：十四种，每一种位置、大小、颜色、脸、装饰都随机 ---------- */
function kBlob(C, R, sc) {
  const cx = 0.3 + R() * 0.4, cy = 0.36 + R() * 0.3, w = (0.14 + R() * 0.07) * sc * 1.6, h = w * (0.85 + R() * 0.35);
  const f = famOf(R, OBJ_FAMS);
  if (R() < 0.4) for (const s of [-1, 1]) C.add(poly([[cx + s * w * 0.5, cy - h * 0.5], [cx + s * w * 0.95, cy - h * 1.2], [cx + s * w * 0.2, cy - h * 0.9]]), f);
  C.add(ell(cx, cy, w, h), f);
  if (R() < 0.4) C.add(ell(cx, cy + h * 0.35, w * 0.5, h * 0.35), FAM.white);
  const ex = w * 0.42, ey = cy - h * 0.12;
  const big = R() < 0.5;
  for (const s of [-1, 1]) {
    if (big) {
      C.add(ell(cx + s * ex, ey, w * 0.16, w * 0.2), FAM.white);
      C.add(ell(cx + s * ex, ey + w * 0.03, w * 0.08, w * 0.1), [M.OUT, M.OUT, M.OUT]);
    } else C.add(ell(cx + s * ex, ey, w * 0.12, w * 0.15), [M.OUT, M.OUT, M.WHITE]);
  }
  if (R() < 0.7) for (const s of [-1, 1]) C.add(ell(cx + s * w * 0.62, cy + h * 0.2, w * 0.14, w * 0.08), FAM.pink);
  if (R() < 0.5) C.add(arc(cx, cy + h * 0.1, w * 0.12, w * 0.18, 0.15 * Math.PI, 0.85 * Math.PI), [M.OUT, M.OUT, M.OUT]);
  else C.add(ell(cx, cy + h * 0.22, w * 0.07, w * 0.09), [M.OUT, M.OUT, M.OUT]);
}
function kTree(C, R, sc) {
  const cx = 0.2 + R() * 0.6, base = 0.6 + R() * 0.3, th = (0.35 + R() * 0.3) * sc, tw = 0.03 * sc + 0.02;
  C.add(rr(cx - tw, base - th, cx + tw, base, tw * 0.5), FAM.brown);
  const f = famOf(R, ['green', 'lime', 'orange', 'pink', 'blue']), cy = base - th - 0.05 * sc, cr = (0.12 + R() * 0.1) * sc;
  const n = 2 + Math.floor(R() * 3);
  for (let i = 0; i < n; i++) C.add(ell(cx + (R() - 0.5) * cr * 2, cy + (R() - 0.5) * cr, cr * (0.8 + R() * 0.4), cr * (0.8 + R() * 0.4)), f);
}
function kFlower(C, R, sc) {
  const cx = 0.2 + R() * 0.6, cy = 0.25 + R() * 0.3, r = (0.09 + R() * 0.06) * sc, base = 0.92;
  C.add(rr(cx - 0.012 * sc - 0.005, cy, cx + 0.012 * sc + 0.005, base, 0.01), FAM.green);
  if (R() < 0.8) C.add(ell(cx - r * 0.9, cy + (base - cy) * 0.5, r * 0.7, r * 0.25, -0.5), FAM.lime);
  const pf = famOf(R, ['pink', 'red', 'yellow', 'purple', 'orange', 'white', 'sky']);
  const n = 5 + Math.floor(R() * 3), a0 = R() * TAU;
  for (let i = 0; i < n; i++) { const a = a0 + i * TAU / n; C.add(ell(cx + Math.cos(a) * r * 0.55, cy + Math.sin(a) * r * 0.55, r * 0.5, r * 0.5), pf); }
  C.add(ell(cx, cy, r * 0.3, r * 0.3), R() < 0.5 ? FAM.yellow : FAM.orange);
}
function kMush(C, R, sc) {
  const x = 0.2 + R() * 0.6, base = 0.5 + R() * 0.4, w = (0.1 + R() * 0.06) * sc * 1.3, h = w * 0.9;
  C.add(rr(x - w * 0.3, base - h * 0.9, x + w * 0.3, base, w * 0.15), FAM.white);
  const cf = famOf(R, ['red', 'orange', 'purple', 'pink', 'blue', 'yellow']);
  const dome = ell(x, base - h * 0.8, w, h * 0.9);
  C.add((u, v, xx, yy) => v <= base - h * 0.8 ? dome(u, v, xx, yy) : -1, cf);
  const n = 2 + Math.floor(R() * 3);
  for (let i = 0; i < n; i++) C.add(ell(x + (R() - 0.5) * w * 1.4, base - h * (0.9 + R() * 0.5), w * 0.15, w * 0.12), FAM.white);
}
function kHouse(C, R, sc) {
  const cx = 0.3 + R() * 0.4, w = (0.12 + R() * 0.07) * sc * 1.3, top = 0.38 + R() * 0.12, base = 0.84 - R() * 0.06;
  C.add(rr(cx - w, top + 0.12 * sc, cx + w, base, 0.01), famOf(R, ['white', 'yellow', 'pink', 'sky', 'orange', 'gray']));
  C.add(poly([[cx - w * 1.25, top + 0.14 * sc], [cx + w * 1.25, top + 0.14 * sc], [cx, top - 0.1 * sc]]), famOf(R, ['red', 'blue', 'brown', 'purple', 'orange']));
  C.add(rr(cx - w * 0.25, base - 0.2 * sc, cx + w * 0.25, base, 0.01), famOf(R, ['brown', 'blue', 'red']));
  for (const s of [-1, 1]) C.add(rr(cx + s * w * 0.45 - w * 0.2, top + 0.22 * sc, cx + s * w * 0.45 + w * 0.2, top + 0.34 * sc, 0.01), FAM.sky);
}
function kHeart(C, R, sc) {
  C.add(heart(0.3 + R() * 0.4, 0.35 + R() * 0.3, (0.13 + R() * 0.07) * sc), famOf(R, ['red', 'pink', 'purple', 'orange']));
}
function kStar(C, R, sc) {
  const r1 = (0.12 + R() * 0.08) * sc, r2 = r1 * (0.4 + R() * 0.2);
  C.add(poly(starPts(0.2 + R() * 0.6, 0.2 + R() * 0.5, r1, r2, 5 + Math.floor(R() * 2), -Math.PI / 2 + R() * 0.3)), famOf(R, ['yellow', 'orange', 'pink', 'sky']));
}
function kSun(C, R, sc) {
  const cx = 0.2 + R() * 0.6, cy = 0.15 + R() * 0.2, r = (0.07 + R() * 0.04) * sc;
  if (R() < 0.7) C.add(poly(starPts(cx, cy, r * 1.9, r * 1.3, 12, R() * TAU)), FAM.yellow);
  C.add(ell(cx, cy, r, r), FAM.orange);
}
function kCloud(C, R, sc) {
  C.add(cloudShape(0.2 + R() * 0.6, 0.12 + R() * 0.25, (0.08 + R() * 0.06) * sc * 1.4), [M.WHITE, M.SKYL, M.WHITE]);
}
function kFish(C, R, sc) {
  const cx = 0.35 + R() * 0.3, cy = 0.3 + R() * 0.4, w = (0.18 + R() * 0.08) * sc * 1.3, h = w * 0.6;
  const f = famOf(R, ['orange', 'blue', 'yellow', 'pink', 'purple', 'lime']);
  C.add(poly([[cx + w * 0.8, cy], [cx + w * 1.5, cy - h * 0.7], [cx + w * 1.5, cy + h * 0.7]]), f);
  C.add(ell(cx, cy, w, h), f);
  C.add(poly([[cx - w * 0.3, cy - h * 0.9], [cx + w * 0.3, cy - h * 0.9], [cx, cy - h * 0.3]]), f);
  C.add(ell(cx - w * 0.5, cy - h * 0.1, w * 0.13, w * 0.13), FAM.white);
  C.add(ell(cx - w * 0.5, cy - h * 0.1, w * 0.06, w * 0.06), [M.OUT, M.OUT, M.WHITE]);
}
function kBoat(C, R, sc) {
  const cx = 0.4 + R() * 0.2, cy = 0.6 + R() * 0.15, w = (0.2 + R() * 0.1) * sc * 1.2;
  C.add(poly([[cx - w, cy], [cx + w, cy], [cx + w * 0.7, cy + 0.07 * sc], [cx - w * 0.7, cy + 0.07 * sc]]), famOf(R, ['red', 'brown', 'blue']));
  C.add(rr(cx - 0.012, cy - 0.45 * sc, cx + 0.012, cy, 0.005), FAM.brown);
  const sail = famOf(R, ['white', 'pink', 'yellow']);
  C.add(poly([[cx - 0.01, cy - 0.42 * sc], [cx - 0.01, cy - 0.05 * sc], [cx - w * 0.8, cy - 0.05 * sc]]), sail);
  C.add(poly([[cx + 0.01, cy - 0.32 * sc], [cx + 0.01, cy - 0.05 * sc], [cx + w * 0.7, cy - 0.05 * sc]]), FAM.red);
  C.add(poly([[cx, cy - 0.48 * sc], [cx, cy - 0.42 * sc], [cx + 0.07 * sc, cy - 0.45 * sc]]), FAM.red);
}
function kGem(C, R, sc) {
  const cx = 0.3 + R() * 0.4, cy = 0.35 + R() * 0.3, s = (0.14 + R() * 0.06) * sc * 1.3;
  const f = famOf(R, ['blue', 'purple', 'pink', 'green', 'sky']);
  C.add(poly([[cx - s, cy - s * 0.4], [cx - s * 0.5, cy - s], [cx + s * 0.5, cy - s], [cx + s, cy - s * 0.4], [cx, cy + s]]), f);
  C.add(poly([[cx - s * 0.5, cy - s], [cx + s * 0.5, cy - s], [cx, cy - s * 0.4]]), FAM.white);
}
function kRainbow(C, R, sc) {
  const cx = 0.5, cy = 0.98, R0 = (0.36 + R() * 0.12) * sc, bw = R0 / 6;
  const cols = ['red', 'orange', 'yellow', 'green', 'sky', 'purple'], id = C.nid++;
  cols.forEach((c, k) => C.paint(arc(cx, cy, R0 - (k + 1) * bw, R0 - k * bw, Math.PI, 2 * Math.PI), FAM[c], id));
  if (R() < 0.8) { C.add(cloudShape(0.12, 0.85, 0.08), FAM.white); C.add(cloudShape(0.88, 0.85, 0.08), FAM.white); }
}
function kButterfly(C, R, sc) {
  const cx = 0.3 + R() * 0.4, cy = 0.3 + R() * 0.35, w = (0.16 + R() * 0.08) * sc * 1.4, h = w * 0.8;
  const f1 = famOf(R, OBJ_FAMS), f2 = famOf(R, OBJ_FAMS);
  C.add(ell(cx - w * 0.55, cy - h * 0.35, w * 0.5, h * 0.55, -0.4), f1);
  C.add(ell(cx + w * 0.55, cy - h * 0.35, w * 0.5, h * 0.55, 0.4), f1);
  C.add(ell(cx - w * 0.45, cy + h * 0.45, w * 0.35, h * 0.35, 0.4), f2);
  C.add(ell(cx + w * 0.45, cy + h * 0.45, w * 0.35, h * 0.35, -0.4), f2);
  C.add(ell(cx - w * 0.55, cy - h * 0.35, w * 0.14, w * 0.14), FAM.white);
  C.add(ell(cx + w * 0.55, cy - h * 0.35, w * 0.14, w * 0.14), FAM.white);
  C.add(rr(cx - w * 0.07, cy - h * 0.6, cx + w * 0.07, cy + h * 0.7, w * 0.05), [M.OUT, M.OUT, M.GRAY]);
  C.add(ell(cx - w * 0.2, cy - h * 0.8, w * 0.3, 0.012, -0.5), [M.OUT, M.OUT, M.OUT]);
  C.add(ell(cx + w * 0.2, cy - h * 0.8, w * 0.3, 0.012, 0.5), [M.OUT, M.OUT, M.OUT]);
}
const KINDS = [kBlob, kTree, kFlower, kMush, kHouse, kHeart, kStar, kSun, kCloud, kFish, kBoat, kGem, kRainbow, kButterfly];

// 天上的云朵（只画在背景上）
function clouds(C, R) {
  const k = 1 + Math.floor(R() * 2);
  for (let s = 0; s < k; s++) {
    const f = cloudShape(0.15 + R() * 0.7, 0.1 + R() * 0.25, 0.07 + R() * 0.05), n = C.n;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const i = y * n + x;
      if (C.obj[i] !== 0) continue;
      const t = f((x + 0.5) / n, (y + 0.5) / n, x, y);
      if (t >= 0) C.role[i] = t === 1 ? M.SKYL : M.WHITE;
    }
  }
}
// 背景上撒小星星（只画在没有物体的地方）
function sparkles(C, R) {
  const k = 3 + Math.floor(R() * 5), n = C.n;
  for (let s = 0; s < k; s++) {
    const cx = R(), cy = R() * 0.7, r = 0.02 + R() * 0.02;
    const a = ell(cx, cy, r, r * 0.3), b = ell(cx, cy, r * 0.3, r);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const i = y * n + x, u = (x + 0.5) / n, v = (y + 0.5) / n;
      if (C.obj[i] === 0 && (a(u, v, x, y) >= 0 || b(u, v, x, y) >= 0)) C.role[i] = R() < 0.5 ? M.WHITE : M.YEL;
    }
  }
}

function coverage(C) { let c = 0; for (let i = 0; i < C.obj.length; i++) if (C.obj[i]) c++; return c / C.obj.length; }

/* ---------- 图案：每个关卡号对应一套随机组合，不会重复 ---------- */
function gridN(lv) { return Math.min(56, 40 + Math.floor(lv / 25)); }
function buildPicture(lv) {
  const R = rng(mix32(lv * 7919 + 101)), n = gridN(lv), C = new Cv(n);
  const bi = Math.floor(R() * BGS.length);
  BGS[bi](C, R);
  if (R() < 0.35) {
    const f = famOf(R, ['green', 'lime', 'brown', 'yellow']), g = 0.8 + R() * 0.1;
    C.paint((u, v, x, y) => v > g ? (v < g + 0.02 ? 2 : (((x + y) & 1) && v < g + 0.05 ? 0 : 1)) : -1, f, 0);
  }
  const nObj = 2 + Math.floor(R() * 3);
  for (let i = 0; i < nObj; i++) KINDS[Math.floor(R() * KINDS.length)](C, R, i === 0 ? 1.0 + R() * 0.6 : 0.6 + R() * 0.5);
  // 物体盖住的面积太少（画面太空），就再补一个大一点的物体
  for (let t = 0; t < 3 && coverage(C) < 0.25; t++) KINDS[Math.floor(R() * KINDS.length)](C, R, 1.2 + R() * 0.5);
  if (R() < 0.6) clouds(C, R);
  sparkles(C, R);
  C.outline();
  return { n, role: C.role, subj: bi };
}
