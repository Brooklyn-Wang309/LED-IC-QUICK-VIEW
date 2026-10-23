#!/bin/sh
# 把 Anatomy 的 iso-kit 内联进单页（本机无 Node，构建在浏览器里完成）
KIT="vendor/anatomy/iso-kit.mjs"
{
  printf '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>LED Display Explainer</title></head><body><script type="module">\n'
  sed -e 's/^export //' -e 's|</script|<\\/script|g' "$KIT"
  cat src/figure.js src/i18n.js src/page.js src/live.js
  printf '\n</script></body></html>\n'
} > index.html
