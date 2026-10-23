// LED 行扫描：74HC138 译码器选行 + 8 通道 PWM 恒流驱动器按灰度在列上灌电流。
// 依赖：iso-kit（以 k.* 形式在本文件之前内联）。
const k = { iso, depthOf, slabOf, cylinder, insetPlan, onTop, planOutline, lineOnTop, ring, corners, boxCorners, knurl, sideArc, haloOf, fitProjection, solidSvg, lineSvg, dotsSvg, wireSvg, faceTextSvg, topMatrix, figureSvg, plateHtml, ISO_CSS, pathOf, sideSeam, topTicks };

// ---------- 模型（时间单位：GCLK 周期） ----------
const ROWS = 8, COLS = 8;
const BITS = 4, LEVELS = 1 << BITS;  // 演示用 4 位灰度：一个 PWM 周期 = 16 个 GCLK（真实芯片 12–16 位）
const RT = LEVELS + 1;               // 每行 = 1 个换行消隐 GCLK + 16 个 PWM GCLK
const MASK = [0b01100110, 0b11111111, 0b11111111, 0b11111111, 0b01111110, 0b00111100, 0b00011000, 0b00000000];
// 灰度值 0–15：心形，从左上到右下渐亮，方便对比不同占空比
const GS = MASK.map((m, r) => Array.from({ length: 8 }, (_, c) => ((m >> (7 - c)) & 1 ? Math.round(4 + (11 * (r + c)) / 10) : 0)).map((v) => Math.min(15, v)));
const I_SET = 20;                    // R-EXT 设定的每通道恒流 (mA)
const shiftAt = (b) => 2.4 + 1.6 * b;  // 第 b 个通道的灰度字到达驱动器的时刻（行内第几个 GCLK）
const TRAVEL = 2.4;

// ---------- 几何 ----------
const W = 640, H = 350;
const PCB = { x: -140, y: -125, w: 252, d: 200, r: 6 };
const T = 3, FOOT = 8;
const colX = (c) => -10 + 14 * c;
const rowY = (r) => -40 + 14 * r;
const colTrace = (c) => colX(c) + 5;
const ROW_END = 99;
const COL_TOP = -50, COL_END = 64;

const P = k.fitProjection([...k.boxCorners(PCB, -T - FOOT, 0), [-131.5, -55.5, 12]], W, H, { pad: 6, azimuth: 45 });
const at = (p) => k.iso(p, P);
const S = (paths, o) => k.solidSvg(paths, o);
const L = (d, o) => k.lineSvg(d, o);
const D = (pts, o) => k.dotsSvg(pts, o);
const poly = (pts, z = 0) => k.onTop(pts, z, P);
const depth2 = ([x, y], z = 0) => k.depthOf([x, y, z], P);

// ---------- 走线 ----------
const sigs = [];   // {id, d}
const traces = []; // 底色走线
function trace(pts, { id, tone = "lo", ends = "both", layer = "top" } = {}) {
  const sp = pts.map(([x, y]) => at([x, y, 0]));
  traces.push(`<g data-t="${id || ""}">${k.wireSvg(sp[0], sp[sp.length - 1], { via: sp.slice(1, -1), tone: layer === "bottom" ? "faint" : tone, ends, size: 0.9 })}</g>`);
  if (id) sigs.push({ id, d: k.pathOf(sp) });
  return sp;
}
const vias = [];
const via = (x, y) => vias.push([x, y]);

// 译码器 U1 (74HC138, SOIC-16, 长轴沿 y)
const U1 = { x: -78, y: -4, w: 14, d: 26, r: 1 };
const u1Pin = (kk) => -1.5 + 3 * kk;
// 驱动器 U2 (8 通道恒流灌电流驱动, SOIC-16, 长轴沿 x)
const U2 = { x: 7, y: -95, w: 26, d: 14, r: 1 };
const u2Pin = (kk) => 9.5 + 3 * kk;
// MCU U3 (QFP-32)
const U3 = { x: -106, y: -96, w: 22, d: 22, r: 1 };
const u3Side = (kk) => -93.4 + 2.4 * kk;   // +x / -x 侧的 y
const u3Near = (kk) => -103.4 + 2.4 * kk;  // +y / -y 侧的 x

