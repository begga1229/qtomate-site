#!/usr/bin/env python3
"""Build the QtoMate website in every language.

    python3 _build/build.py

Sources (all in _build/):
    template.html   home page sections (its <style> block is the base of assets/site.css)
    strings.py      home page text
    ui.py           navigation, footer and other shared text
    p_*.py          text of the other pages
    site_extra.css  styles used by the other pages

Writes, for en (at the root) and ru/, uz/, tr/:
    index.html, features/, use-cases/, pricing/, privacy/, glossary/, glossary/<term>/
plus assets/site.css, assets/site.js, 404.html, sitemap.xml and robots.txt.
"""
import html
import json
import os
import re
import sys
from urllib.parse import quote

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
from strings import S, LANGS, LANG_NAMES  # noqa: E402
from ui import UI  # noqa: E402
from p_features import FEATURES  # noqa: E402
from p_usecases import USECASES  # noqa: E402
from p_pricing import PRICING, PRIVACY  # noqa: E402
from p_glossary import GLOSSARY  # noqa: E402

BASE = "https://qtomate.dpdns.org"
DEFAULT = "en"
MAIL = "begench@qtomate.dpdns.org"
VERSION = "20261014"

RANGES = {
    "cyrillic-ext": "U+0460-052F,U+1C80-1C8A,U+20B4,U+2DE0-2DFF,U+A640-A69F,U+FE2E-FE2F",
    "cyrillic": "U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116",
    "latin-ext": "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF",
    "latin": "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD",
}

E = lambda s: html.escape(s, quote=False)  # noqa: E731
A = lambda s: html.escape(s, quote=True)  # noqa: E731


# ----------------------------------------------------------------- paths
def url_for(lang, seg=""):
    return f"{BASE}/{seg}" if lang == DEFAULT else f"{BASE}/{lang}/{seg}"


def depth(lang, seg):
    return (0 if lang == DEFAULT else 1) + seg.count("/")


def href(from_lang, from_seg, to_lang, to_seg, anchor=""):
    """Relative link between two pages."""
    target = ("" if to_lang == DEFAULT else f"{to_lang}/") + to_seg
    up = "../" * depth(from_lang, from_seg)
    return (up + target or "./") + anchor


def tx(entry, lang):
    """Pick the language from an (en, ru, uz, tr) tuple."""
    return entry[LANGS.index(lang)]


# ----------------------------------------------------------------- icons
ICONS = {
    "snap": '<path d="M5 5h4v4H5zM15 15h4v4h-4z"/><path d="M9 7h6a2 2 0 0 1 2 2v6"/><circle cx="7" cy="17" r="2"/>',
    "tools": '<path d="M4 20L20 4M4 20l1.5-4.5M4 20l4.5-1.5"/><path d="M13 13h7v7h-7z" fill="currentColor" fill-opacity=".15"/>',
    "scale": '<path d="M3 15h18v5H3zM7 15v2.5M11 15v3.5M15 15v2.5M19 15v3.5"/><path d="M3 9h18M3 7v4M21 7v4"/>',
    "edit": '<path d="M5 19l1-4 9.5-9.5a2.1 2.1 0 0 1 3 3L9 18z"/><path d="M14 7l3 3"/>',
    "pages": '<path d="M7 3h8l4 4v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M15 3v4h4M9 13h6M9 17h4"/>',
    "layers": '<path d="M12 3l9 5-9 5-9-5zM3 12.5l9 5 9-5M3 16.5l9 5 9-5"/>',
    "save": '<path d="M5 4h11l3 3v13H5z"/><path d="M8 4v5h7V4M8 20v-6h8v6"/>',
    "groups": '<path d="M10 5h10M10 12h10M10 19h10"/><circle cx="5" cy="5" r="1.8" fill="currentColor"/><circle cx="5" cy="12" r="1.8" fill="currentColor"/><circle cx="5" cy="19" r="1.8" fill="currentColor"/>',
    "volume": '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5L12 12l8-4.5M12 12v9"/>',
    "trace": '<path d="M4 6h10M4 12h7M4 18h10"/><path d="M15 12l2.5 2.5L22 10"/>',
    "excel": '<path d="M5 3h10l4 4v14H5z"/><path d="M9 10l5 6M14 10l-5 6"/>',
    "ai": '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" fill="currentColor" fill-opacity=".2"/>',
    "lock": '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
}
FEATURE_ICONS = ["snap", "tools", "scale", "edit", "pages", "layers", "save", "groups", "volume", "trace", "excel", "ai"]


