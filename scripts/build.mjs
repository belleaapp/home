#!/usr/bin/env node
// Génère le site Bellea dans « dist/ ».
//
//   npm run build           → lit le catalogue dans Firebase (lecture publique)
//   npm run build:exemple   → utilise data/exemple-produits.json (sans réseau)
//
// Toutes les pages partagent la même mise en page (layout) : en-tête, pied de
// page et liens Google Play sont définis une seule fois, ici.

import { mkdir, rm, cp, writeFile, readFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';
import { LANGS, textes } from './textes.mjs';
import { quizData, skinLabel } from './quiz.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const SAMPLE = process.argv.includes('--exemple');
// Préfixe des adresses quand le site n'est pas à la racine du domaine
// (ex. « /home » sur belleaapp.github.io/home avant le branchement de bellea.store).
// Fourni par GitHub Actions (configure-pages) ; vide avec un domaine personnalisé.
const BASE = (process.env.BASE_PATH || '').replace(/\/$/, '');

// ---------------------------------------------------------------------------
// Réglages
// ---------------------------------------------------------------------------
const SITE = {
  url: 'https://bellea.store',
  name: 'Bellea',
  package: 'com.pharmalium.bellea',
  firebaseProject: 'dercomia-c300b',
  freeShipping: 15000, // = OrderRules.freeShippingThreshold dans l'app
  cgu: 'https://belleaapp.github.io/CGU-et-la-Politique-de-Confidentialit-/',
  deleteAccount: 'https://belleaapp.github.io/Suppression-de-compte/',
  year: new Date().getFullYear(),
};

/** Lien Google Play avec la source (visible dans la Play Console > Acquisition). */
const play = (medium) =>
  `https://play.google.com/store/apps/details?id=${SITE.package}&referrer=${encodeURIComponent(`utm_source=bellea.store&utm_medium=${medium}`)}`;

// ---------------------------------------------------------------------------
// Outils
// ---------------------------------------------------------------------------
const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fmtNum = (n) => Math.round(n).toLocaleString('fr-FR').replace(/[\u202f\u00a0 ]/g, '\u202f');
const daFor = (lang) => (n) => `${fmtNum(n)}\u00a0${lang === 'ar' ? 'دج' : 'DA'}`;
const norm = (s = '') => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const clip = (s = '', n = 155) => (s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s);
const fullName = (p) => (norm(p.nom).startsWith(norm(p.marque)) ? p.nom : `${p.marque} ${p.nom}`.trim());
const FALLBACK_IMG = '/assets/img/bellea_pipette_b.svg';
const productPath = (p) => `/${p.type === 'parfum' ? 'parfum' : 'produit'}/${encodeURIComponent(p.id)}/`;

const icon = {
  pharmacist: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="7.5" r="3.5"/><path d="M5 20.5c.6-3.6 3.4-6 7-6s6.4 2.4 7 6"/><path d="M12 15.5v3M10.5 17h3"/></svg>',
  globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.4 3.6 5.2 3.6 8.5s-1.2 6.1-3.6 8.5c-2.4-2.4-3.6-5.2-3.6-8.5S9.6 5.9 12 3.5Z"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 4.5 6v5.5c0 4.6 3.1 8 7.5 9.5 4.4-1.5 7.5-4.9 7.5-9.5V6L12 3Z"/><path d="m8.8 12 2.2 2.2 4.3-4.4"/></svg>',
  refund: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4.5h4.5"/><path d="M12 8v8M14.2 9.6c-.4-.7-1.2-1.1-2.2-1.1-1.3 0-2.2.7-2.2 1.7 0 2.3 4.6 1.2 4.6 3.6 0 1-1 1.8-2.4 1.8-1.1 0-2-.5-2.4-1.3"/></svg>',
  chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>',
  download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12m0 0-4.5-4.5M12 15l4.5-4.5M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>',
  chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12.5a7.5 7.5 0 0 1-11.2 6.5L4 20l1.1-4.3A7.5 7.5 0 1 1 20 12.5Z"/><path d="M9 11h6M9 14h4"/></svg>',
  truck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h11v10H3zM14 9h4l3 3.5V16h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17.5" cy="17.5" r="1.8"/></svg>',
  cash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9.5v5M18 9.5v5"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 3.5 2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z"/></svg>',
  gift: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="8" width="17" height="4" rx="1"/><path d="M5 12v8h14v-8M12 8v12M12 8S10.5 3.5 8 4.5 9 8 12 8Zm0 0s1.5-4.5 4-3.5S15 8 12 8Z"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
  cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 4h2l2.2 10.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.1L21 8H6.2"/><circle cx="9.5" cy="19.5" r="1.3"/><circle cx="17" cy="19.5" r="1.3"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/></svg>',
  close: '<svg class="i-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  menu: '<svg class="i-menu" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
  filter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4"/></svg>',
  flask: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.5 3h5M10 3v6.5L5 18.5A1.7 1.7 0 0 0 6.5 21h11a1.7 1.7 0 0 0 1.5-2.5L14 9.5V3"/><path d="M7.5 15h9"/></svg>',
  camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l1.5-2.5h7L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
  drop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11Z"/></svg>',
};

// ---------------------------------------------------------------------------
// Catalogue
// ---------------------------------------------------------------------------
async function loadProducts() {
  if (SAMPLE) {
    const json = JSON.parse(await readFile(path.join(ROOT, 'data/exemple-produits.json'), 'utf8'));
    return json.produits;
  }
  const [soins, parfums] = await Promise.all([
    firestoreQuery('produit', [eq('disponible', true), eq('loyaltyProd', false)]),
    firestoreQuery('Parfum', [eq('disponible', true)]),
  ]);
  const list = [
    ...soins.map((d) => ({
      id: d.id, type: 'soin',
      nom: d.nomP, marque: d.marque, image: d.photoP,
      prix: d.price, ancienPrix: d.oldPrice,
      effet: d.effetPrincipal, forme: d.forme, volume: d.VolumePoid, unite: d.unite,
      typeDePeau: d.TypeDePeau || [], points: d.fPoints,
      description: d.description, utilisation: d.utilisation, ingredient: d.ingredient,
    })),
    ...parfums.map((d) => ({
      id: d.id, type: 'parfum',
      nom: d.nomP, marque: d.marque, image: d.photoP,
      prix: d.price, ancienPrix: d.oldPrice,
      version: d.VersionParfum, pourQui: d.pourQui, volume: d.VolumePoid, unite: d.unite,
      auMl: Array.isArray(d.FractValu) && d.FractValu.length > 0, points: d.fPoints,
      description: d.description, utilisation: d.utilisation, ingredient: d.ingredient,
    })),
  ];
  return list
    .filter((p) => p.nom && Number(p.prix) > 0)
    .map((p) => ({
      ...p,
      nom: String(p.nom).trim(),
      marque: String(p.marque || '').trim(),
      image: p.image && /^https?:\/\//.test(p.image) ? p.image : FALLBACK_IMG,
      prix: Number(p.prix),
      ancienPrix: Number(p.ancienPrix) || 0,
      points: Number(p.points) || 0,
      volume: Number(p.volume) || 0,
    }));
}

const eq = (field, value) => ({ fieldFilter: { field: { fieldPath: field }, op: 'EQUAL', value: { booleanValue: value } } });

async function firestoreQuery(collection, filters) {
  const url = `https://firestore.googleapis.com/v1/projects/${SITE.firebaseProject}/databases/(default)/documents:runQuery`;
  const body = { structuredQuery: { from: [{ collectionId: collection }], where: filters.length > 1 ? { compositeFilter: { op: 'AND', filters } } : filters[0] } };
  const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`Firestore ${collection} : ${res.status} ${await res.text()}`);
  const rows = await res.json();
  return rows.filter((r) => r.document).map((r) => ({ id: r.document.name.split('/').pop(), ...decode(r.document.fields || {}) }));
}

