#!/usr/bin/env python3
"""Build the QtoMate site in every language.

    python3 _build/build.py

Reads _build/template.html and _build/strings.py, writes:
    index.html, ru/index.html, uz/index.html, tr/index.html, sitemap.xml, robots.txt
"""
import os
import re
import sys
from urllib.parse import quote

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
from strings import S, LANGS, LANG_NAMES  # noqa: E402

BASE = "https://qtomate.dpdns.org"
DEFAULT = "en"

RANGES = {
    "cyrillic-ext": "U+0460-052F,U+1C80-1C8A,U+20B4,U+2DE0-2DFF,U+A640-A69F,U+FE2E-FE2F",
    "cyrillic": "U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116",
    "latin-ext": "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF",
    "latin": "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD",
}


def url_for(lang):
    return BASE + "/" if lang == DEFAULT else f"{BASE}/{lang}/"


def path_for(lang, from_lang):
    """Relative link from one language page to another."""
    up = "" if from_lang == DEFAULT else "../"
    return (up or "./") if lang == DEFAULT else f"{up}{lang}/"


def fontface(rel):
    out = []
    for family, stem, weights in (("Geologica", "geologica", "100 900"), ("JetBrains Mono", "jetbrains-mono", "100 800")):
        for subset, rng in RANGES.items():
            out.append(
                f"  @font-face {{ font-family: \"{family}\"; font-style: normal; font-display: swap; font-weight: {weights}; "
                f"src: url({rel}fonts/{stem}-{subset}-wght-normal.woff2) format(\"woff2\"); unicode-range: {rng}; }}"
            )
    return "\n".join(out)


def build():
    template = open(os.path.join(HERE, "template.html"), encoding="utf-8").read()
    for lang in LANGS:
        i = LANGS.index(lang)
        rel = "" if lang == DEFAULT else "../"
        values = {k: v[i] for k, v in S.items()}
        values.update(
            lang=lang,
            rel=rel,
            url=url_for(lang),
            fontface=fontface(rel),
            mail_subject_enc=quote(values["mail_subject"]),
            state_initial=values["t_progress"].replace("{done}", "0").replace("{total}", "5"),
            hreflang="\n".join(
                [f'<link rel="alternate" hreflang="{l}" href="{url_for(l)}">' for l in LANGS]
                + [f'<link rel="alternate" hreflang="x-default" href="{url_for(DEFAULT)}">']
            ),
            langswitch="".join(
                f'<a href="{path_for(l, lang)}" lang="{l}" hreflang="{l}" title="{LANG_NAMES[l]}"'
                + (' aria-current="true"' if l == lang else "")
                + f">{l.upper()}</a>"
                for l in LANGS
            ),
        )

        def sub(m):
            key = m.group(1)
            if key not in values:
                raise KeyError(f"template uses unknown key: {key}")
            return values[key]

        html = re.sub(r"\{\{([a-z0-9_]+)\}\}", sub, template)
        out_dir = ROOT if lang == DEFAULT else os.path.join(ROOT, lang)
        os.makedirs(out_dir, exist_ok=True)
        with open(os.path.join(out_dir, "index.html"), "w", encoding="utf-8") as f:
            f.write(html)
        print("built", os.path.relpath(os.path.join(out_dir, "index.html"), ROOT))

    # sitemap + robots
    alt = "".join(f'<xhtml:link rel="alternate" hreflang="{l}" href="{url_for(l)}"/>' for l in LANGS)
    urls = "\n".join(f"  <url><loc>{url_for(l)}</loc>{alt}</url>" for l in LANGS)
    with open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n'
                '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
                f"{urls}\n</urlset>\n")
    with open(os.path.join(ROOT, "robots.txt"), "w", encoding="utf-8") as f:
        f.write(f"User-agent: *\nAllow: /\n\nSitemap: {BASE}/sitemap.xml\n")
    print("built sitemap.xml, robots.txt")


if __name__ == "__main__":
    build()
