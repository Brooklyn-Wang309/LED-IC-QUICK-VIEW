// ---------- 动起来：9 步导览（时间单位：GCLK 周期） ----------
{
  const FMIN = 2, FMAX = 40000;          // GCLK 频率范围 (Hz)
  const TAU = 0.03;                      // LED + 人眼的余辉时间常数 (s)
  const FRAME = 8 * RT;                  // 一帧的 GCLK 数
  const stage = document.querySelector(".iso-stage");
  const svgEl = stage.querySelector("svg");
  const readout = document.querySelector("[data-readout]");
  const readout2 = document.querySelectorAll("[data-readout]")[1];
  const guide = document.querySelector(".guide");
  const $ = (sel, root = document) => root.querySelector(sel);
  const still = matchMedia("(prefers-reduced-motion: reduce)");
  const q = (sel) => [...stage.querySelectorAll(sel)];
  const sig = {};
  for (const el of q("[data-sig]")) (sig[el.dataset.sig] ||= []).push(el);
  const lens = [], bloom = [], ledG = [];
  for (const g of q("[data-led]")) {
    const [r, c] = g.dataset.led.split("_").map(Number);
    lens[r * 8 + c] = g.querySelector(".led-lens");
    bloom[r * 8 + c] = g.querySelector(".led-bloom");
    ledG[r * 8 + c] = g;
  }
  const bits = q(".bit");
  const sdiPts = SDI.map(([x, y]) => at([x, y, 0]));
  const seg = [0];
  for (let i = 1; i < sdiPts.length; i++) seg.push(seg[i - 1] + Math.hypot(sdiPts[i][0] - sdiPts[i - 1][0], sdiPts[i][1] - sdiPts[i - 1][1]));
  const along = (s) => {
    const want = s * seg[seg.length - 1];
    let i = 1;
    while (i < seg.length - 1 && seg[i] < want) i++;
    const t = (want - seg[i - 1]) / (seg[i] - seg[i - 1] || 1);
    return [sdiPts[i - 1][0] + (sdiPts[i][0] - sdiPts[i - 1][0]) * t, sdiPts[i - 1][1] + (sdiPts[i][1] - sdiPts[i - 1][1]) * t];
  };

  // ---------- 导览脚本 ----------
  // 每一步的行为；文字在 i18n.js 的 steps 里
  const STEPS = [
    { mode: { scan: "scan", pwm: true, cols: "pattern" }, f: 16000 },
    { mode: { scan: "hold", only: true, pwm: false, cols: "pattern" }, f: 20, focus: ["led", "pmos", "r", "c", "k"], pick: true },
    { mode: { scan: "scan", pwm: false, cols: "all" }, f: 10, focus: ["decoder", "mcu", "a", "g", "pmos", "r", "led"], helper: "addr" },
    { mode: { scan: "hold", row: 4, pwm: false, cols: "pattern" }, f: 6, focus: ["driver", "mcu", "sdi", "clk", "le", "c", "k", "led", "r", "pmos"], helper: "cols" },
    { mode: { scan: "scan", pwm: false, cols: "pattern" }, f: 17, helper: "scan" },
    { mode: { scan: "scan", pwm: false, cols: "pattern" }, auto: [[0, 17], [3, 17], [13, 16000]], helper: "refresh", slider: true },
    { mode: { scan: "hold", only: true, pwm: true, cols: "pattern" }, f: 5, focus: ["led", "driver", "pmos", "r", "c", "k"], pick: true, helper: "pwm", slider: true },
    { mode: { scan: "hold", pwm: true, cols: "pattern", rowFromSel: true }, f: 3, focus: ["driver", "mcu", "gclk", "c", "k", "led", "r", "pmos"], pick: true, helper: "gclk", slider: true },
    { mode: { scan: "scan", pwm: true, cols: "pattern" }, f: 16000, pick: true, helper: "free", slider: true },
  ];

  // ---------- 信号模型 ----------
  let step = 0, mode = STEPS[0].mode;
  let sel = { r: 2, c: 5 };
  const keys = ["a0", "a1", "a2", "sdi", "clk", "le", "gclk"];
  for (let r = 0; r < 8; r++) keys.push("g" + r, "r" + r);
  for (let c = 0; c < 8; c++) keys.push("c" + c);
  const ch = Object.fromEntries(keys.map((key) => [key, 0]));
  const ledB = new Float32Array(64);
  const acc = {}, ledAcc = new Float32Array(64);
  const mod8 = (v) => ((v % 8) + 8) % 8;
  const rowAt = (abs) => (mode.scan === "scan" ? mod8(abs) : mode.only || mode.rowFromSel ? sel.r : mode.row);

  function levels(p, out, ledOut) {
    const abs = Math.floor(p / RT), tt = p - abs * RT, tick = Math.floor(tt), ph = tt - tick;
    const row = rowAt(abs);
    out.gclk += ph < 0.5 ? 1 : 0;
    out.a0 += row & 1; out.a1 += (row >> 1) & 1; out.a2 += (row >> 2) & 1;
    out["g" + row] += 1; out["r" + row] += 1;
    if (mode.scan === "scan" && tick === 0 && ph < 0.5) out.le += 1;
    if (mode.cols === "pattern") for (let b = 0; b < 8; b++) {
      const t = shiftAt(b);
      if (tt > t - TRAVEL && tt < t) out.sdi += 1 / 8;
      if (tt >= t && tt < t + 0.4) out.clk += 1;
    }
    for (let c = 0; c < 8; c++) {
      if (mode.only && c !== sel.c) continue;
      let on;
      if (mode.cols === "all") on = mode.scan !== "scan" || tick >= 1;
      else if (mode.pwm) on = tick >= 1 && tick - 1 < GS[row][c];
      else if (mode.only) on = true;
      else on = (mode.scan !== "scan" || tick >= 1) && GS[row][c] > 0;
      if (on) { out["c" + c] += 1; ledOut[row * 8 + c] += 1; }
    }
  }
  // 当前模式下一颗灯可能的最大平均占空比，用来把亮度归一到 0–1
  const maxDuty = () => (mode.scan === "scan" ? 1 / 8 : 1) * (mode.pwm ? 15 / RT : mode.scan === "scan" ? LEVELS / RT : 1);

  let lf = Math.log(16000), target = 16000, phase = RT * 3.5, clock = 0, touring = false, last = 0, frame = 0, visible = false;
  const ease = (t) => t * t * (3 - 2 * t);
  const pathAt = (path, t) => {
    for (let i = 1; i < path.length; i++) if (t <= path[i][0]) {
      const [t0, v0] = path[i - 1], [t1, v1] = path[i];
      return Math.exp(Math.log(v0) + (Math.log(v1) - Math.log(v0)) * ease((t - t0) / (t1 - t0 || 1)));
    }
    return path[path.length - 1][1];
  };
  const toShare = (f) => (Math.log(f) - Math.log(FMIN)) / (Math.log(FMAX) - Math.log(FMIN));
  const fromShare = (s) => Math.exp(Math.log(FMIN) + Math.min(1, Math.max(0, s)) * (Math.log(FMAX) - Math.log(FMIN)));

  function integrate(dt) {
    let span = Math.exp(lf) * dt;
    if (span > FRAME) span = FRAME;       // 信号以一帧为周期，超过一帧时取一帧的平均
    for (const key of keys) acc[key] = 0;
    ledAcc.fill(0);
    const n = Math.min(1100, Math.ceil(span * 4) + 2);
    for (let i = 0; i < n; i++) levels(phase - span + (span * (i + 0.5)) / n, acc, ledAcc);
    const a = 1 - Math.exp(-dt / TAU);
    for (const key of keys) ch[key] += (acc[key] / n - ch[key]) * a;
    for (let i = 0; i < 64; i++) ledB[i] += (ledAcc[i] / n - ledB[i]) * a;
  }

  // ---------- 辅助小组件 ----------
  const helper = $(".helper", guide);
  const fmtHz = (f) => (f >= 1000 ? `${(f / 1000).toFixed(f >= 10000 ? 1 : 2)} kHz` : f >= 10 ? `${Math.round(f)} Hz` : `${f.toFixed(1)} Hz`);
  const bar = () => `<div class="bar">${Array.from({ length: LEVELS }, (_, i) => `<span>${i}</span>`).join("")}</div><div class="barcap"></div>`;
  const slider = (label) => `<label class="speed">${label} · ${TX().slow}<input type="range" min="0" max="1000" value="0" aria-label="${label}">${TX().fast}</label>`;
  const small = `style="font:11px var(--anatomy-mono);text-align:center;color:var(--anatomy-muted)"`;
  const HELPERS = {
    addr: (T) => `<div class="bitsbox"><span>${T.addrLabel}</span>${["A2", "A1", "A0"].map((n) => `<div><div class="bitc" data-b="${n}">0</div><div ${small}>${n}</div></div>`).join("")}<span class="arrow">→</span><span class="res"></span></div>`,
    cols: (T) => `<div class="bitsbox"><span>${T.colsLabel(4)}</span>${Array.from({ length: 8 }, (_, c) => `<div><div class="bitc${GS[4][c] ? " on" : ""}">${GS[4][c] ? 1 : 0}</div><div ${small}>${T.colName(c)}</div></div>`).join("")}</div><p class="barcap" style="margin:6px 0 0">${T.colsNote(4, GS[4].filter(Boolean).length)}</p>`,
    scan: (T) => `<div class="bitsbox"><span>${T.scanLabel}</span>${Array.from({ length: 8 }, (_, r) => `<div class="bitc" data-row="${r}">${r}</div>`).join("")}<span class="res"></span></div>`,
    refresh: (T) => `<div class="big"><div><span class="n" data-h="refresh">—</span> <span class="u">${T.refreshUnit}</span></div><span class="verdict" data-h="verdict"></span></div>${slider(T.speedScan)}`,
    pwm: (T) => `${bar()}${slider(T.speedSwitch)}`,
    gclk: (T) => `<div class="big"><div><span class="u">${T.countLabel}</span> <span class="n" data-h="count">0</span></div><div><span class="u">GCLK</span> <span class="n" style="font-size:18px" data-h="f">—</span></div><div><span class="u">${T.refreshLabel}</span> <span class="n" style="font-size:18px" data-h="refresh">—</span></div></div>${bar()}${slider("GCLK")}`,
    free: (T) => `${slider("GCLK")}<div class="stats">
<div class="stat"><b data-h="f">—</b><span>${T.statF}</span></div>
<div class="stat"><b>1/8</b><span data-h="rowrate"></span></div>
<div class="stat"><b data-h="refresh">—</b><span>${T.statRefresh}</span></div>
<div class="stat"><b data-h="duty">—</b><span data-h="which"></span></div></div>`,
  };
  const H = (name) => helper.querySelector(`[data-h="${name}"]`);

  function updateHelper(row, tt, fast) {
    const f = Math.exp(lf), refresh = f / FRAME, kind = STEPS[step].helper;
    const tick = Math.floor(tt), count = tick - 1, T = TX();
    if (kind === "addr") {
      const b = [(row >> 2) & 1, (row >> 1) & 1, row & 1];
      helper.querySelectorAll("[data-b]").forEach((el, i) => { el.textContent = b[i]; el.classList.toggle("on", !!b[i]); });
      $(".res", helper).textContent = T.addrRes(row);
    } else if (kind === "scan") {
      helper.querySelectorAll("[data-row]").forEach((el) => el.classList.toggle("on", Number(el.dataset.row) === row));
      $(".res", helper).textContent = fast ? T.scanFast : T.scanRow(row);
    } else if (kind === "refresh") {
      H("refresh").textContent = `${refresh < 10 ? refresh.toFixed(1) : Math.round(refresh)} Hz`;
      const v = H("verdict");
      const text = T.verdict[refresh < 3 ? 0 : refresh < 50 ? 1 : refresh < 100 ? 2 : 3];
      if (v.textContent !== text) { v.textContent = text; v.classList.toggle("ok", refresh >= 100); }
    }
    if (kind === "pwm" || kind === "gclk") {
      const g = GS[sel.r][sel.c];
      const showNow = !fast && tick >= 1;
      helper.querySelectorAll(".bar span").forEach((el, i) => { el.classList.toggle("on", i < g); el.classList.toggle("now", showNow && i === count); });
      let cap = g === 0 ? T.capZero(sel.r, sel.c) : T.cap(sel.r, sel.c, g, Math.round((g / LEVELS) * 100));
      if (kind === "gclk" && !fast) cap += tick === 0 ? T.capSwitch : T.capCount(count, g, count < g);
      const capEl = $(".barcap", helper);
      if (capEl.innerHTML !== cap) capEl.innerHTML = cap;
      if (kind === "gclk") {
        H("count").textContent = fast ? "…" : tick === 0 ? T.countSwitch : String(count);
        H("f").textContent = fmtHz(f);
        H("refresh").textContent = `${refresh < 10 ? refresh.toFixed(2) : Math.round(refresh)} Hz`;
      }
    } else if (kind === "free") {
      const g = GS[sel.r][sel.c];
      H("f").textContent = fmtHz(f);
      H("rowrate").textContent = T.statScan(fmtHz(f / RT));
      H("refresh").textContent = `${refresh < 10 ? refresh.toFixed(2) : Math.round(refresh)} Hz`;
      H("duty").textContent = `${Math.round((g / LEVELS) * 100)}% → ${((g / RT / 8) * 100).toFixed(1)}%`;
      H("which").textContent = T.statDuty(sel.r, sel.c, g);
    }
    const range = $(".speed input", helper);
    if (range && document.activeElement !== range) range.value = String(Math.round(toShare(f) * 1000));
  }

  // ---------- Fig 2 时序图（进阶） ----------
  const SW = 640, X0 = 66, X1 = 540, LANE = 21, TOP = 8;
  const CELLS = RT + 1, CW = (X1 - X0) / CELLS;
  const laneNames = () => [...TX().lanes, ...Array.from({ length: 8 }, (_, c) => `OUT${c}`)];
  const SH = TOP + 12 * LANE + 10;
  const xOf = (t) => X0 + t * CW;
  const yOf = (i) => TOP + i * LANE;
  const scope = $(".scope");
  scope.innerHTML = `<svg class="scope-svg" viewBox="0 0 ${SW} ${SH}" role="img" aria-label="GCLK / LE / OUT timing"><g class="scope-static"></g><line class="cursor" x1="0" x2="0" y1="${TOP - 2}" y2="${SH - 6}"/></svg>`;
  const scopeStatic = $(".scope-static", scope);
  const cursor = $(".cursor", scope);
  const hi = (i) => yOf(i) + 4, lo = (i) => yOf(i) + LANE - 5;
  const busBox = (i, t0, t1, text) => {
    const a = xOf(t0), b = xOf(t1), y0 = hi(i), y1 = lo(i), m = (y0 + y1) / 2, e = Math.min(3, (b - a) / 3);
    return `<path class="bus" d="M${a} ${m}L${a + e} ${y0}H${b - e}L${b} ${m}L${b - e} ${y1}H${a + e}Z"/><text class="cnt" x="${(a + b) / 2}" y="${m + 3}" text-anchor="middle">${text}</text>`;
  };
  let drawnKey = "";
  function buildScope(R) {
    const key = `${R}|${sel.r}|${sel.c}|${LANG}`;
    const T = TX();
    if (key === drawnKey) return;
    drawnKey = key;
    const out = [];
    for (let t = 0; t <= CELLS; t++) out.push(`<line class="grid" x1="${xOf(t)}" x2="${xOf(t)}" y1="${TOP}" y2="${SH - 8}"/>`);
    out.push(`<rect class="blank" x="${xOf(0)}" y="${TOP}" width="${CW}" height="${SH - 8 - TOP}"/><rect class="blank" x="${xOf(RT)}" y="${TOP}" width="${CW}" height="${SH - 8 - TOP}"/>`);
    laneNames().forEach((name, i) => out.push(`<text class="lane" x="6" y="${yOf(i) + LANE / 2 + 4}">${name}</text>`));
    let d = `M${xOf(0)} ${lo(0)}`;
    for (let t = 0; t < CELLS; t++) d += `V${hi(0)}H${xOf(t + 0.5)}V${lo(0)}H${xOf(t + 1)}`;
    out.push(`<path class="wave" d="${d}"/>`);
    const pulse = (t) => `H${xOf(t)}V${hi(1)}H${xOf(t + 0.5)}V${lo(1)}`;
    out.push(`<path class="wave" d="M${xOf(0)} ${lo(1)}${pulse(0)}${pulse(RT)}H${xOf(CELLS)}"/>`);
    const addr = (r) => r.toString(2).padStart(3, "0");
    out.push(busBox(2, 0, RT, T.busRow(R, addr(R))), busBox(2, RT, CELLS, `${(R + 1) % 8}`));
    out.push(busBox(3, 0, 1, T.busSwitch), busBox(3, RT, CELLS, T.busSwitch));
    for (let n = 0; n < LEVELS; n++) out.push(busBox(3, n + 1, n + 2, String(n)));
    for (let c = 0; c < 8; c++) {
      const i = 4 + c, g = GS[R][c], on = R === sel.r && c === sel.c ? " sel" : "";
      const a = xOf(1), b = xOf(1 + g);
      out.push(g ? `<rect class="fillon${on}" x="${a}" y="${hi(i)}" width="${b - a}" height="${lo(i) - hi(i)}"/>` : "");
      out.push(`<path class="wave${on}" d="M${xOf(0)} ${lo(i)}${g ? `H${a}V${hi(i)}H${b}V${lo(i)}` : ""}H${xOf(CELLS)}"/>`);
      out.push(`<text class="note${on}" x="${X1 + 8}" y="${yOf(i) + LANE / 2 + 4}">GS ${String(g).padStart(2, " ")} · ${Math.round((g / LEVELS) * 100)}%</text>`);
    }
    scopeStatic.innerHTML = out.join("");
    readout2.textContent = T.scopeRo(R);
  }

  // ---------- 每帧绘制 ----------
  const fmt = (v) => v.toFixed(2);
  function draw() {
    const f = Math.exp(lf), rowRate = f / RT, refresh = f / FRAME;
    const abs = Math.floor(phase / RT), row = rowAt(abs), tt = phase - abs * RT, tick = Math.floor(tt);
    const fast = rowRate > 12;
    const scanning = mode.scan === "scan";
    const set = (key, v) => (sig[key] || []).forEach((el) => (el.style.opacity = fmt(Math.min(1, v))));
    const gain = 0.95 / maxDuty();
    for (const b of ["a0", "a1", "a2"]) set(b, ch[b]);
    for (let r = 0; r < 8; r++) { set("g" + r, ch["g" + r] * (scanning && fast ? 6 : 1)); set("r" + r, ch["r" + r] * (scanning && fast ? 6 : 1)); }
    for (let c = 0; c < 8; c++) {
      const cg = fast ? Math.min(6, gain * 0.25) : 1;
      set(`c${c}t`, ch["c" + c] * cg);
      set(`c${c}b`, ch["c" + c] * cg);
      for (let r = 0; r < 8; r++) set(`k${r}_${c}`, ledB[r * 8 + c] * gain);
    }
    const dataOn = mode.cols === "pattern";
    set("sdi", dataOn ? (fast ? 0.3 + ch.sdi : 0.15 + ch.sdi) : 0);
    set("clk", dataOn ? ch.clk * (fast ? 3 : 1) : 0);
    set("le", ch.le * (fast ? 10 : 1));
    set("gclk", mode.pwm ? (fast ? 0.9 : 0.2 + ch.gclk * 0.8) : 0);
    for (let i = 0; i < 64; i++) {
      const v = Math.min(1, ledB[i] * gain);
      lens[i].style.opacity = fmt(v);
      bloom[i].style.opacity = fmt(v * 0.55);
    }
    const next = scanning ? (row + 1) % 8 : row;
    const show = dataOn ? Math.max(0, Math.min(1, (14 - rowRate) / 8)) : 0;
    bits.forEach((el, b) => {
      const t = shiftAt(b), s = (tt - (t - TRAVEL)) / TRAVEL;
      if (show <= 0 || s <= 0 || s >= 1) { el.style.opacity = "0"; return; }
      const [x, y] = along(s);
      const g = GS[next][7 - b];
      el.setAttribute("cx", x.toFixed(1));
      el.setAttribute("cy", y.toFixed(1));
      el.style.fillOpacity = g ? fmt(mode.pwm ? 0.25 + (0.75 * g) / 15 : 1) : "0";
      el.style.opacity = fmt(show * Math.min(1, s * 6, (1 - s) * 6));
    });
    const T = TX();
    let text;
    if (scanning && fast) text = T.roRefresh(Math.round(refresh));
    else if (scanning) text = T.roLit(row);
    else text = T.roPowered(row);
    if (mode.pwm && !fast) text += tick === 0 ? T.roSwitch : T.roCount(tick - 1);
    if (readout.textContent !== text) readout.textContent = text;
    updateHelper(row, tt, fast);
    if (scope.closest("details").open) {
      buildScope(fast || !scanning ? sel.r : row);
      cursor.style.opacity = fast ? "0" : "1";
      if (!fast) { const x = xOf(tt).toFixed(1); cursor.setAttribute("x1", x); cursor.setAttribute("x2", x); }
    }
  }

  function tick() {
    const now = performance.now();
    const dt = last ? Math.min((now - last) / 1000, 0.25) : 1 / 60;  // 按真实时间推进，掉帧时也不会变慢
    last = now;
    const auto = STEPS[step].auto;
    if (touring && auto) { clock += dt; target = pathAt(auto, clock); }
    lf += (Math.log(target) - lf) * (1 - Math.exp(-dt / 0.35));
    phase += Math.exp(lf) * dt;
    if (phase > FRAME * 1e6) phase -= FRAME * 1e6;
    integrate(dt);
    draw();
    frame = visible ? requestAnimationFrame(tick) : 0;
  }
  const run = () => { if (!frame && visible && !still.matches) { last = 0; frame = requestAnimationFrame(tick); } };

  // ---------- 导览控制 ----------
  const dots = $(".dots", guide);
  dots.innerHTML = STEPS.map((_, i) => `<button type="button" data-step="${i}">${i + 1}</button>`).join("");
  const seen = new Set();
  const focusMatch = (el, focus) => {
    if (el.classList.contains("sigs") || el.classList.contains("bits")) return true;
    if (el.dataset.part) return focus.includes(el.dataset.part);
    if (el.hasAttribute("data-led")) return focus.includes("led");
    if (el.dataset.t !== undefined) {
      const id = el.dataset.t;
      if (!id) return false;
      return focus.some((f) => (f.length === 1 ? new RegExp(`^${f}\\d`).test(id) : id === f));
    }
    return true; // 电路板本身
  };
  function select(r, c) {
    ledG[sel.r * 8 + sel.c].classList.remove("on");
    sel = { r, c };
    ledG[r * 8 + c].classList.add("on");
  }
  // 只换当前步骤的文字和小组件，不动速度（切换语言时也用它）
  function renderStep() {
    const s = STEPS[step], T = TX(), txt = T.steps[step];
    $(".kicker", guide).textContent = T.kicker(step + 1, STEPS.length);
    $("h3", guide).textContent = txt.title;
    $(".say", guide).innerHTML = txt.say + (txt.try ? `<p class="try">${txt.try}</p>` : "");
    helper.innerHTML = s.helper ? HELPERS[s.helper](T) : "";
    dots.querySelectorAll("button").forEach((b, j) => (b.title = T.steps[j].title));
    const range = $(".speed input", helper);
    if (range) range.addEventListener("input", () => { touring = false; target = fromShare(range.value / 1000); });
  }
  function go(i) {
    step = Math.max(0, Math.min(STEPS.length - 1, i));
    const s = STEPS[step];
    seen.add(step);
    mode = s.mode;
    renderStep();
    $(".count", guide).textContent = `${step + 1} / ${STEPS.length}`;
    $(".prev", guide).disabled = step === 0;
    $(".next", guide).disabled = step === STEPS.length - 1;
    dots.querySelectorAll("button").forEach((b, j) => { b.toggleAttribute("aria-current", j === step); if (j === step) b.setAttribute("aria-current", "step"); b.classList.toggle("seen", seen.has(j)); });
    stage.classList.toggle("pick", !!s.pick);
    for (const el of svgEl.children) el.classList.toggle("dim", !!s.focus && !focusMatch(el, s.focus));
    // 速度：一进入就到位（自动加速的步骤从起点开始）
    touring = !!s.auto;
    clock = 0;
    target = s.auto ? s.auto[0][1] : s.f;
    lf = Math.log(target);
    phase = s.auto ? RT * 0.5 : phase;
    if (still.matches) { lf = Math.log(16000); integrate(1); draw(); }
    run();
  }
  dots.addEventListener("click", (e) => { const b = e.target.closest("[data-step]"); if (b) go(Number(b.dataset.step)); });
  $(".prev", guide).addEventListener("click", () => go(step - 1));
  $(".next", guide).addEventListener("click", () => go(step + 1));
  stage.addEventListener("click", (ev) => {
    if (!STEPS[step].pick) return;
    const g = ev.target.closest("[data-led]");
    if (!g) return;
    const [r, c] = g.dataset.led.split("_").map(Number);
    select(r, c);
  });
  document.addEventListener("keydown", (ev) => {
    if (ev.target.closest && ev.target.closest("input")) return;
    if (ev.key === "ArrowRight") go(step + 1);
    if (ev.key === "ArrowLeft") go(step - 1);
  });
  new IntersectionObserver((e) => { visible = e[e.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "100px 0px" }).observe(stage);
  $("details.adv").addEventListener("toggle", () => { drawnKey = ""; });
  select(sel.r, sel.c);
  go(0);
  // 右上角切换语言：保留当前步骤和速度，只换文字
  $(".langs").addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-lang]");
    if (!b || b.dataset.lang === LANG) return;
    LANG = b.dataset.lang;
    try { localStorage.setItem("led-lang", LANG); } catch {}
    applyStatic();
    renderStep();
    drawnKey = "";
    draw();
  });
  const btn = $(".theme-btn");
  btn.addEventListener("click", () => {
    const light = document.body.dataset.theme !== "light";
    document.body.dataset.theme = light ? "light" : "dark";
    btn.textContent = light ? "DARK" : "LIGHT";
  });
}
