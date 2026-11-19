// DOMINION painted backdrops, ported from the redesigned mockups' painters (plans/evil-mode-rework/mockups-redesign,
// index.html script): the night skyline (title card) and the leaking warehouse (HQ Lv. 1). Each picture is painted once
// to an offscreen canvas and handed out as a data URL, because the redux layer replaces its HTML on every redraw.
// The painters use their own fixed little generator, never gameplay RNG, so a scene looks the same on every load.

function rng(seed: number): () => number {
  let a = seed >>> 0 || 1;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PAL = {
  night: { sky: ['#1a0f3a', '#3b1c66', '#5a2a7a'], far: '#2a1852', mid: '#1c1040', near: '#0e0822', win: ['#ffd36b', '#ff7ab8', '#9fe3ff', '#ffe9a8'], lit: 0.32 },
};

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] | null {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  return g ? [c, g] : null;
}

function skyline(seed: number, tall: number): string {
  const out = canvas(960, 540), half = canvas(480, 270);
  if (!out || !half) return '';
  const [c, x] = out, [b, g] = half;
  const W = 480, H = 270, R = rng(seed), p = PAL.night;
  const gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, p.sky[0]!); gr.addColorStop(0.6, p.sky[1]!); gr.addColorStop(1, p.sky[2]!);
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  const base = H;
  ([[p.far, 0.55, 0.35, 10, 26], [p.mid, 0.42, 0.6, 14, 34], [p.near, 0.28, 0.9, 18, 46]] as const).forEach((L) => {
    let X = -10;
    while (X < W + 10) {
      const bw = L[3] + R() * L[4], bh = H * L[1] * (0.35 + R() * 0.9) * tall, top = base - bh;
      g.fillStyle = L[0]; g.fillRect(X | 0, top | 0, bw | 0, bh | 0);
      if (R() < 0.35) g.fillRect((X + bw / 2 - 1) | 0, (top - 8 - R() * 10) | 0, 2, 14);
      if (R() < 0.25) g.fillRect((X + 3) | 0, (top - 4) | 0, (bw - 6) | 0, 4);
      for (let wy = top + 4; wy < base - 3; wy += 5) for (let wx = X + 3; wx < X + bw - 3; wx += 4) {
        if (R() < p.lit * L[2]) { g.fillStyle = p.win[(R() * p.win.length) | 0]!; g.globalAlpha = 0.55 + R() * 0.45; g.fillRect(wx | 0, wy | 0, 2, 2); g.globalAlpha = 1; }
      }
      X += bw + (R() < 0.3 ? R() * 6 : 0);
    }
  });
  x.imageSmoothingEnabled = false;
  x.drawImage(b, 0, 0, c.width, c.height);
  return c.toDataURL();
}

