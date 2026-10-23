// ---------- 页面结构 ----------
const EXTRA_CSS = `
.iso{--led:#ff5a4f;--scope-hi:#e6e6e6;--accent-soft:#ff5a4f22}
.iso[data-theme="light"]{--led:#e5372b;--scope-hi:#18181a;--accent-soft:#e5372b14}
.sig{fill:none;stroke:var(--anatomy-lit);stroke-width:1.15;stroke-linecap:round;stroke-linejoin:round;opacity:0;vector-effect:non-scaling-stroke}
.led-lens{fill:var(--led);stroke:none;opacity:0}
.led-bloom{fill:var(--led);opacity:0;filter:blur(3.5px);pointer-events:none}
.led-sel{fill:none;stroke:var(--anatomy-lit);stroke-width:1;opacity:0;vector-effect:non-scaling-stroke}
.pick [data-led].on .led-sel{opacity:1}
.led-hit{fill:transparent;stroke:none}
.pick .led-hit{cursor:pointer}
.bit{opacity:0;stroke-width:.7;vector-effect:non-scaling-stroke;fill:var(--anatomy-lit);stroke:var(--anatomy-lit)}
.iso-svg>*{transition:opacity .5s var(--anatomy-ease)}
.iso-svg>.dim{opacity:.16}
.iso-stage{outline:none}
.top-btns{position:fixed;top:14px;right:16px;display:flex;gap:8px;z-index:2}
.top-btns button{font:11px var(--anatomy-mono);letter-spacing:.06em;background:var(--anatomy-card);color:var(--anatomy-text);border:1px solid var(--anatomy-lo);padding:6px 10px;cursor:pointer}
.langs{display:flex}
.langs button+button{border-left:none}
.langs button[aria-pressed="true"]{background:var(--anatomy-strong);color:var(--anatomy-card);border-color:var(--anatomy-strong)}
body:not([data-lang="zh"]) .lang-zh,body:not([data-lang="en"]) .lang-en,body:not([data-lang="de"]) .lang-de{display:none}
body{margin:0;background:var(--anatomy-page);color:var(--anatomy-text);font:15px/1.7 ui-sans-serif,system-ui,-apple-system,"Segoe UI","Microsoft YaHei",sans-serif}
.iso-page{width:min(760px,100% - 32px);margin:48px auto 80px}
h1{font-size:22px;color:var(--anatomy-strong);font-weight:650;margin:0 0 4px}
h2{font-size:16px;color:var(--anatomy-strong);font-weight:600;margin:32px 0 6px}
.lede{margin:0 0 4px;color:var(--anatomy-text)}
b,strong{color:var(--anatomy-strong);font-weight:600}
code{font-family:var(--anatomy-mono);font-size:13px;color:var(--anatomy-strong)}
.iso-figure{margin:16px 0 0}
.iso-figure>.iso-plate{padding:34px 14px 30px}
.iso-figure>.iso-plate .iso-plate-corners{inset:12px 14px}
.guide{margin-top:12px;background:var(--anatomy-card);box-shadow:0 0 0 1px var(--anatomy-lo);padding:18px 20px 16px}
.dots{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}
.dots button{font:11px/1 var(--anatomy-mono);color:var(--anatomy-muted);background:none;border:1px solid var(--anatomy-faint);padding:5px 8px;cursor:pointer}
.dots button[aria-current="step"]{color:var(--anatomy-strong);border-color:var(--anatomy-hi)}
.dots button.seen{color:var(--anatomy-text);border-color:var(--anatomy-lo)}
.guide h3{margin:0;font-size:18px;color:var(--anatomy-strong);font-weight:650}
.guide .kicker{font:11px var(--anatomy-mono);letter-spacing:.08em;color:var(--anatomy-muted)}
.guide .say{margin:6px 0 0}
.guide .say p{margin:0 0 8px}
.guide .try{margin:6px 0 0;padding:8px 12px;background:var(--accent-soft);color:var(--anatomy-strong);font-size:14px}
.helper:empty{display:none}
.helper{margin-top:12px}
.nav{display:flex;justify-content:space-between;align-items:center;margin-top:14px;gap:12px}
.nav button{font:14px ui-sans-serif,system-ui,"Microsoft YaHei",sans-serif;padding:8px 18px;cursor:pointer;border:1px solid var(--anatomy-lo);background:var(--anatomy-card);color:var(--anatomy-text)}
.nav button.primary{background:var(--anatomy-strong);color:var(--anatomy-card);border-color:var(--anatomy-strong)}
.nav button:disabled{opacity:.35;cursor:default}
.nav .count{font:12px var(--anatomy-mono);color:var(--anatomy-muted)}
.speed{display:flex;align-items:center;gap:10px;font:12px var(--anatomy-mono);color:var(--anatomy-muted);margin-top:10px}
.speed input{flex:1;accent-color:var(--led)}
.big{display:flex;gap:10px 22px;flex-wrap:wrap;align-items:baseline}
.big .n{font:600 26px/1.2 var(--anatomy-mono);color:var(--anatomy-strong);font-variant-numeric:tabular-nums}
.big .u{font-size:13px;color:var(--anatomy-muted)}
.verdict{display:inline-block;font-size:13px;padding:2px 10px;border:1px solid var(--anatomy-lo);color:var(--anatomy-text)}
.verdict.ok{border-color:var(--led);color:var(--anatomy-strong)}
.bitsbox{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:14px}
.bitsbox .bitc{width:30px;height:34px;display:grid;place-items:center;font:600 18px var(--anatomy-mono);border:1px solid var(--anatomy-lo);color:var(--anatomy-muted)}
.bitsbox .bitc.on{border-color:var(--anatomy-hi);color:var(--anatomy-card);background:var(--anatomy-strong)}
.bitsbox .arrow{font-size:18px;color:var(--anatomy-muted);padding:0 4px}
.bitsbox .res{font:600 18px var(--anatomy-mono);color:var(--anatomy-strong)}
.bar{display:grid;grid-template-columns:repeat(16,1fr);gap:3px;margin:8px 0 4px}
.bar span{height:26px;border:1px solid var(--anatomy-lo);font:10px var(--anatomy-mono);color:var(--anatomy-muted);display:grid;place-items:end center;padding-bottom:1px}
.bar span.on{background:var(--led);border-color:var(--led);color:#fff}
.bar span.now{outline:2px solid var(--anatomy-strong);outline-offset:1px}
.barcap{font-size:13.5px;color:var(--anatomy-text)}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--anatomy-lo);box-shadow:0 0 0 1px var(--anatomy-lo);margin-top:10px}
.stat{background:var(--anatomy-card);padding:10px 12px;min-width:0}
.stat b{display:block;font:600 17px/1.3 var(--anatomy-mono);color:var(--anatomy-strong);font-variant-numeric:tabular-nums;white-space:nowrap}
.stat>span{display:block;font-size:12px;color:var(--anatomy-muted);line-height:1.45;margin-top:2px}
@media (max-width:620px){.stats{grid-template-columns:repeat(2,1fr)}.bar span{font-size:0}}
.terms{width:100%;border-collapse:collapse;font-size:14px}
.terms td{padding:9px 10px;border-top:1px solid var(--anatomy-faint);vertical-align:top}
.terms td:first-child{white-space:nowrap;color:var(--anatomy-strong);font-weight:600;width:1%}
details.adv{margin-top:28px;border-top:1px solid var(--anatomy-faint);padding-top:10px}
details.adv summary{cursor:pointer;color:var(--anatomy-strong);font-weight:600}
.scope-svg{display:block;width:100%;height:auto;font-family:var(--anatomy-mono)}
.scope-svg .lane{fill:var(--anatomy-muted);font-size:10px}
.scope-svg .note{fill:var(--anatomy-muted);font-size:9.5px}
.scope-svg .note.sel{fill:var(--scope-hi)}
.scope-svg .grid{stroke:var(--anatomy-faint);stroke-width:1}
.scope-svg .wave{fill:none;stroke:var(--anatomy-mid);stroke-width:1.2;stroke-linejoin:round}
.scope-svg .wave.sel{stroke:var(--scope-hi);stroke-width:1.6}
.scope-svg .fillon{fill:var(--anatomy-mid);opacity:.12}
.scope-svg .fillon.sel{fill:var(--led);opacity:.22}
.scope-svg .bus{fill:none;stroke:var(--anatomy-mid);stroke-width:1}
.scope-svg .cnt{fill:var(--anatomy-text);font-size:8.5px}
.scope-svg .cursor{stroke:var(--led);stroke-width:1.4}
.scope-svg .blank{fill:var(--anatomy-faint);opacity:.5}
`;