def icon(name, cls="ic"):
    return (f'<span class="{cls}" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" '
            f'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">{ICONS[name]}</svg></span>')


BRAND_SVG = ('<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="5" y="5" width="22" height="22" rx="4" fill="none" '
             'stroke="currentColor" stroke-width="2.4"/><rect x="16" y="16" width="11" height="11" rx="2" class="brand-dot"/></svg>')
FAVICON = ("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' "
           "fill='%23080d1a'/%3E%3Crect x='7' y='7' width='18' height='18' rx='3' fill='none' stroke='%233de3ff' stroke-width='2.4'/%3E"
           "%3Crect x='16' y='16' width='9' height='9' rx='1.5' fill='%23b6ff5c'/%3E%3C/svg%3E")


# ----------------------------------------------------------------- layout
NAV = [("features/", "nav_features"), ("use-cases/", "nav_usecases"), ("pricing/", "nav_pricing"), ("glossary/", "nav_glossary")]


def lang_links(lang, seg, cls="langs"):
    """Language switch pointing at the same page in each language."""
    out = []
    for l in LANGS:
        cur = ' aria-current="true"' if l == lang else ""
        out.append(f'<a href="{href(lang, seg, l, seg)}" lang="{l}" hreflang="{l}" title="{A(LANG_NAMES[l])}"{cur}>{l.upper()}</a>')
    return f'<span class="{cls}" role="group" aria-label="{A(tx(S["lang_aria"], lang))}">{"".join(out)}</span>'


def app_href(lang, seg):
    return href(lang, seg, DEFAULT, "app/") + f"?lang={lang}"


def header(lang, seg, section):
    u = lambda k: tx(UI[k], lang)  # noqa: E731
    cur = lambda s: ' aria-current="page"' if section == s else ""  # noqa: E731
    links = "".join(f'<a class="navlink" href="{href(lang, seg, lang, s)}"{cur(s)}>{E(u(key))}</a>' for s, key in NAV)
    menu_links = "".join(f'<a href="{href(lang, seg, lang, s)}"{cur(s)}>{E(u(key))}</a>' for s, key in NAV)
    app = app_href(lang, seg)
    return f"""<header class="site-head">
  <div class="shell topbar">
    <a class="brand" href="{href(lang, seg, lang, '')}" aria-label="{A(tx(S['brand_aria'], lang))}">{BRAND_SVG}QtoMate</a>
    <nav class="nav" aria-label="{A(tx(S['nav_aria'], lang))}">
      {links}
      {lang_links(lang, seg, 'langs desk')}
      <a class="button button-lime nav-app" href="{app}">{E(tx(S['nav_app'], lang))}</a>
      <details class="menu">
        <summary><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><span>{E(u('menu'))}</span></summary>
        <div class="menu-panel">
          {menu_links}
          <a class="menu-app" href="{app}">{E(tx(S['nav_app'], lang))}</a>
          {lang_links(lang, seg)}
        </div>
      </details>
    </nav>
  </div>
</header>"""