function decode(fields) {
  const out = {};
  for (const [k, v] of Object.entries(fields)) out[k] = value(v);
  return out;
}
function value(v) {
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(value);
  if ('mapValue' in v) return decode(v.mapValue.fields || {});
  if ('timestampValue' in v) return v.timestampValue;
  return null;
}


// ---------------------------------------------------------------------------
// Langues et adresses
// ---------------------------------------------------------------------------
// Français à la racine, arabe sous /ar/ : /produits/ ↔ /ar/produits/
const loc = (lang, p) => (lang === 'ar' ? `/ar${p}` : p);
const T = Object.fromEntries(LANGS.map((l) => [l, textes(l, { da: daFor(l), freeShipping: SITE.freeShipping })]));

/** Lien Google Play avec la langue et la position du bouton (Play Console > Acquisition). */
const playL = (lang, medium) => play(`${lang}-${medium}`);

// ---------------------------------------------------------------------------
// Mise en page commune
// ---------------------------------------------------------------------------
function layout({ lang, title, description, path: pagePath, body, current, image = '/assets/img/og.png', jsonld = '', bodyClass = '', appbar = true, alt = true }) {
  const t = T[lang];
  const other = t.otherLangCode;
  const canonical = SITE.url + loc(lang, pagePath);
  const ogImage = image.startsWith('http') ? image : SITE.url + image;
  const classes = [bodyClass, appbar ? 'has-appbar' : ''].filter(Boolean).join(' ');
  const navLinks = t.nav.map(([href, label]) => `<a href="${loc(lang, href)}"${current === href ? ' aria-current="page"' : ''}>${label}</a>`).join('\n      ');
  const langLink = alt ? `<a class="lang-switch" href="${loc(other, pagePath)}" hreflang="${other}" lang="${other}">${t.otherLang}</a>` : '';
  return `<!doctype html>
<html lang="${lang}" dir="${t.dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
${alt ? LANGS.map((l) => `<link rel="alternate" hreflang="${l}" href="${SITE.url + loc(l, pagePath)}">`).join('\n') + `\n<link rel="alternate" hreflang="x-default" href="${SITE.url + pagePath}">` : ''}
<meta name="theme-color" content="#ffffff">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Bellea">
<meta property="og:locale" content="${t.ogLocale}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${esc(ogImage)}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/img/favicon.png" type="image/png">
<link rel="apple-touch-icon" href="/assets/img/favicon.png">
${lang === 'ar'
    ? '<link rel="preload" href="/assets/fonts/ibm-plex-sans-arabic-arabic-700-normal.woff2" as="font" type="font/woff2" crossorigin>\n<link rel="preload" href="/assets/fonts/ibm-plex-sans-arabic-arabic-400-normal.woff2" as="font" type="font/woff2" crossorigin>'
    : '<link rel="preload" href="/assets/fonts/pt-serif-latin-700-normal.woff2" as="font" type="font/woff2" crossorigin>\n<link rel="preload" href="/assets/fonts/inter-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>'}
<link rel="stylesheet" href="/assets/site.css">
${jsonld}
</head>
<body${classes ? ` class="${classes}"` : ''}>
<a class="skip" href="#contenu">${t.skip}</a>
<header class="site-header">
  <div class="wrap">
    <a class="brand" href="${loc(lang, '/')}" aria-label="${esc(t.home)}">
      <img class="pipette" src="/assets/img/bellea_pipette_b.svg" alt="" width="16" height="34">
      <img class="wordmark" src="/assets/img/wordmark.png" alt="Bellea" width="99" height="17">
    </a>
    <nav class="nav" id="nav" aria-label="${lang === 'ar' ? 'القائمة الرئيسية' : 'Navigation principale'}">
      ${navLinks}
      ${langLink ? langLink.replace('class="lang-switch"', 'class="lang-switch nav-lang"') : ''}
      <a class="btn btn-primary nav-cta" href="${playL(lang, 'menu')}">${icon.download}${t.ctaHeader}</a>
    </nav>
    ${langLink}
    <a class="btn btn-primary btn-small header-cta" href="${playL(lang, 'entete')}">${t.ctaHeader}</a>
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="nav" aria-label="${t.menuOpen}" data-open="${t.menuOpen}" data-close="${t.menuClose}">${icon.menu}${icon.close}</button>
  </div>
</header>
<main id="contenu">
${body}
</main>
<footer class="site-footer">
  <div class="wrap">
    <div class="footer-grid">
      <div>
        <a class="brand" href="${loc(lang, '/')}" aria-label="${esc(t.home)}">
          <img class="pipette" src="/assets/img/bellea_pipette_b.svg" alt="" width="16" height="34">
          <img class="wordmark" src="/assets/img/wordmark.png" alt="Bellea" width="99" height="17">
        </a>
        <p>${t.footer.tagline}</p>
      </div>
      <div>
        <h2>${t.footer.site}</h2>
        <ul>
          ${t.footer.links.map(([href, label]) => `<li><a href="${loc(lang, href)}">${label}</a></li>`).join('\n          ')}
        </ul>
      </div>
      <div>
        <h2>${t.footer.app}</h2>
        <ul>
          <li><a href="${playL(lang, 'pied-de-page')}">${t.footer.play}</a></li>
          <li><a href="${SITE.cgu}" rel="noopener">${t.footer.cgu}</a></li>
          <li><a href="${SITE.deleteAccount}" rel="noopener">${t.footer.del}</a></li>
          <!-- Contacts : ajouter ici WhatsApp, Instagram, Facebook, TikTok et l'e-mail quand ils seront prêts. -->
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© ${SITE.year} Bellea</span>
      <span>${t.footer.bottom}</span>
    </div>
  </div>
</footer>
${appbar ? `<div class="appbar" id="appbar" aria-hidden="true">
  <img src="/assets/img/favicon.png" alt="" width="40" height="40">
  <div><strong>${t.sticky.title}</strong><span>${t.sticky.sub}</span></div>
  <a class="btn btn-primary" href="${playL(lang, 'barre-mobile')}" tabindex="-1">${t.sticky.btn}</a>
</div>` : ''}
<script src="/assets/site.js" defer></script>
</body>
</html>
`;
}