// 地址线 A0..A2：MCU 近侧 → U1 左侧引脚 1..3
[[0, 7], [1, 6], [2, 5]].forEach(([bit, kk]) => {
  const x = u3Near(kk), y = u1Pin(bit);
  trace([[x, -71], [x, y], [-80.5, y]], { id: `a${bit}` });
});
// /E1 /E2 接地，E3 接 VCC
for (const kk of [3, 4, 5]) { trace([[-80.5, u1Pin(kk)], [-84, u1Pin(kk)]], { ends: "from" }); via(-84.6, u1Pin(kk)); }
// GND 引脚 8
trace([[-80.5, u1Pin(7)], [-80.5, 24]], { ends: "from" }); via(-80.5, 24.6);
// VCC 引脚 16
trace([[-61.5, u1Pin(0)], [-61.5, -7]], { ends: "from" }); via(-61.5, -7.6);
// 行选通：/Y0../Y6 在右侧 k=1..7，/Y7 在左侧 k=6
const GATE_X = -42;
for (let r = 0; r < 7; r++) {
  const py = u1Pin(r + 1), gy = rowY(r) - 1.6;
  trace([[-61.5, py], [-57, py], [-47, gy], [GATE_X, gy]], { id: `g${r}` });
}
trace([[-80.5, u1Pin(6)], [-86, u1Pin(6)], [-86, 31], [-58, 31], [-47, rowY(7) - 1.6], [GATE_X, rowY(7) - 1.6]], { id: "g7" });
// 行线：PMOS 漏极 → 一整行 LED 的阳极
for (let r = 0; r < ROWS; r++) {
  trace([[-33, rowY(r)], [ROW_END, rowY(r)]], { id: `r${r}`, ends: "to" });
  trace([[-42, rowY(r) + 1.6], [-45, rowY(r) + 1.6]], { ends: "to" }); // 源极 → VLED 过孔
  via(-45.6, rowY(r) + 1.6);
}
// 驱动器 → 列：OUT0..3 在近侧，OUT4..7 绕过芯片右端
for (let c = 0; c < 4; c++) {
  const px = u2Pin(4 + c);
  trace([[px, -78.5], [px, -64], [colTrace(c), -55], [colTrace(c), COL_TOP]], { id: `c${c}t`, ends: "from" });
}
for (let c = 4; c < 8; c++) {
  const j = c - 4, px = u2Pin(7 - j), turn = -100.5 - 2.5 * j, side = 38 + 3 * j;
  trace([[px, -97.5], [px, turn], [side, turn], [side, -64], [colTrace(c), -55], [colTrace(c), COL_TOP]], { id: `c${c}t`, ends: "from" });
}
for (let c = 0; c < COLS; c++) {
  via(colTrace(c), COL_TOP);
  trace([[colTrace(c), COL_TOP], [colTrace(c), COL_END]], { id: `c${c}b`, layer: "bottom", ends: "to" });
  for (let r = 0; r < ROWS; r++) {
    trace([[colX(c) + 3, rowY(r) + 2.6], [colTrace(c), rowY(r) + 2.6]], { id: `k${r}_${c}`, ends: "none" });
    via(colTrace(c), rowY(r) + 2.6);
  }
}
// MCU → 驱动器：SDI / DCLK / LE / GCLK
const SDI = [[-81.5, u3Side(5)], [-64, u3Side(5)], [-64, -75], [u2Pin(1), -75], [u2Pin(1), -78.5]];
trace(SDI, { id: "sdi" });
trace([[-81.5, u3Side(6)], [-68, u3Side(6)], [-68, -72], [u2Pin(2), -72], [u2Pin(2), -78.5]], { id: "clk" });
trace([[-81.5, u3Side(7)], [-72, u3Side(7)], [-72, -69], [u2Pin(3), -69], [u2Pin(3), -78.5]], { id: "le" });
trace([[-81.5, u3Side(1)], [-74, u3Side(1)], [-74, -116], [u2Pin(3), -116], [u2Pin(3), -97.5]], { id: "gclk" });
// 驱动器其余引脚
trace([[u2Pin(0), -78.5], [6, -78.5]], { ends: "from" }); via(5.4, -78.5);           // GND
trace([[u2Pin(0), -97.5], [u2Pin(0), -101], [4, -101]], { ends: "from" }); via(3.4, -101); // VDD
trace([[u2Pin(1), -97.5], [u2Pin(1), -104]], { ends: "from" });                      // R-EXT
trace([[u2Pin(1), -108.5], [u2Pin(1), -111]], { ends: "none" }); via(u2Pin(1), -111.6);
trace([[u2Pin(2), -97.5], [u2Pin(2), -101]], { ends: "from" }); via(u2Pin(2), -101.6); // SDO 级联
// 下载口 J1 → MCU 左侧
for (let j = 0; j < 5; j++) {
  const hy = -55.5 + 5 * j, my = u3Side(j + 2), x = -124 + 2.5 * j;
  trace([[-131.5, hy], [x, hy], [x, my], [-108.5, my]], {});
}
// 晶振
trace([[u3Near(3), -98.5], [u3Near(3), -106]], {});
trace([[u3Near(5), -98.5], [u3Near(5), -106]], {});

