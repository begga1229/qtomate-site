# QtoMate website

Static site served by GitHub Pages at https://qtomate.dpdns.org/ in English, Russian, Uzbek and Turkish.

## Editing the text

All copy lives in `_build/strings.py`, one entry per string with the four languages side by side.
The page layout lives in `_build/template.html`.

After changing either file, rebuild and commit:

    python3 _build/build.py

This regenerates `index.html`, `ru/`, `uz/`, `tr/`, `sitemap.xml` and `robots.txt`. Do not edit those by hand.

## Fonts

Geologica and JetBrains Mono are self-hosted from `fonts/` under the SIL Open Font License (licence texts are in the same folder).

## The takeoff workspace (`app/`)

A static, browser-only app: no build step, no server.

- `app/index.html`, `app/app.css`, `app/app.js`: the workspace itself.
- `app/snap.js`: reads the vector lines of a PDF page and finds the real point under the cursor (line end, midpoint, crossing, nearest point on a line).
- `app/i18n.js`: the app's strings in English, Russian, Uzbek and Turkish.
- `app/vendor/`: PDF.js and SheetJS, self-hosted.

When you change `app.js`, `app.css`, `i18n.js` or `snap.js`, bump the `?v=` value in `app/index.html` and in the two imports at the top of `app/app.js`, so browsers load the new files together.
