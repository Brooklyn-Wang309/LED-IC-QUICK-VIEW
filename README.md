# How does an LED display light up? / LED 屏是怎么亮起来的？ / Wie leuchtet ein LED-Display?

An interactive, beginner-friendly explainer of how a **decoder IC** (74HC138) and a **PWM constant-current LED driver IC** work together to drive an 8×8 LED matrix. It walks through row scanning, refresh rate, PWM / duty cycle and GCLK in 9 steps, with an animated isometric circuit board.

一个给零基础读者的交互式讲解页：用 9 步动画说明译码 IC 和 PWM 恒流驱动 IC 如何配合点亮 LED 点阵，涵盖行扫、刷新率、PWM/占空比和 GCLK。

Eine interaktive Erklärseite für Einsteiger: In 9 animierten Schritten wird gezeigt, wie Decoder-IC und PWM-Konstantstrom-Treiber eine LED-Matrix ansteuern.

Languages: 中文 · English · Deutsch (switch in the top-right corner).

## View it

Open `index.html` in any modern browser – it is a single self-contained file with no external dependencies.

## Edit and rebuild

- `src/i18n.js` – all text in the three languages
- `src/figure.js` – the circuit board drawing
- `src/page.js` – page layout and styles
- `src/live.js` – the animation and the guided steps

After editing, rebuild `index.html` with:

```sh
sh build.sh
```

## Simplifications

To stay easy to follow, the model uses 4-bit grayscale (16 GCLK per PWM cycle), 1/8 scan and no scrambled PWM. The 20 mA channel current is an example value. Real drivers typically use 12–16-bit grayscale and scrambled PWM.

## Credits

The isometric drawing kit in `vendor/anatomy/` comes from [Anatomy](https://github.com/wheresryan22/anatomy) by Ryan, used under the MIT License (see `vendor/anatomy/LICENSE`).