const plate1 = k.plateHtml({
  fig: "Fig 1",
  title: " ",
  hint: " ",
  readout: "",
  body: `<div class="iso-stage" tabindex="-1">${svg}</div>`,
}).replace("</div></figure>", `</div><section class="guide" aria-live="polite">
<div class="dots"></div>
<div class="kicker"></div><h3></h3><div class="say"></div><div class="helper"></div>
<div class="nav"><button type="button" class="prev"></button><span class="count"></span><button type="button" class="next primary"></button></div>
</section></figure>`);

const plate2 = k.plateHtml({
  fig: "Fig 2",
  title: " ",
  hint: " ",
  readout: "",
  caption: " ",
  body: `<div class="scope"></div>`,
});

document.head.insertAdjacentHTML("beforeend", `<style>${k.ISO_CSS}${EXTRA_CSS}</style>`);
const prefersLight = !matchMedia("(prefers-color-scheme: dark)").matches;
document.body.className = "iso";
document.body.dataset.theme = prefersLight ? "light" : "dark";
document.body.innerHTML = `<div class="top-btns"><div class="langs" role="group" aria-label="Language">${LANGS.map(([code, name]) => `<button type="button" data-lang="${code}" lang="${I18N[code].htmlLang}">${name}</button>`).join("")}</div><button class="theme-btn" type="button">${prefersLight ? "DARK" : "LIGHT"}</button></div><main class="iso-page">
<h1 data-i18n="h1"></h1>
<p class="lede" data-i18n="lede"></p>
${plate1}
<h2 data-i18n="termsTitle"></h2>
<table class="terms"></table>
<details class="adv"><summary data-i18n="advSummary"></summary>
${plate2}
<p class="lede" data-i18n="advText"></p>
</details>
</main>`;

// 把页面上的固定文字换成当前语言
function applyStatic() {
  const T = TX();
  document.documentElement.lang = T.htmlLang;
  document.title = T.docTitle;
  document.body.dataset.lang = LANG;
  document.querySelectorAll("[data-i18n]").forEach((el) => (el.innerHTML = T[el.dataset.i18n]));
  document.querySelector(".terms").innerHTML = T.terms.map(([term, def]) => `<tr><td>${term}</td><td>${def}</td></tr>`).join("");
  const [fig1, fig2] = document.querySelectorAll(".iso-figure");
  fig1.querySelector('[data-corner="title"]').textContent = T.fig1Title;
  fig1.querySelector('[data-corner="hint"]').textContent = T.fig1Hint;
  fig2.querySelector('[data-corner="title"]').textContent = T.fig2Title;
  fig2.querySelector('[data-corner="hint"]').textContent = T.fig2Hint;
  fig2.querySelector(".iso-caption").textContent = T.fig2Caption;
  document.querySelector(".guide .prev").textContent = T.prev;
  document.querySelector(".guide .next").textContent = T.next;
  document.querySelectorAll(".langs button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === LANG)));
}
applyStatic();