def footer(lang, seg):
    u = lambda k: tx(UI[k], lang)  # noqa: E731
    h = lambda s, a="": href(lang, seg, lang, s, a)  # noqa: E731
    roles = "".join(f'<li><a href="{h("use-cases/", "#" + r["id"])}">{E(tx(r["h"], lang))}</a></li>' for r in USECASES["roles"])
    terms = "".join(f'<li><a href="{h("glossary/" + t["slug"] + "/")}">{E(tx(t["name"], lang))}</a></li>'
                    for t in GLOSSARY["terms"][:4])
    return f"""<footer class="site">
  <div class="shell cols">
    <div class="foot-brand">
      <a class="brand" href="{h('')}">{BRAND_SVG}QtoMate</a>
      <p>{E(tx(S['foot_tag'], lang))}</p>
      <p class="foot-legal">{E(u('f_legal'))}</p>
    </div>
    <div>
      <h2>{E(u('f_product'))}</h2>
      <ul>
        <li><a href="{app_href(lang, seg)}">{E(tx(S['nav_app'], lang))}</a></li>
        <li><a href="{h('features/')}">{E(u('nav_features'))}</a></li>
        <li><a href="{h('pricing/')}">{E(u('nav_pricing'))}</a></li>
        <li><a href="{h('features/', '#shortcuts')}">{E(u('f_shortcuts'))}</a></li>
      </ul>
    </div>
    <div>
      <h2>{E(u('nav_usecases'))}</h2>
      <ul>{roles}</ul>
    </div>
    <div>
      <h2>{E(u('f_learn'))}</h2>
      <ul>{terms}<li><a href="{h('glossary/')}">{E(u('f_all_terms'))}</a></li></ul>
    </div>
    <div>
      <h2>{E(u('f_company'))}</h2>
      <ul>
        <li><a href="{h('', '#about')}">{E(u('f_about'))}</a></li>
        <li><a href="{h('', '#status')}">{E(u('f_status'))}</a></li>
        <li><a href="{h('', '#faq')}">{E(u('f_faq'))}</a></li>
        <li><a href="{h('privacy/')}">{E(u('f_privacy'))}</a></li>
        <li><a href="mailto:{MAIL}">{E(u('f_contact'))}</a></li>
      </ul>
    </div>
  </div>
  <div class="foot-bottom">
    <div class="shell">
      <span>© 2026 QtoMate</span>
      {lang_links(lang, seg)}
    </div>
  </div>
</footer>"""


def crumbs(lang, seg, trail):
    """trail: list of (label, seg), with seg None for the current page."""
    items = [(tx(UI["home"], lang), "")] + trail
    lis = []
    for label, s in items:
        if s is None:
            lis.append(f'<li aria-current="page">{E(label)}</li>')
        else:
            lis.append(f'<li><a href="{href(lang, seg, lang, s)}">{E(label)}</a></li>')
    data = {
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "name": label, "item": url_for(lang, s if s is not None else seg)}
            for i, (label, s) in enumerate(items)
        ],
    }
    return f'<nav class="crumbs" aria-label="{A(tx(UI["crumbs_aria"], lang))}"><ol>{"".join(lis)}</ol></nav>', data


def jsonld(data):
    return '<script type="application/ld+json">' + json.dumps(data, ensure_ascii=False).replace("</", "<\\/") + "</script>\n"


def page(lang, seg, section, title, desc, body, ld=None, inline_script=""):
    rel = "../" * depth(lang, seg)
    alt = "\n".join([f'<link rel="alternate" hreflang="{l}" href="{url_for(l, seg)}">' for l in LANGS]
                    + [f'<link rel="alternate" hreflang="x-default" href="{url_for(DEFAULT, seg)}">'])
    lds = "".join(jsonld(d) for d in (ld or []))
    return f"""<!doctype html>
<html lang="{lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="theme-color" content="#080d1a">
<title>{E(title)}</title>
<meta name="description" content="{A(desc)}">
<meta property="og:title" content="{A(title)}">
<meta property="og:description" content="{A(desc)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="QtoMate">
<meta property="og:url" content="{url_for(lang, seg)}">
<link rel="canonical" href="{url_for(lang, seg)}">
{alt}
<link rel="icon" href="{FAVICON}">
<link rel="preload" href="{rel}fonts/onest-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="{rel}assets/site.css?v={VERSION}">
<script src="{rel}assets/site.js?v={VERSION}" defer></script>
{lds}</head>
<body>
<a class="skip" href="#main">{E(tx(S['skip'], lang))}</a>
{header(lang, seg, section)}
<main id="main">
{body}
</main>
{footer(lang, seg)}
{inline_script}
</body>
</html>
"""


