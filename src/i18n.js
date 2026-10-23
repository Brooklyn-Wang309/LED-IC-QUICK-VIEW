// ---------- 文案：中文 / Deutsch ----------
const I18N = {
  zh: {
    htmlLang: "zh-CN",
    switchTo: "DE",
    switchLabel: "Auf Deutsch umschalten",
    docTitle: "LED 屏是怎么亮起来的？",
    h1: "LED 屏是怎么亮起来的？",
    lede: "零基础也能看懂：跟着下面 9 步，认识 LED 屏里的两颗关键芯片——<b>译码 IC</b> 和 <b>LED 驱动 IC</b>。每一步只讲一件事，图上会把相关部分高亮。",
    fig1Title: "LED 点阵板",
    fig1Hint: "按“下一步”跟着看",
    prev: "← 上一步",
    next: "下一步 →",
    kicker: (i, n) => `第 ${i} 步 / 共 ${n} 步`,
    termsTitle: "术语小抄",
    terms: [
      ["LED", "发光二极管。电流只能从一个方向流过它，流过时就亮。"],
      ["MCU", "单片机，整块板的“大脑”，负责发出各种指令。"],
      ["译码 IC", "“8 选 1 开关”。收到一个 0–7 的号码，就打开对应的那一行。"],
      ["LED 驱动 IC", "管“列”的芯片：决定每一列亮不亮、亮多久，并保证电流恒定（恒流）。"],
      ["行扫", "一次只亮一行，8 行轮流亮。8 行轮流叫“1/8 扫”。"],
      ["刷新率", "一秒钟把整幅画面（8 行）轮完多少遍，单位 Hz。≥ 约 100 Hz 时眼睛看不出闪。"],
      ["PWM / 占空比", "靠“亮一会儿、灭一会儿”来调亮度。亮的时间占的比例就是占空比，比例越大越亮。"],
      ["GCLK", "灰度时钟，驱动 IC 的“节拍器”。每一拍计数器 +1，用来数亮了几格。"],
    ],
    advSummary: "进阶：一行的完整时序图（给想深入的人）",
    advText: `刷新率 = GCLK 频率 ÷（每行拍数 × 行数）= GCLK ÷ (${RT} × 8)。真实芯片常用 12–16 位灰度、1/16–1/32 扫，直接这样算 GCLK 会高得离谱，所以 MBI5153、ICN2053 这类芯片会把一个 PWM 周期“打散”成很多小段穿插在各行之间（scrambled PWM），在同样的 GCLK 下把刷新率提高几十倍。本页为了好懂，用 4 位灰度、不打散。`,
    fig2Title: "一行的时序",
    fig2Hint: "示波器视角",
    fig2Caption: "横轴是时间，一格 = 1 个 GCLK。每行先用 1 拍换行（LE 锁存新数据、地址切到下一行），之后 16 拍是 PWM：计数器 0→15，OUTn 在“计数 < 该通道灰度值 GS”时导通。导通拍数 = GS，所以行内占空比 = GS ÷ 16。",
    steps: [
      {
        title: "64 颗灯，只用 16 根线",
        say: `<p>板子中间是 <b>64 颗 LED 小灯</b>，排成 8 行 × 8 列，现在显示的是一颗心。</p>
<p>如果每颗灯都单独拉一根线来控制，需要 64 根线。可这块板只用了 <b>8 根行线 + 8 根列线 = 16 根</b>。</p>
<p>秘密在两颗芯片：左边的 <b>译码 IC</b> 管“行”，上面的 <b>驱动 IC</b> 管“列”。最上面的 <b>MCU</b>（单片机）是总指挥。接下来一步一步看它们怎么配合。</p>`,
      },
      {
        title: "一颗灯是怎么亮的",
        say: `<p>LED 像一根<b>单向水管</b>：电流从<b>行线</b>流进来，穿过灯，再从<b>列线</b>流走。</p>
<p>所以必须同时满足两件事：<b>它所在的行通了电</b>，<b>它所在的列也接通了</b>。行和列交叉的那一颗才会亮。</p>`,
        try: "点一下板上任意一颗灯，看看是哪根行线、哪根列线在工作。",
      },
      {
        title: "译码 IC：决定亮哪一行",
        say: `<p>左边这颗是 <b>译码 IC</b>（常见型号 74HC138）。MCU 只用 <b>3 根线</b>给它报一个号码：每根线有电是 1、没电是 0，3 根线能组合出 000～111 共 <b>8 个号码</b>。</p>
<p>译码 IC 收到号码，就<b>只打开对应的那一行</b>，其余 7 行全部关闭——就像电梯里按楼层按钮，一次只到一层。</p>`,
        try: "看下面的 3 个格子：号码一变，板子上亮的那一行就跟着换。",
      },
      {
        title: "驱动 IC：决定这一行哪几颗亮",
        say: `<p>上面这颗是 <b>LED 驱动 IC</b>，它管 8 根列线，每根列线后面都有一个“电流阀门”。</p>
<p>MCU 先把“哪几列要亮”的数据<b>一位一位</b>送进去（看那串沿线移动的小圆点），驱动 IC 收齐后，一起打开对应的阀门。</p>
<p>它还有个本事叫<b>恒流</b>：不管电源电压怎么波动，每颗灯的电流都稳定在设定值（例如 20 mA），所以灯和灯之间亮度一致。</p>`,
      },
      {
        title: "行扫：一行一行轮流亮",
        say: `<p>问题来了：译码 IC 一次只能打开<b>一行</b>，那整颗心怎么显示？</p>
<p>答案是<b>轮流</b>：先亮第 0 行，再亮第 1 行……亮完第 7 行再从头来。每换一行，驱动 IC 也同时换上这一行的数据。</p>
<p>这就叫<b>行扫描</b>（行扫）。8 行轮流叫 <b>1/8 扫</b>——每一行只有 1/8 的时间在亮。</p>`,
      },
      {
        title: "扫得够快，眼睛就被“骗”了",
        say: `<p>把轮流的速度加快。快到一定程度，眼睛跟不上，就会把 8 行“叠”在一起，看到一整颗心。这叫<b>视觉暂留</b>。</p>
<p>一秒钟把 8 行完整轮完多少遍，叫<b>刷新率</b>，单位 Hz。低于约 50 Hz 会明显闪；<b>100 Hz 以上</b>看起来就稳定了。</p>`,
        try: "它会自动加速；你也可以拖动滑块，找找从“闪”到“不闪”的那个点。",
      },
      {
        title: "亮度：PWM 与占空比",
        say: `<p>LED 只有<b>亮、灭</b>两种状态，那“半亮”怎么做？</p>
<p>办法是<b>快速开关</b>：把一段时间切成 16 小格，比如亮 12 格、灭 4 格。亮的比例 12 ÷ 16 = 75%，开关快到眼睛分不出时，看起来就是 75% 的亮度。</p>
<p>这个“亮的比例”叫<b>占空比</b>，这种调亮度的方法叫 <b>PWM</b>（脉冲宽度调制）。注意：电流大小一直不变，变的只是亮多久。</p>`,
        try: "点不同的灯比较它们亮几格。慢速时能看到灯一闪一闪；把滑块拖到右边，就变成稳定的亮度。",
      },
      {
        title: "GCLK：数格子的节拍器",
        say: `<p>那 16 小格由谁来数？就是 <b>GCLK</b>（灰度时钟）。它像<b>节拍器</b>，每“嘀”一下，驱动 IC 里的计数器就 +1：0、1、2……15，然后进入下一行。</p>
<p>每一列都记着自己的一个数字，叫<b>灰度值</b>（0～15）。规则只有一条：<b>计数还没到这个数字，灯亮；到了，灯灭</b>。数字越大，亮的格子越多，灯越亮。</p>
<p>GCLK 越快，一行用的时间越短，<b>刷新率就越高</b>。</p>`,
        try: "盯着下面的计数器：数到这颗灯的灰度值时，它就熄灭。点同一行的其他灯比较一下。",
      },
      {
        title: "全部合起来",
        say: `<ol style="margin:0;padding-left:20px">
<li><b>MCU</b> 把每一行的灰度数据送进<b>驱动 IC</b>；</li>
<li><b>译码 IC</b> 按号码轮流打开每一行——<b>行扫</b>；</li>
<li>每一行的时间里，<b>GCLK</b> 打 16 拍，驱动 IC 让每列亮“灰度值”那么多拍——<b>PWM 占空比</b>决定亮度；</li>
<li>8 行轮完是一帧，一秒能轮很多遍——<b>刷新率</b>够高，眼睛就看到一颗有明有暗、不闪的心。</li></ol>`,
        try: "自由玩：调速度、点灯看数值。想看工程师用的时序图，展开页面最下面的“进阶”。",
      },
    ],
    // 角标
    roRefresh: (hz) => `刷新 ${hz} Hz`,
    roLit: (r) => `正在亮：第 ${r} 行`,
    roPowered: (r) => `第 ${r} 行通电`,
    roSwitch: " · 换行",
    roCount: (n) => ` · 计数 ${n}`,
    // 小组件
    slow: "慢",
    fast: "快",
    speedScan: "扫描速度",
    speedSwitch: "开关速度",
    addrLabel: "MCU 报的号码：",
    addrRes: (r) => `第 ${r} 行打开`,
    colsLabel: (r) => `第 ${r} 行的数据：`,
    colName: (c) => `列${c}`,
    colsNote: (r, n) => `1 = 打开这一列，0 = 关闭。所以第 ${r} 行亮 ${n} 颗灯。`,
    scanLabel: "正在亮：",
    scanFast: "太快了，看不清在亮哪行",
    scanRow: (r) => `第 ${r} 行`,
    refreshUnit: "刷新率（每秒轮完几遍）",
    verdict: ["很慢：能看到一行一行在走", "会闪烁", "轻微闪烁", "稳定不闪 ✓"],
    capZero: (r, c) => `第 ${r} 行第 ${c} 列：灰度值 0，一格都不亮。换一颗心形里的灯试试。`,
    cap: (r, c, g, pct) => `第 ${r} 行第 ${c} 列：灰度值 <b>${g}</b> → 16 格里亮 ${g} 格 → 占空比 <b>${pct}%</b>`,
    capSwitch: "　（换行：计数清零）",
    capCount: (n, g, on) => `　｜ 计数 ${n} ${on ? "&lt;" : "≥"} ${g} → 灯${on ? "<b>亮</b>" : "灭"}`,
    countLabel: "GCLK 计数",
    countSwitch: "换行",
    refreshLabel: "刷新率",
    statF: "GCLK：每拍计数 +1",
    statScan: (rr) => `行扫：行频 ${rr}，每行亮 1/8 时间`,
    statRefresh: `刷新率 = GCLK ÷ (${RT}×8)`,
    statDuty: (r, c, g) => `所选灯（${r},${c}）GS=${g}：行内 → 算上行扫`,
    // 时序图
    lanes: ["GCLK", "LE", "行选", "计数"],
    busRow: (r, a) => `第 ${r} 行 · A=${a}`,
    busSwitch: "换",
    scopeRo: (r) => `第 ${r} 行 · 1 格 = 1 GCLK`,
  },

  en: {
    htmlLang: "en",
    docTitle: "How does an LED display light up?",
    h1: "How does an LED display light up?",
    lede: "No background needed: in 9 steps you'll meet the two key chips inside an LED display – the <b>decoder IC</b> and the <b>LED driver IC</b>. Each step explains one thing, and the board highlights the parts that matter.",
    fig1Title: "LED matrix board",
    fig1Hint: "Click “Next” to follow along",
    prev: "← Back",
    next: "Next →",
    kicker: (i, n) => `Step ${i} of ${n}`,
    termsTitle: "Cheat sheet",
    terms: [
      ["LED", "Light-emitting diode. Current can only flow through it in one direction – and when it does, it lights up."],
      ["MCU", "Microcontroller – the “brain” of the board that gives all the commands."],
      ["Decoder IC", "A “1-of-8 switch”: it receives a number from 0 to 7 and turns on the matching row."],
      ["LED driver IC", "The chip for the columns: it decides whether and how long each column is on, and keeps the current constant (constant current)."],
      ["Row scanning", "Only one row is lit at a time; the 8 rows take turns. With 8 rows this is called “1/8 scan”."],
      ["Refresh rate", "How many times per second the whole picture (all 8 rows) is drawn, in Hz. Above about 100 Hz the eye sees no flicker."],
      ["PWM / duty cycle", "Brightness by “on for a bit, off for a bit”. The share of on-time is the duty cycle – the larger it is, the brighter the LED."],
      ["GCLK", "Grayscale clock, the driver IC's “metronome”. Every tick adds 1 to a counter, which is how the lit slots are counted."],
    ],
    advSummary: "Advanced: the full timing of one row",
    advText: `Refresh rate = GCLK frequency ÷ (ticks per row × rows) = GCLK ÷ (${RT} × 8). Real chips usually use 12–16-bit grayscale and 1/16 to 1/32 scan, which would make the required GCLK absurdly high if calculated this way. Drivers such as the MBI5153 or ICN2053 therefore split one PWM cycle into many short segments spread across the rows (scrambled PWM), multiplying the refresh rate for the same GCLK. To keep things easy to follow, this page uses 4 bits without scrambling.`,
    fig2Title: "Timing of one row",
    fig2Hint: "Oscilloscope view",
    fig2Caption: "Time runs to the right; one cell = 1 GCLK. Each row starts with 1 tick for the row change (LE latches the new data, the address moves to the next row). Then come 16 PWM ticks: the counter runs from 0 to 15, and OUTn is on while “counter < grayscale value GS” of that channel. So the number of on-ticks equals GS, and the duty cycle within the row is GS ÷ 16.",
    steps: [
      {
        title: "64 LEDs, only 16 wires",
        say: `<p>In the middle of the board are <b>64 small LEDs</b> in 8 rows × 8 columns – right now they show a heart.</p>
<p>Wiring every LED separately would take 64 wires. This board gets by with <b>8 row wires + 8 column wires = 16</b>.</p>
<p>The secret is two chips: the <b>decoder IC</b> on the left handles the rows, the <b>driver IC</b> at the top handles the columns. The <b>MCU</b> (microcontroller) at the very top is the conductor. Let's see, step by step, how they work together.</p>`,
      },
      {
        title: "How a single LED lights up",
        say: `<p>An LED is like a <b>one-way water pipe</b>: current flows in through the <b>row wire</b>, passes through the LED and flows out through the <b>column wire</b>.</p>
<p>So two things must be true at once: <b>its row is powered</b> and <b>its column is switched on</b>. Only the LED where the two cross lights up.</p>`,
        try: "Click any LED on the board and see which row wire and which column wire are working.",
      },
      {
        title: "Decoder IC: which row is on?",
        say: `<p>On the left is the <b>decoder IC</b> (a common part is the 74HC138). The MCU tells it a number using just <b>3 wires</b>: each wire is either on (1) or off (0). Three wires give 000 to 111 – exactly <b>8 numbers</b>.</p>
<p>The decoder then turns on <b>only the matching row</b> and keeps the other 7 off – like the floor buttons in a lift: one floor at a time.</p>`,
        try: "Watch the 3 boxes below: as soon as the number changes, the lit row on the board moves with it.",
      },
      {
        title: "Driver IC: which LEDs in the row are on?",
        say: `<p>At the top is the <b>LED driver IC</b>. It looks after the 8 column wires; behind each one sits a kind of “current valve”.</p>
<p>First the MCU shifts in, <b>bit by bit</b>, which columns should light (the little dots travelling along the wire). Once the driver has all of them, it opens the matching valves together.</p>
<p>It also provides <b>constant current</b>: however the supply voltage wobbles, each LED gets exactly the set current (e.g. 20 mA) – so they all look equally bright.</p>`,
      },
      {
        title: "Row scanning: one row after another",
        say: `<p>Now the big question: the decoder can only turn on <b>one row</b> at a time. So how does the whole heart appear?</p>
<p>The answer: <b>take turns</b>. First row 0 lights, then row 1 … up to row 7, then it starts again. At every row change the driver also gets that row's data.</p>
<p>This is called <b>row scanning</b> (multiplexing). With 8 rows it's a <b>1/8 scan</b> – each row is lit only 1/8 of the time.</p>`,
      },
      {
        title: "Fast enough – and the eye is fooled",
        say: `<p>Now let's speed it up. Past a certain speed the eye can't keep up and “stacks” the 8 rows into one whole heart. This is called <b>persistence of vision</b>.</p>
<p>How many times per second all 8 rows are fully drawn is the <b>refresh rate</b>, in Hz. Below about 50 Hz it clearly flickers; <b>above about 100 Hz</b> the picture looks steady.</p>`,
        try: "It speeds up on its own – or drag the slider and find the point where the flicker disappears.",
      },
      {
        title: "Brightness: PWM and duty cycle",
        say: `<p>An LED only knows <b>on</b> and <b>off</b>. So how do you get “half bright”?</p>
<p>The trick is <b>switching quickly</b>: split a stretch of time into 16 slots – say 12 on and 4 off. The on-share is 12 ÷ 16 = 75 %; switch fast enough and the eye sees 75 % brightness.</p>
<p>This on-share is the <b>duty cycle</b>, and the method is called <b>PWM</b> (pulse-width modulation). Note: the current itself never changes – only how long it flows.</p>`,
        try: "Click different LEDs and compare how many slots they're on. At slow speed you see them blink; drag the slider to the right and it turns into steady brightness.",
      },
      {
        title: "GCLK: the metronome that counts the slots",
        say: `<p>Who counts the 16 slots? That's the <b>GCLK</b> (grayscale clock). It's like a <b>metronome</b>: with every “tick” a counter inside the driver IC goes up by 1 – 0, 1, 2 … 15, then the next row begins.</p>
<p>Each column remembers its own number, the <b>grayscale value</b> (0–15). There's just one rule: <b>while the counter is below that number, the LED is on; once it reaches it, the LED goes off.</b> The bigger the number, the more slots are lit and the brighter the LED.</p>
<p>The faster the GCLK, the shorter each row takes – and the <b>higher the refresh rate</b>.</p>`,
        try: "Watch the counter below: when it reaches this LED's grayscale value, the LED goes off. Click other LEDs in the same row to compare.",
      },
      {
        title: "Putting it all together",
        say: `<ol style="margin:0;padding-left:20px">
<li>The <b>MCU</b> shifts each row's grayscale data into the <b>driver IC</b>;</li>
<li>the <b>decoder IC</b> turns the rows on one after another – <b>row scanning</b>;</li>
<li>during each row the <b>GCLK</b> ticks 16 times, and the driver keeps each column on for as many ticks as its grayscale value – the <b>duty cycle</b> sets the brightness;</li>
<li>8 rows make one frame, drawn many times per second – with a high enough <b>refresh rate</b> the eye sees a steady heart with bright and dim parts.</li></ol>`,
        try: "Play freely: change the speed, click LEDs, read the numbers. The engineer's timing diagram is under “Advanced” at the bottom of the page.",
      },
    ],
    roRefresh: (hz) => `Refresh ${hz} Hz`,
    roLit: (r) => `Lit: row ${r}`,
    roPowered: (r) => `Row ${r} powered`,
    roSwitch: " · row change",
    roCount: (n) => ` · count ${n}`,
    slow: "slow",
    fast: "fast",
    speedScan: "Scan speed",
    speedSwitch: "Switching speed",
    addrLabel: "Number from the MCU:",
    addrRes: (r) => `row ${r} on`,
    colsLabel: (r) => `Data for row ${r}:`,
    colName: (c) => `C${c}`,
    colsNote: (r, n) => `1 = column on, 0 = column off. So ${n} LEDs light up in row ${r}.`,
    scanLabel: "Lit now:",
    scanFast: "too fast to tell which row",
    scanRow: (r) => `row ${r}`,
    refreshUnit: "refresh rate (full passes per second)",
    verdict: ["very slow: you can see the rows move", "flickers", "slight flicker", "steady, no flicker ✓"],
    capZero: (r, c) => `Row ${r}, column ${c}: grayscale value 0 – no slot is lit. Try an LED inside the heart.`,
    cap: (r, c, g, pct) => `Row ${r}, column ${c}: grayscale value <b>${g}</b> → ${g} of 16 slots on → duty cycle <b>${pct} %</b>`,
    capSwitch: "　(row change: counter reset)",
    capCount: (n, g, on) => `　| count ${n} ${on ? "&lt;" : "≥"} ${g} → LED ${on ? "<b>on</b>" : "off"}`,
    countLabel: "GCLK count",
    countSwitch: "change",
    refreshLabel: "Refresh rate",
    statF: "GCLK: every tick counts +1",
    statScan: (rr) => `Row scan: row rate ${rr}, each row lit 1/8 of the time`,
    statRefresh: `Refresh = GCLK ÷ (${RT}×8)`,
    statDuty: (r, c, g) => `Selected LED (${r},${c}) GS=${g}: within row → with scanning`,
    lanes: ["GCLK", "LE", "Row", "Count"],
    busRow: (r, a) => `Row ${r} · A=${a}`,
    busSwitch: "Δ",
    scopeRo: (r) => `Row ${r} · 1 cell = 1 GCLK`,
  },

  de: {
    htmlLang: "de",
    switchTo: "中文",
    switchLabel: "切换到中文",
    docTitle: "Wie leuchtet ein LED-Display?",
    h1: "Wie leuchtet ein LED-Display?",
    lede: "Ganz ohne Vorkenntnisse: In 9 Schritten lernst du die zwei wichtigsten Chips in einem LED-Display kennen – den <b>Decoder-IC</b> und den <b>LED-Treiber-IC</b>. Jeder Schritt erklärt genau eine Sache, und auf der Platine wird hervorgehoben, worum es gerade geht.",
    fig1Title: "LED-Matrix-Platine",
    fig1Hint: "Mit „Weiter“ durchklicken",
    prev: "← Zurück",
    next: "Weiter →",
    kicker: (i, n) => `Schritt ${i} von ${n}`,
    termsTitle: "Begriffe kurz erklärt",
    terms: [
      ["LED", "Leuchtdiode. Strom kann nur in eine Richtung hindurchfließen – dann leuchtet sie."],
      ["MCU", "Mikrocontroller, das „Gehirn“ der Platine, das alle Befehle gibt."],
      ["Decoder-IC", "Ein „1-aus-8-Schalter“: Er bekommt eine Nummer von 0 bis 7 und schaltet die passende Zeile ein."],
      ["LED-Treiber-IC", "Der Chip für die Spalten: Er entscheidet, ob und wie lange jede Spalte leuchtet, und hält den Strom konstant (Konstantstrom)."],
      ["Zeilen-Multiplexing", "Es leuchtet immer nur eine Zeile; die 8 Zeilen kommen der Reihe nach dran. Bei 8 Zeilen heißt das „1/8-Scan“."],
      ["Bildwiederholrate", "Wie oft pro Sekunde das ganze Bild (alle 8 Zeilen) durchlaufen wird, in Hz. Ab etwa 100 Hz sieht das Auge kein Flimmern mehr."],
      ["PWM / Tastgrad", "Helligkeit durch „kurz an, kurz aus“. Der Anteil der Einschaltzeit ist der Tastgrad – je größer, desto heller."],
      ["GCLK", "Graustufentakt, das „Metronom“ des Treiber-ICs. Jeder Takt erhöht einen Zähler um 1; so werden die leuchtenden Felder gezählt."],
    ],
    advSummary: "Für Fortgeschrittene: das komplette Timing einer Zeile",
    advText: `Bildwiederholrate = GCLK-Frequenz ÷ (Takte pro Zeile × Zeilen) = GCLK ÷ (${RT} × 8). Echte Chips arbeiten meist mit 12–16 Bit Graustufen und 1/16- bis 1/32-Scan – so gerechnet wäre der nötige GCLK absurd hoch. Treiber wie MBI5153 oder ICN2053 zerlegen den PWM-Zyklus deshalb in viele kurze Abschnitte, die über die Zeilen verteilt werden (Scrambled PWM), und erreichen so beim gleichen GCLK eine um ein Vielfaches höhere Bildwiederholrate. Diese Seite nutzt der Verständlichkeit halber 4 Bit ohne Aufteilung.`,
    fig2Title: "Timing einer Zeile",
    fig2Hint: "Oszilloskop-Ansicht",
    fig2Caption: "Die Zeit läuft nach rechts, ein Feld = 1 GCLK. Jede Zeile beginnt mit 1 Takt für den Zeilenwechsel (LE übernimmt die neuen Daten, die Adresse springt zur nächsten Zeile). Danach folgen 16 PWM-Takte: Der Zähler läuft von 0 bis 15, und OUTn ist durchgeschaltet, solange „Zähler < Graustufenwert GS“ dieses Kanals gilt. Die Zahl der Einschalttakte ist also GS, der Tastgrad innerhalb der Zeile GS ÷ 16.",
    steps: [
      {
        title: "64 LEDs, aber nur 16 Leitungen",
        say: `<p>In der Mitte der Platine sitzen <b>64 kleine LEDs</b> in 8 Zeilen × 8 Spalten – gerade zeigen sie ein Herz.</p>
<p>Würde man jede LED einzeln verdrahten, bräuchte man 64 Leitungen. Diese Platine kommt mit <b>8 Zeilenleitungen + 8 Spaltenleitungen = 16</b> aus.</p>
<p>Das Geheimnis sind zwei Chips: Der <b>Decoder-IC</b> links ist für die Zeilen zuständig, der <b>Treiber-IC</b> oben für die Spalten. Ganz oben sitzt der <b>MCU</b> (Mikrocontroller) – der Dirigent. Schauen wir Schritt für Schritt, wie sie zusammenspielen.</p>`,
      },
      {
        title: "Wie leuchtet eine einzelne LED?",
        say: `<p>Eine LED ist wie ein <b>Wasserrohr mit Rückschlagventil</b>: Der Strom fließt über die <b>Zeilenleitung</b> hinein, durch die LED hindurch und über die <b>Spaltenleitung</b> wieder hinaus.</p>
<p>Es müssen also zwei Dinge gleichzeitig stimmen: <b>Ihre Zeile hat Spannung</b> und <b>ihre Spalte ist durchgeschaltet</b>. Nur die LED an der Kreuzung leuchtet.</p>`,
        try: "Klicke auf eine beliebige LED und sieh nach, welche Zeilen- und welche Spaltenleitung gerade arbeiten.",
      },
      {
        title: "Decoder-IC: Welche Zeile leuchtet?",
        say: `<p>Links sitzt der <b>Decoder-IC</b> (typisch: 74HC138). Der MCU nennt ihm über nur <b>3 Leitungen</b> eine Nummer: Jede Leitung ist entweder an (1) oder aus (0). Drei Leitungen ergeben 000 bis 111 – genau <b>8 Nummern</b>.</p>
<p>Der Decoder schaltet dann <b>nur die passende Zeile</b> ein, die anderen 7 bleiben aus – wie die Stockwerkstasten im Aufzug: immer nur ein Stockwerk auf einmal.</p>`,
        try: "Achte auf die 3 Kästchen unten: Sobald sich die Nummer ändert, springt die leuchtende Zeile mit.",
      },
      {
        title: "Treiber-IC: Welche LEDs der Zeile leuchten?",
        say: `<p>Oben sitzt der <b>LED-Treiber-IC</b>. Er kümmert sich um die 8 Spaltenleitungen; hinter jeder steckt eine Art „Stromventil“.</p>
<p>Der MCU schiebt ihm zuerst <b>Bit für Bit</b> hinein, welche Spalten leuchten sollen (die kleinen Punkte, die entlang der Leitung wandern). Hat der Treiber alles beisammen, öffnet er die passenden Ventile gleichzeitig.</p>
<p>Außerdem liefert er <b>Konstantstrom</b>: Egal wie die Versorgungsspannung schwankt, durch jede LED fließt genau der eingestellte Strom (z. B. 20 mA) – deshalb leuchten alle gleich hell.</p>`,
      },
      {
        title: "Multiplexing: eine Zeile nach der anderen",
        say: `<p>Jetzt die entscheidende Frage: Der Decoder kann immer nur <b>eine Zeile</b> einschalten. Wie entsteht dann das ganze Herz?</p>
<p>Die Antwort: <b>der Reihe nach</b>. Erst leuchtet Zeile 0, dann Zeile 1 … bis Zeile 7, dann geht es von vorn los. Bei jedem Zeilenwechsel bekommt der Treiber die Daten der neuen Zeile.</p>
<p>Das nennt man <b>Zeilen-Multiplexing</b> (Zeilenscan). Bei 8 Zeilen spricht man vom <b>1/8-Scan</b> – jede Zeile leuchtet nur 1/8 der Zeit.</p>`,
      },
      {
        title: "Schnell genug – und das Auge wird getäuscht",
        say: `<p>Jetzt wird es schneller. Ab einem gewissen Tempo kommt das Auge nicht mehr mit und „stapelt“ die 8 Zeilen zu einem ganzen Herz. Das ist die <b>Trägheit des Auges</b>.</p>
<p>Wie oft pro Sekunde alle 8 Zeilen komplett durchlaufen werden, heißt <b>Bildwiederholrate</b> (in Hz). Unter etwa 50 Hz flimmert es deutlich, <b>ab etwa 100 Hz</b> wirkt das Bild ruhig.</p>`,
        try: "Es beschleunigt von selbst – du kannst aber auch den Regler ziehen und den Punkt suchen, an dem das Flimmern verschwindet.",
      },
      {
        title: "Helligkeit: PWM und Tastgrad",
        say: `<p>Eine LED kennt nur <b>an</b> und <b>aus</b>. Wie bekommt man dann „halb hell“?</p>
<p>Der Trick ist <b>schnelles Ein- und Ausschalten</b>: Man teilt eine Zeitspanne in 16 Felder, z. B. 12 Felder an, 4 Felder aus. Der Anteil 12 ÷ 16 = 75 % – schaltet man schnell genug, sieht das Auge 75 % Helligkeit.</p>
<p>Dieser Einschaltanteil heißt <b>Tastgrad</b> (engl. duty cycle), das Verfahren <b>PWM</b> (Pulsweitenmodulation). Wichtig: Die Stromstärke bleibt immer gleich – nur die Dauer ändert sich.</p>`,
        try: "Klicke verschiedene LEDs an und vergleiche, wie viele Felder sie leuchten. Langsam siehst du das Blinken; ziehst du den Regler nach rechts, wird daraus eine ruhige Helligkeit.",
      },
      {
        title: "GCLK: das Metronom, das die Felder zählt",
        say: `<p>Wer zählt die 16 Felder? Das ist der <b>GCLK</b> (Graustufentakt). Er ist wie ein <b>Metronom</b>: Bei jedem „Tick“ zählt ein Zähler im Treiber-IC um 1 weiter – 0, 1, 2 … 15, dann kommt die nächste Zeile.</p>
<p>Jede Spalte merkt sich eine eigene Zahl, den <b>Graustufenwert</b> (0–15). Es gibt nur eine Regel: <b>Solange der Zähler kleiner als diese Zahl ist, leuchtet die LED; erreicht er sie, geht sie aus.</b> Je größer die Zahl, desto mehr Felder leuchten und desto heller ist die LED.</p>
<p>Je schneller der GCLK, desto kürzer dauert eine Zeile – und desto <b>höher ist die Bildwiederholrate</b>.</p>`,
        try: "Beobachte den Zähler unten: Sobald er den Graustufenwert der LED erreicht, geht sie aus. Klicke zum Vergleich andere LEDs derselben Zeile an.",
      },
      {
        title: "Alles zusammen",
        say: `<ol style="margin:0;padding-left:20px">
<li>Der <b>MCU</b> schiebt die Graustufendaten jeder Zeile in den <b>Treiber-IC</b>;</li>
<li>der <b>Decoder-IC</b> schaltet die Zeilen der Reihe nach ein – <b>Zeilen-Multiplexing</b>;</li>
<li>während jeder Zeile gibt der <b>GCLK</b> 16 Takte vor, und der Treiber lässt jede Spalte so viele Takte leuchten, wie ihr Graustufenwert angibt – der <b>Tastgrad</b> bestimmt die Helligkeit;</li>
<li>8 Zeilen ergeben ein Bild, und das viele Male pro Sekunde – ist die <b>Bildwiederholrate</b> hoch genug, sieht das Auge ein flimmerfreies Herz mit hellen und dunklen Stellen.</li></ol>`,
        try: "Probier frei herum: Tempo ändern, LEDs anklicken, Werte ablesen. Das Timing-Diagramm für Profis findest du ganz unten unter „Für Fortgeschrittene“.",
      },
    ],
    roRefresh: (hz) => `Wiederholrate ${hz} Hz`,
    roLit: (r) => `Leuchtet: Zeile ${r}`,
    roPowered: (r) => `Zeile ${r} hat Spannung`,
    roSwitch: " · Wechsel",
    roCount: (n) => ` · Zähler ${n}`,
    slow: "langsam",
    fast: "schnell",
    speedScan: "Scan-Tempo",
    speedSwitch: "Schalttempo",
    addrLabel: "Nummer vom MCU:",
    addrRes: (r) => `Zeile ${r} ein`,
    colsLabel: (r) => `Daten für Zeile ${r}:`,
    colName: (c) => `Sp.${c}`,
    colsNote: (r, n) => `1 = Spalte an, 0 = Spalte aus. In Zeile ${r} leuchten also ${n} LEDs.`,
    scanLabel: "Leuchtet gerade:",
    scanFast: "zu schnell – Zeile nicht mehr erkennbar",
    scanRow: (r) => `Zeile ${r}`,
    refreshUnit: "Bildwiederholrate (Durchläufe pro Sekunde)",
    verdict: ["sehr langsam: man sieht die Zeilen wandern", "flimmert", "flimmert leicht", "ruhig, kein Flimmern ✓"],
    capZero: (r, c) => `Zeile ${r}, Spalte ${c}: Graustufenwert 0 – kein Feld leuchtet. Probier eine LED im Herz.`,
    cap: (r, c, g, pct) => `Zeile ${r}, Spalte ${c}: Graustufenwert <b>${g}</b> → ${g} von 16 Feldern an → Tastgrad <b>${pct} %</b>`,
    capSwitch: "　(Zeilenwechsel: Zähler auf 0)",
    capCount: (n, g, on) => `　| Zähler ${n} ${on ? "&lt;" : "≥"} ${g} → LED ${on ? "<b>an</b>" : "aus"}`,
    countLabel: "GCLK-Zähler",
    countSwitch: "Wechsel",
    refreshLabel: "Wiederholrate",
    statF: "GCLK: jeder Takt zählt +1",
    statScan: (rr) => `Multiplexing: Zeilenfrequenz ${rr}, jede Zeile 1/8 der Zeit`,
    statRefresh: `Wiederholrate = GCLK ÷ (${RT}×8)`,
    statDuty: (r, c, g) => `Gewählte LED (${r},${c}) GS=${g}: in der Zeile → mit Multiplexing`,
    lanes: ["GCLK", "LE", "Zeile", "Zähler"],
    busRow: (r, a) => `Zeile ${r} · A=${a}`,
    busSwitch: "W",
    scopeRo: (r) => `Zeile ${r} · 1 Feld = 1 GCLK`,
  },
};
const LANGS = [["zh", "中文"], ["en", "EN"], ["de", "DE"]];
let LANG = (() => {
  try { const saved = localStorage.getItem("led-lang"); if (I18N[saved]) return saved; } catch {}
  const nav = (navigator.language || "").toLowerCase();
  return nav.startsWith("de") ? "de" : nav.startsWith("en") ? "en" : "zh";
})();
const TX = () => I18N[LANG];