// ---------- 实体 ----------
function board() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PCB, -T - FOOT, T, P)}"/>`];
  const byDepth = (pts) => [...pts].sort((a, b) => depth2(a) - depth2(b));
  for (const [x, y] of byDepth(k.corners(PCB, 8))) {
    out.push(S(k.cylinder(x, y, 4.6, -T - FOOT, 1.4, P, 24), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 3.4, -T - FOOT + 1.4, FOOT - 1.4, P, 6), { tone: "mid" }));
  }
  out.push(S(k.slabOf(PCB, -T, T, P, 8, 0.8), { tone: "mid", inner: L(k.sideSeam(PCB, -1.2, P), { tone: "faint" }) }));
  out.push(L(k.planOutline(k.insetPlan(PCB, 3), 0, P), { tone: "faint" }));
  for (const [x, y] of k.corners(PCB, 8)) {
    out.push(L(k.ring(x, y, 3.6, 0, P, 24), { tone: "lo" }), L(k.ring(x, y, 2, 0, P, 20), { tone: "mid" }));
  }
  // 丝印：器件框
  out.push(L(k.planOutline(k.insetPlan(U1, -5), 0, P), { tone: "faint" }));
  out.push(L(k.planOutline(k.insetPlan(U2, -5), 0, P), { tone: "faint" }));
  out.push(L(k.planOutline({ x: -16, y: -46, w: 116, d: 112, r: 2 }, 0, P), { tone: "faint" }));
  // 基准点
  for (const [x, y] of [[96, -112], [-126, 62]]) out.push(L(k.ring(x, y, 2.2, 0, P, 20), { tone: "lo" }), D([at([x, y, 0])], { size: 0.8, tone: "mid" }));
  // 铭牌
  const plate = { x: 54, y: -118, w: 46, d: 16, r: 1 };
  out.push(S(k.slabOf(plate, 0, 0.4, P, 3), { tone: "lo", crease: "none" }));
  out.push(L(k.planOutline(k.insetPlan(plate, 1.4), 0.4, P), { tone: "faint" }));
  out.push(k.faceTextSvg(k.topMatrix([plate.x + 4, plate.y + 10], 0.4, P, "x"), "SCAN 1:8", { size: 5, tone: "lo" }));
  return out.join("");
}

function soicPins(body, along, n, pinAt, near) {
  // 返回 [远侧引脚, 近侧引脚]
  const far = [], nearOut = [];
  for (let kk = 0; kk < n; kk++) {
    const p = pinAt(kk);
    if (along === "y") {
      far.push(S(k.slabOf({ x: body.x - 3, y: p - 0.6, w: 3, d: 1.2, r: 0.2 }, 0, 1, P, 2), { tone: "mid", crease: "none" }));
      nearOut.push(S(k.slabOf({ x: body.x + body.w, y: p - 0.6, w: 3, d: 1.2, r: 0.2 }, 0, 1, P, 2), { tone: "mid", crease: "none" }));
    } else {
      far.push(S(k.slabOf({ x: p - 0.6, y: body.y - 3, w: 1.2, d: 3, r: 0.2 }, 0, 1, P, 2), { tone: "mid", crease: "none" }));
      nearOut.push(S(k.slabOf({ x: p - 0.6, y: body.y + body.d, w: 1.2, d: 3, r: 0.2 }, 0, 1, P, 2), { tone: "mid", crease: "none" }));
    }
  }
  return [far.join(""), nearOut.join("")];
}