// ---------------------------------------------------------------------------
// Composants
// ---------------------------------------------------------------------------
const phone = (name, alt, cls = '', eager = false) => `<div class="phone ${cls}">
  <img src="/assets/img/${name}-360.webp" srcset="/assets/img/${name}-360.webp 360w, /assets/img/${name}-720.webp 720w" sizes="(max-width: 600px) 50vw, 300px" alt="${esc(alt)}" width="360" height="702"${eager ? ' fetchpriority="high"' : ' loading="lazy"'}>
</div>`;

const playButton = (lang, medium, label, cls = 'btn-primary', extra = '') =>
  `<a class="btn ${cls}" href="${playL(lang, medium)}"${extra}>${icon.download}${label}</a>`;

function subtitle(p) {
  if (p.type === 'parfum') return [p.version, p.pourQui].filter(Boolean).join(', ');
  return p.effet || '';
}

function card(p, lang, eager = false) {
  const da = daFor(lang);
  const search = norm([p.nom, p.marque, p.effet, p.version, p.pourQui].filter(Boolean).join(' '));
  const promo = p.ancienPrix > p.prix;
  return `<a class="card" href="${loc(lang, productPath(p))}" data-type="${p.type}" data-brand="${esc(p.marque)}" data-search="${esc(search)}">
  <div class="card-img">${promo ? `<span class="card-flag">−${Math.round((1 - p.prix / p.ancienPrix) * 100)}%</span>` : ''}<img src="${esc(p.image)}" alt="${esc(fullName(p))}"${eager ? '' : ' loading="lazy"'} width="300" height="300"></div>
  <div class="card-body">
    <span class="card-brand" dir="auto">${esc(p.marque)}</span>
    <span class="card-name" dir="auto">${esc(p.nom)}</span>
    ${subtitle(p) ? `<span class="card-sub" dir="auto">${esc(subtitle(p))}</span>` : ''}
    <span class="card-price">${da(p.prix)}${promo ? ` <s>${da(p.ancienPrix)}</s>` : ''}</span>
  </div>
</a>`;
}