def page_hero(lang, seg, trail, h1, lede, actions=""):
    nav, data = crumbs(lang, seg, trail)
    return f"""<div class="blueprint first">
  <div class="shell page-hero">
    {nav}
    <h1>{E(h1)}</h1>
    <p class="lede">{E(lede)}</p>
    {actions}
  </div>
</div>""", data


def app_button(lang, seg, cls="button button-yellow"):
    return f'<a class="{cls}" href="{app_href(lang, seg)}">{E(tx(S["nav_app"], lang))}</a>'


def try_block(lang, seg):
    return f"""<div class="blueprint">
  <div class="shell closing">
    <h2>{E(tx(UI['try_h'], lang))}</h2>
    <p>{E(tx(UI['try_p'], lang))}</p>
    <div class="actions">
      {app_button(lang, seg)}
      <a class="mail" href="mailto:{MAIL}">{MAIL}</a>
    </div>
  </div>
</div>"""


def faq_block(items, lang):
    return '<div class="faq">' + "".join(
        f"<details><summary>{E(tx(q, lang))}</summary><p>{E(tx(a, lang))}</p></details>" for q, a in items) + "</div>"


def faq_ld(items, lang):
    return {
        "@context": "https://schema.org", "@type": "FAQPage",
        "mainEntity": [{"@type": "Question", "name": tx(q, lang),
                        "acceptedAnswer": {"@type": "Answer", "text": tx(a, lang)}} for q, a in items],
    }


def linkify_mail(text):
    return text.replace(MAIL, f'<a href="mailto:{MAIL}">{MAIL}</a>')


# ----------------------------------------------------------------- pages
def build_home(lang, template):
    i = LANGS.index(lang)
    seg = ""
    values = {k: v[i] for k, v in S.items()}
    values.update(
        lang=lang, rel="../" * depth(lang, seg), url=url_for(lang),
        mail_subject_enc=quote(values["mail_subject"]),
        state_initial=values["t_progress"].replace("{done}", "0").replace("{total}", "5"),
    )

    def sub(m):
        key = m.group(1)
        if key not in values:
            raise KeyError(f"template uses unknown key: {key}")
        return values[key]

    t = template
    hero = t[t.index('<div class="shell hero" id="top">'): t.index("  </main>\n</div>")]
    rest = t[t.index('<section class="band" aria-labelledby="why-h">'): t.index('<footer class="site">')]
    script = t[t.index("<script>"): t.index("</body>")]
    rest = rest.replace('<section class="band" aria-labelledby="about-h">', '<section class="band" id="about" aria-labelledby="about-h">')
    body = re.sub(r"\{\{([a-z0-9_]+)\}\}", sub, f'<div class="blueprint first">\n{hero}</div>\n{rest}')
    app = {"@context": "https://schema.org", "@type": "SoftwareApplication", "name": "QtoMate",
           "applicationCategory": "BusinessApplication", "operatingSystem": "Web browser",
           "url": url_for(lang), "inLanguage": lang, "description": values["meta_desc"],
           "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"}}
    return page(lang, seg, "", values["title"], values["meta_desc"], body, ld=[app], inline_script=script)


