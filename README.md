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