/** Sélection variée pour les carrousels : promos d'abord, puis une marque après l'autre. */
function pickRail(list, n = 12) {
  const byBrand = new Map();
  for (const p of [...list].sort((a, b) => (b.ancienPrix > b.prix) - (a.ancienPrix > a.prix))) {
    if (!byBrand.has(p.marque)) byBrand.set(p.marque, []);
    byBrand.get(p.marque).push(p);
  }
  const out = [];
  const queues = [...byBrand.values()];
  while (out.length < n && queues.some((q) => q.length)) for (const q of queues) if (q.length && out.length < n) out.push(q.shift());
  return out;
}

function rail({ lang, id, h, sub = '', link, items, eager = false }) {
  const t = T[lang].home;
  if (!items.length) return '';
  return `<div class="rail-block" id="${id}">
  <div class="rail-head">
    <div><h2>${h}</h2>${sub ? `<p>${sub}</p>` : ''}</div>
    <a class="link-more" href="${link}">${T[lang].home.soins.link}${icon.chevron}</a>
  </div>
  <div class="rail-wrap">
    <button class="rail-btn prev" type="button" aria-label="${t.prev}" data-dir="-1">${icon.chevron}</button>
    <ul class="rail" role="list">
      ${items.map((p, i) => `<li>${card(p, lang, eager && i < 3)}</li>`).join('\n      ')}
    </ul>
    <button class="rail-btn next" type="button" aria-label="${t.next}" data-dir="1">${icon.chevron}</button>
  </div>
</div>`;
}

const faqHtml = (items) => `<div class="faq">
${items.map(([q, a]) => `  <details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('\n')}
</div>`;

const faqJsonLd = (items) => `<script type="application/ld+json">${JSON.stringify({
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: items.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
})}</script>`;

function portrait(m) {
  return `<div class="portrait"><!-- Photo : remplacer par <img src="/assets/img/dr-….webp" alt="${esc(m.name)}"> --><span aria-hidden="true">${m.initial}</span></div>`;
}

function teamFull(lang) {
  return `<div class="team">
    ${T[lang].team.map((m) => `<article class="member">
      ${portrait(m)}
      <div>
        <h3>${m.name}</h3>
        <p class="role">${m.role}</p>
        <p class="bio">${m.bio}</p>
      </div>
    </article>`).join('\n    ')}
  </div>`;
}

const originIcons = [icon.pharmacist, icon.globe, icon.shield, icon.refund];

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------
function home(lang, products, qrSvg) {
  const t = T[lang];
  const H = t.home;
  const promos = products.filter((p) => p.ancienPrix > p.prix);
  const soins = pickRail(products.filter((p) => p.type === 'soin'));
  const parfums = pickRail(products.filter((p) => p.type === 'parfum'));
  const appJsonLd = `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org', '@type': 'MobileApplication', name: 'Bellea',
    operatingSystem: 'Android', applicationCategory: 'ShoppingApplication',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'DZD' },
    downloadUrl: `https://play.google.com/store/apps/details?id=${SITE.package}`,
  })}</script>`;
  const faqItems = t.faqHome.map((i) => t.faq[i]);
  const c = H.conseil.card;
  const steps = (arr) => `<ol>${arr.map(([s, note], i) => `<li><b>${i + 1}</b>${s}${note ? `<em>${note}</em>` : ''}</li>`).join('')}</ol>`;

  const body = `
<section class="hero">
  <div class="wrap hero-grid">
    <div class="enter">
      <h1>${H.h1}</h1>
      <p class="hero-lead">${H.lead}</p>
      <div class="hero-actions">
        ${playButton(lang, 'hero', H.cta, 'btn-primary btn-lg', ' data-hero-cta')}
        <a class="link" href="#produits">${H.ctaAlt}</a>
      </div>
      <p class="hero-note">${H.note}</p>
      <ul class="chips" role="list">
        ${H.chips.map((ch) => `<li>${icon.check}${ch}</li>`).join('\n        ')}
      </ul>
    </div>
    <div class="hero-visual">
      <div class="arch"></div>
      ${phone('ecran-parfums', H.phonesAlt[0], 'phone-back', true)}
      ${phone('ecran-fiche-soin', H.phonesAlt[1], 'phone-front', true)}
    </div>
  </div>
</section>