def build_features(lang):
    F = FEATURES
    seg = "features/"
    hero, bc = page_hero(lang, seg, [(tx(UI["nav_features"], lang), None)], tx(F["h1"], lang), tx(F["lede"], lang),
                         f'<div class="actions">{app_button(lang, seg)}</div>')
    n = 0
    groups_html = []
    for g in F["groups"]:
        cards = []
        for it in g["items"]:
            name = FEATURE_ICONS[n % len(FEATURE_ICONS)]
            n += 1
            beta = " beta" if name == "ai" else ""
            cards.append(f'<article class="card{beta}">{icon(name)}<h3>{E(tx(it["h"], lang))}</h3><p>{E(tx(it["p"], lang))}</p></article>')
        groups_html.append(f'<div class="fgroup"><h2>{E(tx(g["h"], lang))}</h2><div class="cards n{len(cards)}">{"".join(cards)}</div></div>')
    lim = "".join(f"<li>{E(tx(x, lang))}</li>" for x in F["limits"])
    kc = tx(F["keys_col"], lang)
    rows = "".join(
        "<tr><td>" + " ".join(f"<kbd>{E(k.strip())}</kbd>" for k in key.split("/")) + f"</td><td>{E(tx(label, lang))}</td></tr>"
        for key, label in F["keys"])
    body = f"""{hero}
<section class="band" aria-label="{A(tx(UI['nav_features'], lang))}"><div class="shell">{''.join(groups_html)}</div></section>
<section class="band" aria-labelledby="priv-h"><div class="shell">
  <div class="callout">{icon('lock')}<div><h2 id="priv-h">{E(tx(F['privacy_h'], lang))}</h2><p>{E(tx(F['privacy_p'], lang))}</p>
  <p class="more-link"><a href="{href(lang, seg, lang, 'privacy/')}">{E(tx(UI['f_privacy'], lang))} →</a></p></div></div>
</div></section>
<section class="band" aria-labelledby="lim-h"><div class="shell">
  <h2 id="lim-h">{E(tx(F['limits_h'], lang))}</h2>
  <p class="intro">{E(tx(F['limits_intro'], lang))}</p>
  <ul class="limits">{lim}</ul>
</div></section>
<section class="band" id="shortcuts" aria-labelledby="keys-h"><div class="shell">
  <h2 id="keys-h">{E(tx(F['keys_h'], lang))}</h2>
  <table class="keys"><thead><tr><th scope="col">{E(kc[0])}</th><th scope="col">{E(kc[1])}</th></tr></thead><tbody>{rows}</tbody></table>
</div></section>
{try_block(lang, seg)}"""
    return page(lang, seg, seg, tx(F["title"], lang), tx(F["desc"], lang), body, ld=[bc])


def build_usecases(lang):
    U = USECASES
    seg = "use-cases/"
    chips = "".join(f'<a href="#{r["id"]}">{E(tx(r["h"], lang))}</a>' for r in U["roles"])
    hero, bc = page_hero(lang, seg, [(tx(UI["nav_usecases"], lang), None)], tx(U["h1"], lang), tx(U["lede"], lang),
                         f'<nav class="roles-nav" aria-label="{A(tx(UI["nav_usecases"], lang))}">{chips}</nav>')
    parts = [hero]
    for r in U["roles"]:
        tasks = "".join(f"<li>{E(tx(t, lang))}</li>" for t in r["tasks"])
        parts.append(f"""<section class="band" id="{r['id']}" aria-labelledby="{r['id']}-h"><div class="shell role">
  <div class="who"><h2 id="{r['id']}-h">{E(tx(r['h'], lang))}</h2><p class="lead">{E(tx(r['p'], lang))}</p></div>
  <div>
    <h3 class="sub">{E(tx(U['tasks_h'], lang))}</h3>
    <ul class="tasks">{tasks}</ul>
    <h3 class="sub how-h">{E(tx(U['how_h'], lang))}</h3>
    <p class="how">{E(tx(r['how'], lang))}</p>
  </div>
</div></section>""")
    steps = "".join(f'<li><span class="stepno"></span><h3>{E(tx(h, lang))}</h3><p>{E(tx(p, lang))}</p></li>' for h, p in U["flow"])
    parts.append(f"""<section class="band" aria-labelledby="flow-h"><div class="shell">
  <h2 id="flow-h">{E(tx(U['flow_h'], lang))}</h2>
  <ol class="chain six">{steps}</ol>
</div></section>""")
    parts.append(try_block(lang, seg))
    return page(lang, seg, seg, tx(U["title"], lang), tx(U["desc"], lang), "\n".join(parts), ld=[bc])