function soic(body, along, pinAt, tone, part, label) {
  const [far, near] = soicPins(body, along, 8, pinAt);
  const top = 3.4;
  const pin1 = along === "y" ? [body.x + 3, body.y + 3] : [body.x + 3, body.y + body.d - 3];
  // 每种语言各画一个标签，页面按当前语言只显示一个
  const face = (text, size) => along === "y"
    ? k.faceTextSvg(k.topMatrix([body.x + body.w / 2 - size * 0.38, body.y + body.d / 2], top, P, "y"), text, { size, tone: "hi", anchor: "middle" })
    : k.faceTextSvg(k.topMatrix([body.x + body.w / 2, body.y + body.d / 2 + size * 0.38], top, P, "x"), text, { size, tone: "hi", anchor: "middle" });
  const text = Object.entries(label).map(([lang, [word, size]]) => `<g class="lang-${lang}">${face(word, size)}</g>`).join("");
  return `<g data-part="${part}">${far}${S(k.slabOf(body, 0.4, top - 0.4, P, 4, 0.6), { tone, crease: "lo" })}` +
    L(k.ring(pin1[0], pin1[1], 1.1, top, P, 16), { tone: "mid" }) +
    L(k.planOutline(k.insetPlan(body, 2), top, P, 3), { tone: "faint" }) + text + `${near}</g>`;
}

function qfp() {
  const out = [];
  const pins = (side) => {
    const list = [];
    for (let kk = 0; kk < 8; kk++) {
      const a = u3Side(kk), b = u3Near(kk);
      const plan = side === "-x" ? { x: U3.x - 2.6, y: a - 0.5, w: 2.6, d: 1 } : side === "+x" ? { x: U3.x + U3.w, y: a - 0.5, w: 2.6, d: 1 }
        : side === "-y" ? { x: b - 0.5, y: U3.y - 2.6, w: 1, d: 2.6 } : { x: b - 0.5, y: U3.y + U3.d, w: 1, d: 2.6 };
      list.push(S(k.slabOf({ ...plan, r: 0.2 }, 0, 0.8, P, 2), { tone: "mid", crease: "none" }));
    }
    return list.join("");
  };
  out.push(pins("-x"), pins("-y"));
  out.push(S(k.slabOf(U3, 0.4, 2.6, P, 4, 0.6), { tone: "mid", crease: "lo" }));
  out.push(L(k.ring(U3.x + 3.5, U3.y + 3.5, 1.2, 3, P, 16), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(U3, 2.4), 3, P, 3), { tone: "faint" }));
  out.push(k.faceTextSvg(k.topMatrix([U3.x + U3.w / 2, U3.y + U3.d / 2 + 1.6], 3, P, "x"), "MCU", { size: 4.6, tone: "mid", anchor: "middle" }));
  out.push(pins("+x"), pins("+y"));
  return `<g data-part="mcu">${out.join("")}</g>`;
}

function pmos(r) {
  const y = rowY(r);
  const body = { x: -40, y: y - 3, w: 6, d: 6, r: 0.6 };
  return `<g data-part="pmos">` + [
    S(k.slabOf({ x: -42.4, y: y - 2.2, w: 2.4, d: 1.2, r: 0.2 }, 0, 0.9, P, 2), { tone: "mid", crease: "none" }),
    S(k.slabOf({ x: -42.4, y: y + 1, w: 2.4, d: 1.2, r: 0.2 }, 0, 0.9, P, 2), { tone: "mid", crease: "none" }),
    `<g data-pmos="${r}">${S(k.slabOf(body, 0.3, 1.7, P, 3, 0.4), { tone: "mid" })}</g>`,
    S(k.slabOf({ x: -34, y: y - 0.6, w: 2.4, d: 1.2, r: 0.2 }, 0, 0.9, P, 2), { tone: "mid", crease: "none" }),
  ].join("") + `</g>`;
}

function led(r, c) {
  const x = colX(c), y = rowY(r);
  const body = { x: x - 3.5, y: y - 3.5, w: 7, d: 7, r: 0.8 };
  const lens = k.cylinder(x, y, 2.5, 2, 0.5, P, 28);
  const [bx, by] = at([x, y, 2.5]);
  return `<g data-led="${r}_${c}">` +
    S(k.slabOf(body, 0, 2, P, 3, 0.4), { tone: "mid" }) +
    L(k.lineOnTop([x + 2.4, y - 3.5], [x + 3.5, y - 2.4], 2, P), { tone: "lo" }) +
    S(lens, { tone: "hi", crease: "lo" }) +
    `<path class="led-lens" d="${lens.top}"/><circle class="led-bloom" cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" r="7"/>` +
    `<path class="led-sel" d="${k.planOutline(k.insetPlan(body, -1.2), 0, P, 3)}"/>` +
    `<path class="led-hit" d="${k.slabOf(body, 0, 2.6, P, 3).fill}"/></g>`;
}

