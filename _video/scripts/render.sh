#!/usr/bin/env bash
# Рендер промо-ролика на всех языках сайта.
#   out/qtomate-<lang>-16x9.mp4, out/qtomate-<lang>-9x16.mp4  — исходники для соцсетей
#   ../media/promo-<lang>.mp4, ../media/promo-<lang>.jpg      — облегчённая версия и постер для сайта
# BROWSER=/path/to/chrome-headless-shell — если Remotion не может скачать свой браузер.
set -euo pipefail
cd "$(dirname "$0")/.."
LANGS=(en ru uz tr)
BROWSER_ARG=()
[[ -n "${BROWSER:-}" ]] && BROWSER_ARG=(--browser-executable="$BROWSER")

python3 scripts/make_audio.py
mkdir -p out ../media
for lang in "${LANGS[@]}"; do
  props="{\"lang\":\"$lang\"}"
  npx remotion render src/index.ts Promo "out/qtomate-$lang-16x9.mp4" --props="$props" --codec=h264 --crf=17 --concurrency="${CONCURRENCY:-4}" "${BROWSER_ARG[@]}" --log=error
  npx remotion render src/index.ts PromoVertical "out/qtomate-$lang-9x16.mp4" --props="$props" --codec=h264 --crf=17 --concurrency="${CONCURRENCY:-4}" "${BROWSER_ARG[@]}" --log=error
  # для сайта: 1280×720, faststart, чтобы видео начинало играть до полной загрузки
  ffmpeg -y -loglevel error -i "out/qtomate-$lang-16x9.mp4" -vf scale=1280:-2 -c:v libx264 -preset slow -crf 25 \
    -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart "../media/promo-$lang.mp4"
  # постер — кадр сцены подсчёта (все выноски на месте)
  npx remotion still src/index.ts Promo "out/poster-$lang.png" --frame=325 --props="$props" "${BROWSER_ARG[@]}" --log=error
  ffmpeg -y -loglevel error -i "out/poster-$lang.png" -vf scale=1280:-2 -q:v 4 "../media/promo-$lang.jpg"
done
ls -la out/*.mp4 ../media/