def build_pricing(lang):
    P = PRICING
    seg = "pricing/"
    hero, bc = page_hero(lang, seg, [(tx(UI["nav_pricing"], lang), None)], tx(P["h1"], lang), tx(P["lede"], lang))
    subject = quote(tx(P["pilot_subject"], lang))
    cards = []
    for i, p in enumerate(P["plans"]):
        items = "".join(f"<li>{E(tx(x, lang))}</li>" for x in p["items"])
        if p["cta"] == "app":
            btn = app_button(lang, seg)
        elif p["cta"] == "features":
            btn = f'<a class="button button-outline-light" href="{href(lang, seg, lang, "features/")}">{E(tx(UI["nav_features"], lang))}</a>'
        else:
            btn = f'<a class="button button-outline-light" href="mailto:{MAIL}?subject={subject}">{E(tx(P["pilot_cta"], lang))}</a>'
        cards.append(f"""<article class="plan-card{' main' if i == 0 else ''}">
  <h2 class="pname">{E(tx(p['name'], lang))}</h2>
  <p class="price">{E(tx(p['price'], lang))}</p>
  <p class="pnote">{E(tx(p['note'], lang))}</p>
  <ul>{items}</ul>
  {btn}
</article>""")
    body = f"""{hero}
<section class="band plans-band" aria-label="{A(tx(UI['nav_pricing'], lang))}"><div class="shell"><div class="plans">{''.join(cards)}</div></div></section>
<section class="band" id="pilot" aria-labelledby="pilot-h"><div class="shell">
  <h2 id="pilot-h">{E(tx(P['pilot_h'], lang))}</h2>
  <p class="intro">{E(tx(P['pilot_p'], lang))}</p>
  <div class="actions-row"><a class="button button-yellow" href="mailto:{MAIL}?subject={subject}">{E(tx(P['pilot_cta'], lang))}</a></div>
</div></section>
<section class="band" aria-labelledby="pfaq-h"><div class="shell">
  <h2 id="pfaq-h">{E(tx(P['faq_h'], lang))}</h2>
  {faq_block(P['faq'], lang)}
</div></section>
{try_block(lang, seg)}"""
    return page(lang, seg, seg, tx(P["title"], lang), tx(P["desc"], lang), body, ld=[bc, faq_ld(P["faq"], lang)])


def build_privacy(lang):
    P = PRIVACY
    seg = "privacy/"
    hero, bc = page_hero(lang, seg, [(tx(UI["f_privacy"], lang), None)], tx(P["h1"], lang), tx(P["lede"], lang))
    secs = "".join(f"<section><h2>{E(tx(h, lang))}</h2><p>{linkify_mail(E(tx(p, lang)))}</p></section>" for h, p in P["sections"])
    body = f"""{hero}
<section class="band"><div class="shell"><div class="prose">{secs}<p class="updated">{E(tx(UI['updated'], lang))}</p></div></div></section>"""
    return page(lang, seg, "", tx(P["title"], lang), tx(P["desc"], lang), body, ld=[bc])


def build_glossary(lang):
    G = GLOSSARY
    seg = "glossary/"
    hero, bc = page_hero(lang, seg, [(tx(UI["nav_glossary"], lang), None)], tx(G["h1"], lang), tx(G["lede"], lang))
    terms = sorted(G["terms"], key=lambda t: tx(t["name"], lang).lower())
    cards = "".join(
        f'<li><a href="{href(lang, seg, lang, seg + t["slug"] + "/")}"><h2>{E(tx(t["name"], lang))}</h2>'
        f'<p>{E(tx(t["short"], lang))}</p><span class="more" aria-hidden="true">{E(tx(G["l_read"], lang))} →</span></a></li>'
        for t in terms)
    body = f'{hero}\n<section class="band"><div class="shell"><ul class="terms">{cards}</ul></div></section>\n{try_block(lang, seg)}'
    ld = {"@context": "https://schema.org", "@type": "DefinedTermSet", "name": tx(G["h1"], lang), "inLanguage": lang,
          "url": url_for(lang, seg),
          "hasDefinedTerm": [{"@type": "DefinedTerm", "name": tx(t["name"], lang), "description": tx(t["short"], lang),
                              "url": url_for(lang, seg + t["slug"] + "/")} for t in G["terms"]]}
    return page(lang, seg, seg, tx(G["title"], lang), tx(G["desc"], lang), body, ld=[bc, ld])