<section class="rails" id="produits">
  <div class="wrap">
    ${promos.length >= 2 ? rail({ lang, id: 'promos', h: H.promo.h, sub: H.promo.sub, link: loc(lang, '/produits/'), items: pickRail(promos), eager: true }) : ''}
    ${rail({ lang, id: 'soins', h: H.soins.h, link: loc(lang, '/produits/'), items: soins, eager: promos.length < 2 })}
    ${rail({ lang, id: 'parfums', h: H.parfums.h, sub: H.parfums.sub, link: loc(lang, '/produits/?type=parfum'), items: parfums })}
  </div>
</section>

<section class="section section-cream" id="app">
  <div class="wrap">
    <div class="section-head">
      <div><h2>${H.app.h}</h2><p class="section-lead">${H.app.sub}</p></div>
    </div>
    <ul class="shots" role="list">
      ${H.app.shots.map(([img, cap, alt]) => `<li><figure>${phone(img, alt)}<figcaption>${cap}</figcaption></figure></li>`).join('\n      ')}
    </ul>
    <div class="shots-cta">${playButton(lang, 'captures', H.cta, 'btn-primary btn-lg')}</div>
  </div>
</section>

<section class="section origin" id="origine">
  <div class="wrap">
    <h2>${H.origin.h}</h2>
    <ul class="g-grid" role="list">
      ${H.origin.items.map(([ti, d], i) => `<li>${originIcons[i]}<strong>${ti}</strong><span>${d}</span></li>`).join('\n      ')}
    </ul>
  </div>
</section>

<section class="section section-cream" id="conseil">
  <div class="wrap split">
    <div>
      <h2>${H.conseil.h}</h2>
      <ol class="steps steps-compact">
        ${H.conseil.steps.map((s) => `<li><strong>${s}</strong></li>`).join('\n        ')}
      </ol>
      <div class="conseil-actions">
        ${playButton(lang, 'conseil', H.conseil.cta, 'btn-primary', '')}
        <a class="link" href="${loc(lang, '/test-peau/')}">${H.conseil.quiz}</a>
      </div>
      <div class="team-mini">
        <p class="team-mini-h">${H.team.h}</p>
        ${t.team.map((m) => `<div class="mini">${portrait(m)}<div><strong>${m.name}</strong><span>${m.role}</span></div></div>`).join('\n        ')}
      </div>
    </div>
    <div class="routine" role="img" aria-label="${esc(c.label)}">
      <div class="routine-head">
        <div class="routine-avatar">${c.initial}</div>
        <div><strong>${c.title}</strong><span>${c.by}</span></div>
      </div>
      <h3>${icon.sun}${c.am}</h3>${steps(c.amSteps)}
      <h3>${icon.moon}${c.pm}</h3>${steps(c.pmSteps)}
      <h3>${icon.calendar}${c.week}</h3>${steps(c.weekSteps)}
      <div class="routine-cta">${icon.cart}${c.cart}</div>
    </div>
  </div>
</section>

<section class="strip">
  <div class="wrap">
    <ul class="strip-grid" role="list">
      ${H.order.map(([ti, d], i) => `<li>${[icon.truck, icon.cash, icon.gift][i]}<div><strong>${ti}</strong><span>${d}</span></div></li>`).join('\n      ')}
    </ul>
  </div>
</section>

<section class="section" id="questions">
  <div class="wrap faq-split">
    <div>
      <h2>${H.faq.h}</h2>
      <p class="section-lead"><a class="link" href="${loc(lang, '/faq/')}">${H.faq.link}</a></p>
    </div>
    ${faqHtml(faqItems)}
  </div>
</section>

<section class="section section-ink" id="telecharger">
  <div class="wrap final">
    <div>
      <img class="pipette-mark" src="/assets/img/bellea_pipette_b_inverse.svg" alt="" width="30" height="64">
      <h2>${H.final.h}</h2>
      <p class="section-lead">${H.final.p}</p>
      ${playButton(lang, 'final', H.final.btn, 'btn-light btn-lg')}
    </div>
    <div class="qr">
      ${qrSvg}
      <p>${H.final.qr}</p>
    </div>
  </div>
</section>`;

  return layout({ lang, title: H.title, description: H.desc, path: '/', current: '/', body, jsonld: appJsonLd + faqJsonLd(faqItems) });
}

function quizPage(lang, products) {
  const t = T[lang];
  const Q = t.pages.quiz;
  const da = daFor(lang);
  const data = {
    ...quizData(lang),
    play: playL(lang, 'test-peau'),
    products: products
      .filter((p) => p.type === 'soin' && (p.typeDePeau || []).length)
      .map((p) => ({
        n: fullName(p), b: p.marque, p: da(p.prix), s: p.typeDePeau,
        i: p.image.startsWith('/') ? BASE + p.image : p.image,
        u: BASE + loc(lang, productPath(p)),
      })),
    str: { progress: Q.progress, back: Q.back, restart: Q.restart, resultH: Q.resultH, sensitive: Q.sensitive, productsH: Q.productsH, ctaH: Q.ctaH, ctaP: Q.ctaP, ctaBtn: Q.ctaBtn, note: Q.note },
  };
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  const body = `
<section class="page-head" style="padding-bottom:24px">
  <div class="wrap">
    <h1>${Q.h1}</h1>
    <p>${Q.sub}</p>
  </div>