function warehouse(morning: boolean): string {
  const out = canvas(960, 540), half = canvas(480, 270);
  if (!out || !half) return '';
  const [c, x] = out, [, g] = half;
  const W = 480, H = 270, R = rng(11), MO = morning;
  const rect = (cx: number, cy: number, w: number, h: number, col: string): void => { g.fillStyle = col; g.fillRect(cx | 0, cy | 0, w | 0, h | 0); };
  for (let i = 0; i < W; i += 3) rect(i, 0, 3, 170, (i / 3) % 2 ? '#2b2724' : '#332e2a');
  for (let k = 0; k < 260; k++) rect(R() * W, 20 + R() * 150, 1 + R() * 2, 1 + R() * 3, R() < 0.5 ? '#3d3027' : '#231f1c');
  rect(0, 60, W, 2, '#1d1a18'); rect(0, 118, W, 2, '#1d1a18');
  let gr = g.createLinearGradient(0, 0, 0, 58); gr.addColorStop(0, '#14110f'); gr.addColorStop(1, '#221e1b'); g.fillStyle = gr; g.fillRect(0, 0, W, 58);
  rect(150, 6, 190, 34, MO ? '#3a2a2a' : '#0b0f22');
  for (let s = 0; s < 6; s++) rect(152 + s * 31, 8, 28, 30, MO ? (R() < 0.5 ? '#f2b27a' : '#f7cf94') : (R() < 0.5 ? '#1b2a52' : '#26386a'));
  if (!MO) { rect(183, 8, 28, 30, '#0a0d1c'); rect(276, 8, 28, 30, '#0a0d1c'); for (let t = 0; t < 40; t++) rect(154 + R() * 180, 8 + R() * 28, 1, 3, 'rgba(170,200,255,.6)'); }
  for (let tx = 0; tx < W; tx += 60) { g.strokeStyle = '#120f0d'; g.lineWidth = 4; g.beginPath(); g.moveTo(tx, 0); g.lineTo(tx + 30, 58); g.lineTo(tx + 60, 0); g.stroke(); }
  rect(0, 54, W, 6, '#16120f');
  rect(18, 72, 138, 112, '#0d1428');
  gr = g.createLinearGradient(0, 72, 0, 184); gr.addColorStop(0, MO ? '#f6a46a' : '#141f3e'); gr.addColorStop(1, MO ? '#ffe0a8' : '#1d2d40'); g.fillStyle = gr; g.fillRect(20, 96, 134, 88);
  for (let f = 20; f < 154; f += 6) rect(f, 138, 1, 32, '#0b0f1c');
  rect(20, 138, 134, 2, '#0b0f1c'); rect(20, 150, 134, 1, '#0b0f1c');
  const bc = MO ? '#c27a5a' : '#16243a'; rect(30, 104, 40, 30, bc); rect(80, 110, 30, 24, bc); rect(118, 100, 30, 34, bc);
  rect(96, 100, 2, 40, '#0a0d18'); rect(90, 104, 14, 1, '#0a0d18');
  if (!MO) for (let rr = 0; rr < 120; rr++) rect(20 + R() * 132, 96 + R() * 80, 1, 4, 'rgba(160,190,255,.35)');
  for (let sl = 72; sl < 96; sl += 3) { rect(18, sl, 138, 2, '#4a4440'); rect(18, sl + 2, 138, 1, '#2c2825'); }
  rect(14, 70, 4, 116, '#1a1715'); rect(156, 70, 4, 116, '#1a1715');
  gr = g.createLinearGradient(0, 170, 0, H); gr.addColorStop(0, '#2a2826'); gr.addColorStop(1, '#1c1b1a'); g.fillStyle = gr; g.fillRect(0, 170, W, H - 170);
  for (let q = 0; q < 160; q++) rect(R() * W, 172 + R() * 98, 2 + R() * 5, 1, 'rgba(0,0,0,.25)');
  [[200, 232, 60, 8], [300, 250, 46, 6], [120, 214, 40, 6], [385, 226, 30, 5]].forEach((p) => { g.fillStyle = 'rgba(70,95,140,.55)'; g.beginPath(); g.ellipse(p[0]!, p[1]!, p[2]! / 2, p[3]! / 2, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,220,150,.25)'; g.fillRect(p[0]! - 4, p[1]! - 1, 8, 2); });
  rect(170, 220, 120, 24, '#2d2b32'); for (let ru = 172; ru < 288; ru += 4) rect(ru, 222, 2, 20, '#35333b');
  rect(318, 90, 62, 44, '#4a3524'); rect(320, 92, 58, 40, '#8a6a45');
  [[324, 96], [336, 94], [350, 98], [364, 95], [330, 112], [346, 114], [360, 112]].forEach((p) => { rect(p[0]!, p[1]!, 10, 13, '#e8e1cf'); rect(p[0]! + 4, p[1]!, 2, 2, '#d23a3a'); rect(p[0]! + 2, p[1]! + 4, 6, 1, '#9a9488'); rect(p[0]! + 2, p[1]! + 7, 5, 1, '#9a9488'); });
  rect(392, 92, 30, 38, '#3a1f22'); rect(394, 94, 26, 34, '#5a2b30'); g.fillStyle = '#c94a52'; g.fillRect(398, 100, 4, 22); g.fillRect(412, 100, 4, 22); g.fillRect(402, 104, 10, 4);
  rect(430, 70, 46, 104, '#2a2420');
  for (let sh = 80; sh < 170; sh += 22) { rect(430, sh + 16, 46, 3, '#4a4038'); rect(434, sh, 12, 16, '#6b5134'); rect(450, sh + 4, 10, 12, '#5a4430'); rect(462, sh + 2, 10, 14, '#6b5134'); }
  rect(286, 150, 70, 6, '#5a4030'); rect(290, 156, 4, 30, '#3a2a20'); rect(348, 156, 4, 30, '#3a2a20'); rect(326, 156, 24, 20, '#4a3528'); rect(300, 140, 16, 10, '#20262e'); rect(302, 142, 12, 6, '#5f86b8');
  rect(338, 132, 3, 18, '#222'); rect(334, 128, 10, 5, '#2b2b2b');
  g.fillStyle = 'rgba(255,214,140,.35)'; g.beginPath(); g.moveTo(334, 133); g.lineTo(344, 133); g.lineTo(356, 150); g.lineTo(322, 150); g.fill();
  rect(362, 150, 14, 3, '#2b2b33'); rect(370, 132, 4, 20, '#2b2b33'); rect(362, 153, 2, 20, '#2b2b33'); rect(374, 153, 2, 20, '#2b2b33');
  rect(380, 186, 80, 10, '#3a4a5c'); rect(382, 182, 74, 6, '#5a6f86'); rect(384, 180, 22, 5, '#c9c2b0'); rect(382, 196, 3, 14, '#1e2329'); rect(454, 196, 3, 14, '#1e2329');
  const crate = (cx: number, cy: number, w: number, h: number): void => {
    rect(cx, cy, w, h, '#6b4d30'); rect(cx + 1, cy + 1, w - 2, h - 2, '#8a6540');
    g.strokeStyle = '#5a3f26'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx + 2, cy + 2); g.lineTo(cx + w - 2, cy + h - 2); g.moveTo(cx + w - 2, cy + 2); g.lineTo(cx + 2, cy + h - 2); g.stroke();
    rect(cx, cy, w, 2, '#a07a50'); g.strokeStyle = '#3e2b1a'; g.lineWidth = 1; g.strokeRect(cx + 0.5, cy + 0.5, w - 1, h - 1);
  };
  crate(0, 184, 44, 40); crate(0, 224, 52, 46); crate(40, 200, 34, 30); crate(190, 150, 28, 24); crate(208, 162, 24, 20); crate(420, 214, 40, 36); crate(440, 192, 30, 24);
  rect(70, 226, 26, 34, '#2f3a46'); rect(70, 232, 26, 2, '#1e252e'); rect(70, 252, 26, 2, '#1e252e'); rect(72, 226, 22, 3, '#3d4a58');
  rect(98, 214, 52, 5, '#6b4d30'); rect(102, 219, 3, 30, '#4a3420'); rect(144, 219, 3, 30, '#4a3420');
  rect(238, 236, 16, 14, '#7c8796'); rect(236, 234, 20, 3, '#9aa6b6'); rect(240, 240, 12, 2, '#5a6574');
  g.fillStyle = 'rgba(120,160,220,.5)'; g.beginPath(); g.ellipse(246, 252, 14, 3, 0, 0, 7); g.fill();
  rect(239, 52, 2, 40, '#111'); rect(232, 90, 16, 6, '#2b2b2b'); rect(237, 96, 6, 4, '#ffe2a0');
  const lg = g.createRadialGradient(240, 100, 2, 240, 140, 150); lg.addColorStop(0, 'rgba(255,220,150,.55)'); lg.addColorStop(0.5, 'rgba(255,200,120,.12)'); lg.addColorStop(1, 'rgba(255,200,120,0)'); g.fillStyle = lg; g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(255,215,140,.07)'; g.beginPath(); g.moveTo(232, 98); g.lineTo(248, 98); g.lineTo(330, 250); g.lineTo(150, 250); g.fill();
  x.imageSmoothingEnabled = false;
  x.drawImage(half[0], 0, 0, 960, 540);
  return c.toDataURL();
}

function grain(): string {
  const out = canvas(128, 128);
  if (!out) return '';
  const [c, x] = out, id = x.createImageData(128, 128), r = rng(7);
  for (let i = 0; i < id.data.length; i += 4) { const v = (r() * 255) | 0; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
  x.putImageData(id, 0, 0);
  return c.toDataURL();
}

const cache = new Map<string, string>();
const once = (key: string, make: () => string): string => {
  let v = cache.get(key);
  if (v === undefined) { v = make(); cache.set(key, v); }
  return v;
};

/** The title card's night city (mockup 0). */
export const skylineUrl = (): string => once('skyline', () => skyline(5, 1.25));
/** HQ Lv. 1, the leaking warehouse (mockup 1); the morning sky through the skylight and door when `morning`. */
export const warehouseUrl = (morning: boolean): string => once(`warehouse-${morning}`, () => warehouse(morning));
/** Film grain shared by every Dominion stage (the mockups' `--noise`). */
export const grainUrl = (): string => once('grain', grain);