def build_term(lang, t):
    G = GLOSSARY
    seg = f"glossary/{t['slug']}/"
    name = tx(t["name"], lang)
    nav, bc = crumbs(lang, seg, [(tx(UI["nav_glossary"], lang), "glossary/"), (name, None)])
    by_slug = {x["slug"]: x for x in G["terms"]}
    rel_links = "".join(
        f'<li><a href="{href(lang, seg, lang, "glossary/" + s + "/")}"><strong>{E(tx(by_slug[s]["name"], lang))}</strong>'
        f'<span>{E(tx(by_slug[s]["short"], lang))}</span></a></li>' for s in t["related"])
    paras = "".join(f"<p>{E(tx(p, lang))}</p>" for p in t["body"])
    body = f"""<div class="blueprint first">
  <div class="shell page-hero">
    {nav}
    <h1>{E(name)}</h1>
    <p class="lede def">{E(tx(t['short'], lang))}</p>
  </div>
</div>
<section class="band term-band"><div class="shell term">
  <article>
    <div class="body">{paras}</div>
    <h2 class="small">{E(tx(G['l_example'], lang))}</h2>
    <div class="example">{E(tx(t['example'], lang))}</div>
    <h2 class="small">{E(tx(G['l_inapp'], lang))}</h2>
    <div class="inapp"><p>{E(tx(t['inapp'], lang))}</p>{app_button(lang, seg, 'button button-outline-light small')}</div>
    <h2 class="small">{E(tx(G['l_faq'], lang))}</h2>
    {faq_block(t['faq'], lang)}
  </article>
  <aside class="side" aria-labelledby="rel-h">
    <h2 id="rel-h" class="small">{E(tx(G['l_related'], lang))}</h2>
    <ul class="related">{rel_links}</ul>
    <p class="all"><a href="{href(lang, seg, lang, 'glossary/')}">{E(tx(UI['f_all_terms'], lang))} →</a></p>
  </aside>
</div></section>
{try_block(lang, seg)}"""
    dt = {"@context": "https://schema.org", "@type": "DefinedTerm", "name": name, "description": tx(t["short"], lang),
          "inLanguage": lang, "url": url_for(lang, seg), "inDefinedTermSet": url_for(lang, "glossary/")}
    title = f"{name} | {tx(G['h1'], lang)} | QtoMate"
    return page(lang, seg, "glossary/", title, tx(t["short"], lang), body, ld=[bc, dt, faq_ld(t["faq"], lang)])


NOT_FOUND = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="robots" content="noindex">
<title>Page not found | QtoMate</title>
<link rel="icon" href="{favicon}">
<link rel="stylesheet" href="/assets/site.css?v={version}">
</head>
<body>
<main id="main" class="blueprint first notfound">
  <div class="shell page-hero">
    <a class="brand" href="/">{brand}QtoMate</a>
    <h1>This sheet is not in the set.</h1>
    <p class="lede">The page you asked for does not exist. These will get you back on track.</p>
    <div class="actions">
      <a class="button button-yellow" href="/">Go to the home page</a>
      <a class="button button-outline-light" href="/app/">Open the app</a>
    </div>
    <p class="nf-links"><a href="/features/">Features</a><a href="/glossary/">Glossary</a><a href="/ru/" lang="ru">Русский</a><a href="/uz/" lang="uz">O‘zbekcha</a><a href="/tr/" lang="tr">Türkçe</a></p>
  </div>