</section>
<section class="wrap" style="padding-bottom:var(--section)">
  <div class="quiz" id="quiz" aria-live="polite">
    <noscript><p>${Q.noscript}</p>${playButton(lang, 'test-peau', t.ctaHeader)}</noscript>
  </div>
</section>
<script type="application/json" id="quiz-data">${json}</script>`;
  return layout({ lang, title: Q.title, description: Q.desc, path: '/test-peau/', current: '/test-peau/', body, appbar: false });
}

function pharmaciens(lang) {
  const P = T[lang].pages.pharmaciens;
  const body = `
<section class="page-head">
  <div class="wrap">
    <h1>${P.h1}</h1>
    <p>${P.sub}</p>
  </div>
</section>
<section class="section" style="padding-top:0">
  <div class="wrap">
    ${teamFull(lang)}
  </div>
</section>
<section class="section section-cream">
  <div class="wrap prose">
    <h2>${P.doH}</h2>
    <ul>${P.doList.map((li) => `<li>${li}</li>`).join('')}</ul>
    <div class="callout">
      <p>${P.callout}</p>
      ${playButton(lang, 'pharmaciens', T[lang].ctaHeader)}
    </div>
  </div>
</section>`;
  return layout({ lang, title: P.title, description: P.desc, path: '/pharmaciens/', current: '/pharmaciens/', body });
}

function livraison(lang) {
  const P = T[lang].pages.livraison;
  const block = ([h2, parts]) => `<h2>${h2}</h2>\n${parts.map((x) => (Array.isArray(x) ? `<ul>${x.map((li) => `<li>${li}</li>`).join('')}</ul>` : `<p>${x}</p>`)).join('\n')}`;
  const body = `
<section class="page-head">
  <div class="wrap">
    <h1>${P.h1}</h1>
    <p>${P.sub}</p>
  </div>
</section>
<section class="section" style="padding-top:0">
  <div class="wrap prose">
    ${P.blocks.map(block).join('\n    ')}
    <div class="callout">
      <p>${P.callout}</p>
      ${playButton(lang, 'livraison', T[lang].ctaHeader)}
    </div>
  </div>
</section>`;
  return layout({ lang, title: P.title, description: P.desc, path: '/livraison/', current: '/livraison/', body });
}

function faqPage(lang) {
  const t = T[lang];
  const P = t.pages.faq;
  const body = `
<section class="page-head">
  <div class="wrap">
    <h1>${P.h1}</h1>
    <p>${P.sub}</p>
  </div>
</section>
<section class="section" style="padding-top:0">
  <div class="wrap">
    ${faqHtml(t.faq)}
    <div class="callout" style="max-width:820px">
      <p>${P.callout}</p>
      ${playButton(lang, 'faq', t.ctaHeader)}
    </div>
  </div>
</section>`;
  return layout({ lang, title: P.title, description: P.desc, path: '/faq/', current: '/faq/', body, jsonld: faqJsonLd(t.faq) });
}

function catalogue(lang, products) {
  const C = T[lang].catalogue;
  const body = `
<section class="page-head" style="padding-bottom:24px">
  <div class="wrap">
    <h1>${C.h1}</h1>
    <p>${C.sub}</p>
  </div>
</section>
<section class="wrap" style="padding-bottom:var(--section)">
  <div class="toolbar">
    <div class="tabs" role="group" aria-label="${C.tabsLabel}">
      <button type="button" data-type="soin" aria-pressed="true">${C.soins}</button>
      <button type="button" data-type="parfum" aria-pressed="false">${C.parfums}</button>
    </div>
    <label class="field"><span class="visually-hidden">${C.searchLabel}</span>${icon.search}<input id="q" type="search" placeholder="${esc(C.search)}" autocomplete="off"></label>
    <label><span class="visually-hidden">${C.brand}</span><select id="marque" class="select"><option value="">${C.allBrands}</option></select></label>
  </div>
  <p class="count" id="count" aria-live="polite">${C.many.replace('{n}', products.length)}</p>
  <div class="grid" id="catalogue" style="margin-top:20px" data-one="${esc(C.one)}" data-many="${esc(C.many)}" data-all="${esc(C.allBrands)}">
    ${products.map((p) => card(p, lang)).join('\n    ')}
  </div>
  <div class="empty" id="empty">
    <strong>${C.emptyT}</strong>
    ${C.emptyD}
    <div><button class="btn btn-primary btn-small" type="button" id="reset">${C.reset}</button></div>
  </div>