function chipCap(plan, along) {
  const ends = along === "x"
    ? [{ x: plan.x, y: plan.y, w: 1, d: plan.d }, { x: plan.x + plan.w - 1, y: plan.y, w: 1, d: plan.d }]
    : [{ x: plan.x, y: plan.y, w: plan.w, d: 1 }, { x: plan.x, y: plan.y + plan.d - 1, w: plan.w, d: 1 }];
  return S(k.slabOf({ ...plan, r: 0.3 }, 0, 1.4, P, 2), { tone: "mid", crease: "none" }) +
    ends.map((e) => S(k.slabOf({ ...e, r: 0.2 }, 0, 1.5, P, 2), { tone: "lo", crease: "none" })).join("");
}

function crystal() {
  const plan = { x: -101, y: -113, w: 12, d: 7, r: 2.4 };
  return S(k.slabOf(plan, 0, 0.6, P, 4), { tone: "lo", crease: "none" }) +
    S(k.slabOf(k.insetPlan(plan, 0.6), 0.6, 2.6, P, 4, 0.5), { tone: "mid" });
}

function header() {
  const body = { x: -134, y: -58, w: 5, d: 25, r: 0.6 };
  const out = [S(k.slabOf(body, 0, 4.4, P, 2, 0.4), { tone: "lo" })];
  for (let j = 0; j < 5; j++) {
    const y = -55.5 + 5 * j;
    out.push(L(k.planOutline({ x: body.x + 0.6, y: y - 2.2, w: 3.8, d: 4.4, r: 0.3 }, 4.4, P, 2), { tone: "faint" }));
    out.push(S(k.slabOf({ x: -132.1, y: y - 0.6, w: 1.2, d: 1.2, r: 0.1 }, 4.4, 7, P, 1), { tone: "mid", crease: "none" }));
  }
  return out.join("");
}

// ---------- 画面装配 ----------
const items = [];
const put = (center, svg) => items.push({ d: depth2(center), svg });
put([-71, 9], soic(U1, "y", u1Pin, "hi", "decoder", { zh: ["译码IC", 4.2], en: ["DECODER", 3.4], de: ["DECODER", 3.4] }));
put([20, -88], soic(U2, "x", u2Pin, "hi", "driver", { zh: ["驱动IC", 4.2], en: ["DRIVER", 3.6], de: ["TREIBER", 3.4] }));
put([-95, -85], qfp());
for (let r = 0; r < ROWS; r++) put([-37, rowY(r)], pmos(r));
for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) put([colX(c), rowY(c >= 0 ? r : r)], led(r, c));
put([-95, -109], crystal());
put([-131.5, -45], header());
put([-86, -104], chipCap({ x: -87.5, y: -107, w: 3, d: 5 }, "y"));
put([-71, -15], chipCap({ x: -73.5, y: -16.5, w: 5, d: 3 }, "x"));
put([-2, -98], chipCap({ x: -3.5, y: -100.5, w: 3, d: 5 }, "y"));
put([12.5, -106], chipCap({ x: 11, y: -108.6, w: 3, d: 5 }, "y")); // R-EXT（0603 电阻）
items.sort((a, b) => a.d - b.d);

const viaSvg = L(vias.map(([x, y]) => k.ring(x, y, 1.2, 0, P, 12)).join(""), { tone: "lo" }) + D(vias.map(([x, y]) => at([x, y, 0])), { size: 0.45, tone: "lo" });
const sigSvg = sigs.map((s) => `<path class="sig" data-sig="${s.id}" d="${s.d}"/>`).join("");
const bitSvg = Array.from({ length: 8 }, (_, b) => `<circle class="bit" data-bit="${b}" r="1.7" cx="-99" cy="-99"/>`).join("");


const svg = k.figureSvg({
  width: W, height: H,
  label: "一块 8×8 LED 点阵电路板：MCU 用 3 位地址让 74HC138 译码器选通一行，PMOS 给这一行供电；PWM 恒流驱动器在每个 GCLK 上计数，计数值小于该列灰度值时就在这一列灌入恒定电流，交叉点的 LED 点亮。",
  body: [board(), traces.join(""), viaSvg, `<g class="sigs">${sigSvg}</g>`, `<g class="bits">${bitSvg}</g>`, items.map((i) => i.svg).join("")],
});