</main>
</body>
</html>
"""


# ----------------------------------------------------------------- assets
def fontface(prefix):
    out = []
    for family, stem, weights in (("Unbounded", "unbounded", "200 900"), ("Onest", "onest", "100 900")):
        for subset, rng in RANGES.items():
            out.append(f'@font-face {{ font-family: "{family}"; font-style: normal; font-display: swap; font-weight: {weights}; '
                       f'src: url({prefix}fonts/{stem}-{subset}-wght-normal.woff2) format("woff2"); unicode-range: {rng}; }}')
    return "\n".join(out)


def build_css(template):
    base = template[template.index("<style>") + len("<style>"): template.index("</style>")]
    base = base.replace("{{fontface}}", "")
    old_step = '  .chain .stepno::before { content: "{{step_word}} " counter(step); }\n'
    if old_step not in base:
        raise ValueError("step rule not found in template CSS")
    base = base.replace(old_step, "")
    steps = "\n".join(f'html[lang="{l}"] .chain .stepno::before {{ content: "{tx(S["step_word"], l)} " counter(step); }}' for l in LANGS)
    for old in ("  footer.site { border-top: 1px solid var(--line); background: var(--bg); color: var(--muted); font-size: 14.5px; }\n",
                "  footer.site .shell { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px 32px; padding-block: 26px; }\n"):
        if old not in base:
            raise ValueError("footer rule not found in template CSS")
        base = base.replace(old, "")
    if "{{" in base:
        raise ValueError("unreplaced token in CSS: " + re.search(r"\{\{[^}]+\}\}", base).group(0))
    extra = open(os.path.join(HERE, "site_extra.css"), encoding="utf-8").read()
    return ("/* QtoMate site styles. Generated by _build/build.py from template.html and site_extra.css; do not edit by hand. */\n"
            + fontface("../") + "\n" + base + "\n" + steps + "\n" + extra)


SITE_JS = """// Closes the mobile menu on an outside click and on Escape.
(function () {
  function openMenus() { return document.querySelectorAll('details.menu[open]'); }
  document.addEventListener('click', function (e) {
    openMenus().forEach(function (d) { if (!d.contains(e.target)) d.removeAttribute('open'); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    openMenus().forEach(function (d) { d.removeAttribute('open'); d.querySelector('summary').focus(); });
  });
})();
"""


# ----------------------------------------------------------------- write
def write(path, text):
    full = os.path.join(ROOT, path)
    os.makedirs(os.path.dirname(full) or ROOT, exist_ok=True)
    with open(full, "w", encoding="utf-8") as f:
        f.write(text)


def out_path(lang, seg):
    return ("" if lang == DEFAULT else f"{lang}/") + seg + "index.html"


def build():
    template = open(os.path.join(HERE, "template.html"), encoding="utf-8").read()
    write("assets/site.css", build_css(template))
    write("assets/site.js", SITE_JS)
    segs = ["", "features/", "use-cases/", "pricing/", "privacy/", "glossary/"] + [f"glossary/{t['slug']}/" for t in GLOSSARY["terms"]]
    for lang in LANGS:
        write(out_path(lang, ""), build_home(lang, template))
        write(out_path(lang, "features/"), build_features(lang))
        write(out_path(lang, "use-cases/"), build_usecases(lang))
        write(out_path(lang, "pricing/"), build_pricing(lang))
        write(out_path(lang, "privacy/"), build_privacy(lang))
        write(out_path(lang, "glossary/"), build_glossary(lang))
        for t in GLOSSARY["terms"]:
            write(out_path(lang, f"glossary/{t['slug']}/"), build_term(lang, t))
    write("404.html", NOT_FOUND.format(favicon=FAVICON, version=VERSION, brand=BRAND_SVG))

    urls = []
    for seg in segs:
        alt = "".join(f'<xhtml:link rel="alternate" hreflang="{l}" href="{url_for(l, seg)}"/>' for l in LANGS) \
            + f'<xhtml:link rel="alternate" hreflang="x-default" href="{url_for(DEFAULT, seg)}"/>'
        for l in LANGS:
            urls.append(f"  <url><loc>{url_for(l, seg)}</loc>{alt}</url>")
    write("sitemap.xml", '<?xml version="1.0" encoding="UTF-8"?>\n'
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
          + "\n".join(urls) + "\n</urlset>\n")
    write("robots.txt", f"User-agent: *\nAllow: /\n\nSitemap: {BASE}/sitemap.xml\n")
    print(f"built {len(segs) * len(LANGS)} pages, 404.html, assets, sitemap.xml, robots.txt")


if __name__ == "__main__":
    build()
