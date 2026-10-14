# QtoMate website

Static site served by GitHub Pages at https://qtomate.dpdns.org/ in English, Russian, Uzbek and Turkish.

## Pages

Every page exists in English (at the root) and under `ru/`, `uz/` and `tr/`:

| Page | Path | Text in |
|---|---|---|
| Home | `/` | `_build/strings.py`, layout in `_build/template.html` |
| Features | `/features/` | `_build/p_features.py` |
| Who it's for | `/use-cases/` | `_build/p_usecases.py` |
| Pricing and pilot | `/pricing/` | `_build/p_pricing.py` |
| Privacy | `/privacy/` | `_build/p_pricing.py` |
| Glossary and 12 term pages | `/glossary/`, `/glossary/<term>/` | `_build/p_glossary.py` |

Navigation, footer and other shared text are in `_build/ui.py`. Every string is a tuple of four: English, Russian, Uzbek, Turkish.

## Building

After changing any file in `_build/`, rebuild and commit:

    python3 _build/build.py

This regenerates every `index.html`, `assets/site.css` (from the `<style>` block of `template.html` plus `_build/site_extra.css`), `assets/site.js`, `404.html`, `sitemap.xml` and `robots.txt`. Do not edit those by hand. When the CSS changes, bump `VERSION` in `build.py` so browsers fetch the new file.

## Fonts

Unbounded and Onest are self-hosted from `fonts/` under the SIL Open Font License (licence texts are in the same folder).

## The takeoff workspace (`app/`)

A static, browser-only app: no build step, no server.

- `app/index.html`, `app/app.css`, `app/app.js`: the workspace itself.
- `app/snap.js`: reads the vector lines of a PDF page and finds the real point under the cursor (line end, midpoint, crossing, nearest point on a line).
- `app/i18n.js`: the app's strings in English, Russian, Uzbek and Turkish.
- `app/vendor/`: PDF.js and SheetJS, self-hosted.

When you change `app.js`, `app.css`, `i18n.js` or `snap.js`, bump the `?v=` value in `app/index.html` and in the two imports at the top of `app/app.js`, so browsers load the new files together.