</section>`;
  return layout({ lang, title: C.title, description: C.desc, path: '/produits/', current: '/produits/', body });
}

function productPage(lang, p, all) {
  const t = T[lang];
  const P = t.product;
  const da = daFor(lang);
  const url = productPath(p);
  const kind = p.type === 'parfum' ? P.parfums : P.soins;
  const tags = p.type === 'parfum'
    ? [p.version, p.pourQui, p.volume ? `${p.volume} ${P.unit(p.unite)}` : '', p.auMl ? P.auMl : '']
    : [p.effet, p.forme, p.volume ? `${p.volume} ${P.unit(p.unite)}` : '', ...(p.typeDePeau || []).map((v) => skinLabel(v, lang))];
  const related = all.filter((o) => o.id !== p.id && o.type === p.type && o.marque === p.marque).slice(0, 4);
  const more = related.length ? related : all.filter((o) => o.id !== p.id && o.type === p.type).slice(0, 4);
  const appLink = `href="${playL(lang, 'fiche-produit')}" data-app-path="${url}"`;
  const desc = clip(`${fullName(p)}${subtitle(p) ? `, ${subtitle(p).toLowerCase()}` : ''} : ${da(p.prix)}. ${p.description || P.metaFallback}`);
  const promo = p.ancienPrix > p.prix;
  const jsonld = `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org', '@type': 'Product',
    name: fullName(p), brand: { '@type': 'Brand', name: p.marque },
    image: p.image.startsWith('http') ? p.image : SITE.url + p.image,
    description: p.description || undefined,
    offers: { '@type': 'Offer', price: String(p.prix), priceCurrency: 'DZD', availability: 'https://schema.org/InStock', url: SITE.url + loc(lang, url) },
  })}</script>`;
  const text = [[P.sections[0], p.description], [P.sections[1], p.utilisation], [P.sections[2], p.ingredient]]
    .filter(([, x]) => x && x.trim())
    .map(([h2, x]) => `<h2>${h2}</h2><p dir="auto">${esc(x.trim())}</p>`).join('\n');
  const buyIcons = [icon.shield, icon.refund, icon.truck, icon.cash];

  const body = `
<div class="wrap">
  <nav class="crumbs" aria-label="${P.crumbs}">
    <a href="${loc(lang, `/produits/${p.type === 'parfum' ? '?type=parfum' : ''}`)}">${kind}</a><span aria-hidden="true">/</span><span dir="auto">${esc(p.marque)}</span>
  </nav>
  <article class="product">
    <div class="product-media">${promo ? `<span class="card-flag">−${Math.round((1 - p.prix / p.ancienPrix) * 100)}%</span>` : ''}<img src="${esc(p.image)}" alt="${esc(fullName(p))}" width="600" height="600" fetchpriority="high"></div>
    <div>
      <p class="product-brand" dir="auto">${esc(p.marque)}</p>
      <h1 dir="auto">${esc(p.nom)}</h1>
      ${tags.filter(Boolean).length ? `<div class="tags">${tags.filter(Boolean).map((x) => `<span class="tag" dir="auto">${esc(x)}</span>`).join('')}</div>` : ''}
      <p class="price">${da(p.prix)}${promo ? ` <s>${da(p.ancienPrix)}</s>` : ''}</p>
      ${p.points > 0 ? `<p class="points">${icon.star}${P.points(Math.round(p.points))}</p>` : ''}
      <div class="buy">
        <a class="btn btn-primary btn-lg" ${appLink}>${icon.download}${P.cta}</a>
        <ul>
          ${P.buy.map((b, i) => `<li>${buyIcons[i]}${b}</li>`).join('\n          ')}
        </ul>
      </div>
      ${text ? `<div class="product-text">${text}</div>` : ''}
      <div class="ask">${icon.chat}<div><strong>${P.askT}</strong><p>${P.askD}</p></div></div>
    </div>
  </article>
</div>
${more.length ? `<section class="section section-cream">
  <div class="wrap">
    <h2 dir="auto">${related.length ? esc(P.related(p.marque)) : P.others(kind)}</h2>
    <div class="grid">${more.map((o) => card(o, lang)).join('\n')}</div>
  </div>
</section>` : ''}
<div class="sticky-cta">
  <span class="price-mini">${da(p.prix)}</span>
  <a class="btn btn-primary" ${appLink}>${P.ctaShort}</a>
</div>`;

  return layout({
    lang, title: `${fullName(p)} : ${da(p.prix)} | Bellea`,
    description: desc, path: url, current: '/produits/', body, image: p.image, jsonld, bodyClass: 'has-sticky', appbar: false,
  });
}

function notFound(lang) {
  const P = T[lang].pages.notFound;
  const body = `
<section class="notfound">
  <div class="wrap">
    <img src="/assets/img/bellea_pipette_b.svg" alt="" width="44" height="96">
    <h1>${P.h1}</h1>
    <p>${P.p}</p>
    <a class="btn btn-primary" href="${loc(lang, '/produits/')}">${P.btn}</a>
  </div>
</section>`;
  return layout({ lang, title: P.title, description: P.h1, path: '/404.html', body, alt: false });
}

// ---------------------------------------------------------------------------
// Fichiers techniques
// ---------------------------------------------------------------------------
const assetlinks = JSON.stringify([{
  relation: ['delegate_permission/common.handle_all_urls'],
  target: {
    namespace: 'android_app',
    package_name: SITE.package,
    // Play Console > Test et publication > Intégrité de l'application > Signature d'application :
    // copier l'empreinte SHA-256 de la « clé de signature d'application » (et celle de la clé d'importation).
    sha256_cert_fingerprints: ['REMPLACER_PAR_EMPREINTE_SHA256_PLAY_CONSOLE'],
  },
}], null, 2);

function sitemap(products) {
  const today = new Date().toISOString().slice(0, 10);
  const paths = ['/', '/produits/', '/test-peau/', '/pharmaciens/', '/livraison/', '/faq/', ...products.map(productPath)];
  const urls = LANGS.flatMap((l) => paths.map((p) => loc(l, p)));
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${SITE.url}${u}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`;
}

// ---------------------------------------------------------------------------
// Génération
// ---------------------------------------------------------------------------
// Typographie française : espace insécable avant ? ! : ; % » et après «
const frenchSpaces = (html) => html.replace(/ ([?!:;%»])/g, ' $1').replace(/« /g, '« ');

const withBase = (html) => !BASE ? html : html
  .replace(/(href|src)="\/(?!\/)/g, `$1="${BASE}/`)
  .replace(/(srcset="|, )\/assets\//g, `$1${BASE}/assets/`);

// Empreinte du contenu dans l'adresse des fichiers (…/ecran.webp?v=3f2a9c1b) :
// quand une image, le CSS ou le JS change, les navigateurs chargent la
// nouvelle version au lieu de garder l'ancienne en cache.
const ASSET_SRC = { 'assets/img/': 'src/img/', 'assets/fonts/': 'src/fonts/', 'assets/site.css': 'src/site.css', 'assets/site.js': 'src/site.js' };
const hashCache = new Map();
function assetHash(assetPath) {
  if (hashCache.has(assetPath)) return hashCache.get(assetPath);
  const prefix = Object.keys(ASSET_SRC).find((k) => assetPath.startsWith(k));
  const file = prefix && path.join(ROOT, ASSET_SRC[prefix] + assetPath.slice(prefix.length));
  const h = file && existsSync(file) ? createHash('md5').update(readFileSync(file)).digest('hex').slice(0, 8) : '';
  hashCache.set(assetPath, h);
  return h;
}
const withVersions = (html) => html.replace(/\/(assets\/[\w./-]+\.(?:webp|png|svg|jpg|css|js|woff2))(?![\w?])/g,
  (m, asset) => { const h = assetHash(asset); return h ? `${m}?v=${h}` : m; });

async function write(rel, content) {
  if (rel.endsWith('.html')) {
    if (!rel.startsWith('ar/')) content = frenchSpaces(content);
    content = withVersions(withBase(content));
  }
  const file = path.join(DIST, rel);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, content);
}

async function main() {
  const products = (await loadProducts())
    .map((p) => ({ ...p, nom: p.nom.replace(/ %/g, '\u00a0%') })) // « 7 % » ne se coupe jamais en fin de ligne
    .sort((a, b) => a.marque.localeCompare(b.marque, 'fr') || a.nom.localeCompare(b.nom, 'fr'));
  if (existsSync(DIST)) await rm(DIST, { recursive: true });
  await mkdir(DIST, { recursive: true });
  await cp(path.join(ROOT, 'src/img'), path.join(DIST, 'assets/img'), { recursive: true });
  await cp(path.join(ROOT, 'src/fonts'), path.join(DIST, 'assets/fonts'), { recursive: true });
  const css = await readFile(path.join(ROOT, 'src/site.css'), 'utf8');
  await write('assets/site.css', css.replaceAll('url("/assets/', `url("${BASE}/assets/`));
  await cp(path.join(ROOT, 'src/site.js'), path.join(DIST, 'assets/site.js'));

  const qr = await QRCode.toString(play('qr-code'), { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: '#141414', light: '#ffffff' } });
  const qrSvg = qr.replace('<svg ', '<svg role="img" aria-label="QR code Google Play" ');

  for (const lang of LANGS) {
    const dir = lang === 'ar' ? 'ar/' : '';
    await write(`${dir}index.html`, home(lang, products, qrSvg));
    await write(`${dir}produits/index.html`, catalogue(lang, products));
    await write(`${dir}pharmaciens/index.html`, pharmaciens(lang));
    await write(`${dir}test-peau/index.html`, quizPage(lang, products));
    await write(`${dir}livraison/index.html`, livraison(lang));
    await write(`${dir}faq/index.html`, faqPage(lang));
    for (const p of products) await write(`${dir}${productPath(p).slice(1)}index.html`, productPage(lang, p, products));
  }
  await write('404.html', notFound('fr'));
  await write('ar/404.html', notFound('ar'));
  await write('.well-known/assetlinks.json', assetlinks);
  await write('sitemap.xml', sitemap(products));
  await write('CNAME', 'bellea.store\n');   // domaine pour GitHub Pages
  await write('.nojekyll', '');              // GitHub Pages : publier aussi /.well-known/
  await write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${SITE.url}/sitemap.xml\n`);

  console.log(`Site généré dans dist/ : ${products.length} fiches produit × ${LANGS.length} langues${SAMPLE ? ' (exemple)' : ''}${BASE ? `, adresses sous ${BASE}/` : ''}.`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
