#!/usr/bin/env node
// Génère le site Bellea dans « dist/ ».
//
//   npm run build           → lit le catalogue dans Firebase (lecture publique)
//   npm run build:exemple   → utilise data/exemple-produits.json (sans réseau)
//
// Toutes les pages partagent la même mise en page (layout) : en-tête, pied de
// page et liens Google Play sont définis une seule fois, ici.

import { mkdir, rm, cp, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';

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
const da = (n) => `${Math.round(n).toLocaleString('fr-FR').replace(/ | /g, ' ')} DA`;
const norm = (s = '') => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const clip = (s = '', n = 155) => (s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s);
const fullName = (p) => (norm(p.nom).startsWith(norm(p.marque)) ? p.nom : `${p.marque} ${p.nom}`.trim());
const FALLBACK_IMG = '/assets/img/bellea_pipette_b.svg';
const productPath = (p) => `/${p.type === 'parfum' ? 'parfum' : 'produit'}/${encodeURIComponent(p.id)}/`;

const icon = {
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
// Mise en page commune
// ---------------------------------------------------------------------------
const NAV = [
  ['/produits/', 'Catalogue'],
  ['/pharmaciens/', 'Les pharmaciens'],
  ['/livraison/', 'Livraison'],
  ['/faq/', 'Questions'],
];

function layout({ title, description, path: pagePath, body, current, image = '/assets/img/og.png', jsonld = '', bodyClass = '' }) {
  const canonical = SITE.url + pagePath;
  const ogImage = image.startsWith('http') ? image : SITE.url + image;
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
<meta name="theme-color" content="#ffffff">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Bellea">
<meta property="og:locale" content="fr_DZ">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${esc(ogImage)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="google-play-app" content="app-id=${SITE.package}">
<link rel="icon" href="/assets/img/favicon.png" type="image/png">
<link rel="apple-touch-icon" href="/assets/img/favicon.png">
<link rel="preload" href="/assets/fonts/pt-serif-latin-700-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/inter-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/site.css">
${jsonld}
</head>
<body${bodyClass ? ` class="${bodyClass}"` : ''}>
<a class="skip" href="#contenu">Aller au contenu</a>
<header class="site-header">
  <div class="wrap">
    <a class="brand" href="/" aria-label="Bellea, accueil">
      <img class="pipette" src="/assets/img/bellea_pipette_b.svg" alt="" width="16" height="34">
      <img class="wordmark" src="/assets/img/wordmark.png" alt="Bellea" width="99" height="17">
    </a>
    <nav class="nav" id="nav" aria-label="Navigation principale">
      ${NAV.map(([href, label]) => `<a href="${href}"${current === href ? ' aria-current="page"' : ''}>${label}</a>`).join('\n      ')}
      <a class="btn btn-primary nav-cta" href="${play('menu')}">${icon.download}Télécharger l'app</a>
    </nav>
    <a class="btn btn-primary btn-small header-cta" href="${play('entete')}">Télécharger l'app</a>
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="nav" aria-label="Ouvrir le menu">${icon.menu}${icon.close}</button>
  </div>
</header>
<main id="contenu">
${body}
</main>
<footer class="site-footer">
  <div class="wrap">
    <div class="footer-grid">
      <div>
        <a class="brand" href="/" aria-label="Bellea, accueil">
          <img class="pipette" src="/assets/img/bellea_pipette_b.svg" alt="" width="16" height="34">
          <img class="wordmark" src="/assets/img/wordmark.png" alt="Bellea" width="99" height="17">
        </a>
        <p>Dermo-cosmétique et parfums, choisis avec des pharmaciens. Commandez dans l'application, livraison dans toutes les wilayas.</p>
      </div>
      <div>
        <h2>Le site</h2>
        <ul>
          <li><a href="/produits/">Catalogue des soins</a></li>
          <li><a href="/produits/?type=parfum">Catalogue des parfums</a></li>
          <li><a href="/pharmaciens/">Les pharmaciens</a></li>
          <li><a href="/livraison/">Livraison et paiement</a></li>
          <li><a href="/faq/">Questions fréquentes</a></li>
        </ul>
      </div>
      <div>
        <h2>L'application</h2>
        <ul>
          <li><a href="${play('pied-de-page')}">Bellea sur Google Play</a></li>
          <li><a href="${SITE.cgu}" rel="noopener">CGU et confidentialité</a></li>
          <li><a href="${SITE.deleteAccount}" rel="noopener">Supprimer mon compte</a></li>
          <!-- Contacts : ajouter ici WhatsApp, Instagram, Facebook, TikTok et l'e-mail quand ils seront prêts. -->
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© ${SITE.year} Bellea</span>
      <span>Application Android, boutique 100 % en ligne</span>
    </div>
  </div>
</footer>
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

const playButton = (medium, label = 'Télécharger sur Google Play', cls = 'btn-primary') =>
  `<a class="btn ${cls}" href="${play(medium)}">${icon.download}${label}</a>`;

function subtitle(p) {
  if (p.type === 'parfum') return [p.version, p.pourQui].filter(Boolean).join(', ');
  return p.effet || '';
}

function card(p) {
  const search = norm([p.nom, p.marque, p.effet, p.version, p.pourQui].filter(Boolean).join(' '));
  return `<a class="card" href="${productPath(p)}" data-type="${p.type}" data-brand="${esc(p.marque)}" data-search="${esc(search)}">
  <div class="card-img"><img src="${esc(p.image)}" alt="${esc(fullName(p))}" loading="lazy" width="300" height="300"></div>
  <div class="card-body">
    <span class="card-brand">${esc(p.marque)}</span>
    <span class="card-name">${esc(p.nom)}</span>
    ${subtitle(p) ? `<span class="card-sub">${esc(subtitle(p))}</span>` : ''}
    <span class="card-price">${da(p.prix)}${p.ancienPrix > p.prix ? ` <s>${da(p.ancienPrix)}</s>` : ''}</span>
  </div>
</a>`;
}

const FAQ = [
  ['Peut-on commander sur le site ?', "Non. Le site présente le catalogue. Les commandes se font dans l'application Bellea, gratuite sur Google Play."],
  ['Comment se passe la livraison ?', `Bellea livre dans toutes les wilayas d'Algérie, à domicile ou au bureau de la société de livraison. Nous travaillons avec plusieurs sociétés : les frais dépendent de votre wilaya et de la société choisie, et s'affichent avant de valider la commande. La livraison est offerte dès ${da(SITE.freeShipping)} d'achat.`],
  ['Comment je paie ?', 'À la livraison : vous payez le livreur quand vous recevez votre colis.'],
  ['Qui répond à mes questions sur ma peau ?', "Dr. Soumia et Dr. Fodil, pharmaciens. Dans l'onglet Conseils de l'application, vous décrivez votre peau, ajoutez des photos si vous le souhaitez, et recevez une réponse avec une routine adaptée."],
  ['Peut-on acheter un parfum au millilitre ?', "Oui, pour les parfums qui le proposent. Sur la fiche du parfum dans l'app, choisissez « Achat au ml » au lieu de « Produit entier » : pratique pour essayer avant d'acheter le flacon."],
  ['Comment marchent les points fidélité ?', "Chaque produit affiche les points qu'il rapporte. Ils sont ajoutés à votre compte à la livraison, et vous les échangez contre des produits dans la Boutique fidélité de l'app."],
  ["L'application existe-t-elle sur iPhone ?", "Pas encore. Bellea est disponible sur Android, via Google Play."],
  ['Avez-vous une boutique physique ?', "Pas pour le moment. Bellea est une boutique 100 % en ligne : tout se passe dans l'application."],
];

const faqHtml = (items) => `<div class="faq">
${items.map(([q, a]) => `  <details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('\n')}
</div>`;

const faqJsonLd = (items) => `<script type="application/ld+json">${JSON.stringify({
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: items.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
})}</script>`;

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------
function home(products, qrSvg) {
  const pick = [...products.filter((p) => p.type === 'soin').slice(0, 2), ...products.filter((p) => p.type === 'parfum').slice(0, 2)];
  const selection = (pick.length >= 4 ? pick : products.slice(0, 4));
  const appJsonLd = `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org', '@type': 'MobileApplication', name: 'Bellea',
    operatingSystem: 'Android', applicationCategory: 'ShoppingApplication',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'DZD' },
    downloadUrl: `https://play.google.com/store/apps/details?id=${SITE.package}`,
  })}</script>`;

  const body = `
<section class="hero">
  <div class="wrap">
    <div class="hero-grid">
      <div class="enter">
        <h1>Vos soins et parfums, choisis avec un pharmacien.</h1>
        <p class="hero-lead">Bellea est l'application de Dr. Soumia et Dr. Fodil, pharmaciens. Posez votre question, recevez une routine pour votre peau et commandez au même endroit.</p>
        <div class="hero-actions">
          ${playButton('hero')}
          <a class="link" href="/produits/">Voir le catalogue</a>
        </div>
        <p class="hero-note">Gratuit, pour Android.</p>
      </div>
      <div class="hero-visual">
        <div class="arch"></div>
        ${phone('ecran-parfums', "Écran Parfums de l'application Bellea", 'phone-back', true)}
        ${phone('ecran-fiche-soin', "Fiche produit dans l'application : The Ordinary Acide Glycolique 7 %, 6 000 DA", 'phone-front', true)}
      </div>
    </div>
    <ul class="facts" role="list">
      <li class="fact">${icon.chat}<div><strong>Réponse d'un pharmacien</strong><span>Questions et consultation dans l'app</span></div></li>
      <li class="fact">${icon.truck}<div><strong>Toutes les wilayas</strong><span>À domicile ou au bureau de livraison</span></div></li>
      <li class="fact">${icon.cash}<div><strong>Paiement à la livraison</strong><span>Vous payez à la réception du colis</span></div></li>
      <li class="fact">${icon.star}<div><strong>Points fidélité</strong><span>À chaque commande, à échanger contre des produits</span></div></li>
    </ul>
  </div>
</section>

<section class="section section-cream" id="conseil">
  <div class="wrap split">
    <div>
      <h2>Décrivez votre peau. Recevez votre routine.</h2>
      <p class="section-lead">La consultation se fait dans l'onglet Conseils de l'application. Un pharmacien lit votre demande, regarde vos photos et vous répond.</p>
      <ol class="steps">
        <li><strong>Vous décrivez votre peau en 7 étapes</strong><span>Préoccupations, zones du visage, routine actuelle, allergies. Photos guidées si vous le souhaitez.</span></li>
        <li><strong>Un pharmacien vous répond</strong><span>Avec une routine en trois temps : le matin, le soir et chaque semaine, étape par étape.</span></li>
        <li><strong>Vous ajoutez la routine au panier</strong><span>Un seul bouton met tous les produits conseillés dans votre panier.</span></li>
        <li><strong>On fait le point à 14 et 30 jours</strong><span>Un suivi avec photos avant et après, pour ajuster si besoin.</span></li>
      </ol>
      <p style="margin-top:28px">Pas le temps d'une consultation ? Le test « Quel est mon type de peau ? » se fait en 8 questions.</p>
    </div>
    <div class="routine" role="img" aria-label="Exemple de réponse dans l'application : une routine matin, soir et chaque semaine, avec un bouton pour tout ajouter au panier">
      <div class="routine-head">
        <div class="routine-avatar">S</div>
        <div><strong>Votre routine personnalisée</strong><span>Réponse de votre pharmacienne</span></div>
      </div>
      <h3>${icon.sun}Matin</h3>
      <ol><li><b>1</b>Nettoyant doux</li><li><b>2</b>Sérum ciblé</li><li><b>3</b>Écran solaire<em>SPF 50</em></li></ol>
      <h3>${icon.moon}Soir</h3>
      <ol><li><b>1</b>Démaquillant</li><li><b>2</b>Crème de nuit</li></ol>
      <h3>${icon.calendar}Chaque semaine</h3>
      <ol><li><b>1</b>Exfoliant<em>1 à 2 fois</em></li></ol>
      <div class="routine-cta">${icon.cart}Ajouter toute ma routine au panier</div>
    </div>
  </div>
</section>

<section class="section" id="pharmaciens">
  <div class="wrap">
    <h2>Deux pharmaciens derrière l'application.</h2>
    <p class="section-lead">Ce sont eux qui choisissent les produits du catalogue et qui répondent à vos questions.</p>
    ${teamHtml()}
  </div>
</section>

<section class="section section-cream" id="boutique">
  <div class="wrap split">
    <div class="screens">
      <div class="arch"></div>
      ${phone('ecran-boutique', "Écran Boutique de l'application : filtres par marque, objectif et type de peau")}
    </div>
    <div>
      <h2>La dermo-cosmétique, triée par objectif et par type de peau.</h2>
      <ul class="feature-list">
        <li>${icon.filter}<div><strong>Des filtres qui parlent de votre peau</strong><span>Par marque, par objectif (nettoyage, exfoliation…) et par type de peau.</span></div></li>
        <li>${icon.chat}<div><strong>Une question sur un produit ?</strong><span>Depuis la fiche, demandez s'il convient à votre peau, comment l'utiliser ou s'il est compatible avec votre routine.</span></div></li>
        <li>${icon.gift}<div><strong>Promotions et livraison offerte</strong><span>Les offres du moment sont signalées sur chaque produit.</span></div></li>
      </ul>
      <p class="brands-line">Au catalogue : <b>Eucerin</b>, <b>Bioderma</b>, <b>The Ordinary</b>, <b>Papulex</b> et d'autres marques.</p>
    </div>
  </div>
</section>

<section class="section" id="parfums">
  <div class="wrap split reverse">
    <div class="screens">
      <div class="arch"></div>
      ${phone('ecran-fiche-parfum', "Fiche parfum dans l'application : Yves Saint Laurent Libre, 90 ml, 32 000 DA, achat en flacon entier ou au millilitre")}
    </div>
    <div>
      <h2>Votre parfum en flacon entier, ou au millilitre.</h2>
      <p class="section-lead">Sur les parfums qui le proposent, choisissez « Achat au ml » : vous prenez la quantité que vous voulez pour essayer avant d'acheter le flacon.</p>
      <ul class="feature-list">
        <li>${icon.flask}<div><strong>Achat au ml</strong><span>Une petite quantité d'un grand parfum, au prix juste.</span></div></li>
        <li>${icon.filter}<div><strong>Filtres par marque, version et pour qui</strong><span>Eau de parfum, eau de toilette, femme, homme ou mixte.</span></div></li>
        <li>${icon.star}<div><strong>Des points sur chaque flacon</strong><span>Par exemple +20 points fidélité sur un parfum à ${da(32000)}.</span></div></li>
      </ul>
    </div>
  </div>
</section>

<section class="section section-cream" id="commander">
  <div class="wrap">
    <h2>Commandez dans l'app, payez à la réception.</h2>
    <div class="order-grid">
      <div class="order-item">${icon.truck}<h3>Toutes les wilayas</h3><p>À domicile ou au bureau de la société de livraison, au choix.</p></div>
      <div class="order-item">${icon.cash}<h3>Frais affichés avant de valider</h3><p>Ils dépendent de votre wilaya et de la société de livraison.</p></div>
      <div class="order-item">${icon.gift}<h3>Offerte dès ${da(SITE.freeShipping)}</h3><p>Le panier vous indique combien il reste pour en profiter.</p></div>
      <div class="order-item">${icon.star}<h3>Des points à chaque commande</h3><p>Ajoutés à la livraison, à échanger dans la Boutique fidélité.</p></div>
    </div>
  </div>
</section>

${selection.length ? `<section class="section" id="selection">
  <div class="wrap">
    <div class="section-head">
      <h2>Quelques produits du catalogue</h2>
      <a class="link" href="/produits/">Voir tout le catalogue</a>
    </div>
    <div class="grid">
      ${selection.map(card).join('\n      ')}
    </div>
  </div>
</section>` : ''}

<section class="section section-cream" id="questions">
  <div class="wrap faq-split">
    <div>
      <h2>Vos questions</h2>
      <p class="section-lead">Toutes les réponses sont sur la page <a class="link" href="/faq/">questions fréquentes</a>.</p>
    </div>
    ${faqHtml(FAQ.slice(0, 5))}
  </div>
</section>

<section class="section section-ink" id="telecharger">
  <div class="wrap final">
    <div>
      <img class="pipette-mark" src="/assets/img/bellea_pipette_b_inverse.svg" alt="" width="30" height="64">
      <h2>Bellea est sur Google Play.</h2>
      <p class="section-lead">Téléchargez l'application, posez votre première question à un pharmacien et découvrez tout le catalogue.</p>
      ${playButton('final', 'Télécharger sur Google Play', 'btn-light')}
    </div>
    <div class="qr">
      ${qrSvg}
      <p>Scannez avec votre téléphone</p>
    </div>
  </div>
</section>`;

  return layout({
    title: 'Bellea : soins et parfums conseillés par des pharmaciens | Application Android',
    description: "Bellea, l'application de dermo-cosmétique et de parfums de deux pharmaciens. Conseil personnalisé, routine pour votre peau, livraison dans toutes les wilayas et paiement à la livraison.",
    path: '/', current: '/', body, jsonld: appJsonLd + faqJsonLd(FAQ.slice(0, 5)),
  });
}

function teamHtml() {
  return `<div class="team">
      <article class="member">
        <div class="portrait"><!-- Photo : remplacer par <img src="/assets/img/dr-soumia.webp" alt="Dr. Soumia"> --><span aria-hidden="true">S</span></div>
        <div>
          <h3>Dr. Soumia</h3>
          <p class="role">Pharmacienne diplômée, spécialisée en dermocosmétique</p>
          <p class="bio">Elle vous conseille et vous accompagne dans le choix des soins adaptés à votre peau.</p>
        </div>
      </article>
      <article class="member">
        <div class="portrait"><!-- Photo : remplacer par <img src="/assets/img/dr-fodil.webp" alt="Dr. Fodil"> --><span aria-hidden="true">F</span></div>
        <div>
          <h3>Dr. Fodil</h3>
          <p class="role">Pharmacien diplômé</p>
          <p class="bio">« Passionné par le domaine médical et la dermocosmétique, je mets mes connaissances au service du conseil et de l'accompagnement en santé et soins de la peau. »</p>
        </div>
      </article>
    </div>
    <p class="team-note">Bellea est une boutique 100 % en ligne pour le moment : pas de comptoir, tout se passe dans l'application, du conseil jusqu'à la livraison.</p>`;
}

function pharmaciens() {
  const body = `
<section class="page-head">
  <div class="wrap">
    <h1>Les pharmaciens de Bellea</h1>
    <p>Bellea réunit des pharmaciens passionnés par la santé et la beauté de la peau. Ils choisissent les produits du catalogue et vous conseillent, dans l'application.</p>
  </div>
</section>
<section class="section" style="padding-top:0">
  <div class="wrap">
    ${teamHtml()}
  </div>
</section>
<section class="section section-cream">
  <div class="wrap prose">
    <h2>Ce qu'ils font pour vous</h2>
    <ul>
      <li>Ils répondent à vos questions sur un produit : est-il adapté à votre peau, comment l'utiliser, est-il compatible avec votre routine.</li>
      <li>Ils lisent vos consultations, avec vos photos si vous en ajoutez, et vous proposent une routine pour le matin, le soir et chaque semaine.</li>
      <li>Ils prennent de vos nouvelles à 14 et 30 jours pour ajuster la routine si besoin.</li>
      <li>Ils sélectionnent la dermo-cosmétique et les parfums proposés dans la boutique.</li>
    </ul>
    <div class="callout">
      <p>Posez votre première question dans l'application.</p>
      ${playButton('pharmaciens')}
    </div>
  </div>
</section>`;
  return layout({
    title: 'Les pharmaciens de Bellea : Dr. Soumia et Dr. Fodil',
    description: "Dr. Soumia, pharmacienne spécialisée en dermocosmétique, et Dr. Fodil, pharmacien, vous conseillent dans l'application Bellea.",
    path: '/pharmaciens/', current: '/pharmaciens/', body,
  });
}

function livraison() {
  const body = `
<section class="page-head">
  <div class="wrap">
    <h1>Livraison et paiement</h1>
    <p>Vous commandez dans l'application, nous livrons dans toutes les wilayas, vous payez à la réception.</p>
  </div>
</section>
<section class="section" style="padding-top:0">
  <div class="wrap prose">
    <h2>Où livrons-nous ?</h2>
    <p>Dans toutes les wilayas d'Algérie. Au moment de commander, vous choisissez :</p>
    <ul>
      <li><strong>À domicile</strong> : le livreur vous apporte le colis à l'adresse indiquée.</li>
      <li><strong>Au bureau</strong> : vous récupérez le colis au bureau de la société de livraison.</li>
    </ul>
    <h2>Combien coûte la livraison ?</h2>
    <p>Bellea travaille avec plusieurs sociétés de livraison. Les frais dépendent donc de votre wilaya et de la société, et s'affichent dans l'application avant de valider la commande. Pas de surprise à la réception.</p>
    <p>La livraison est <strong>offerte dès ${da(SITE.freeShipping)} d'achat</strong>. Le panier vous indique combien il vous reste pour en profiter, et certains produits sont livrés gratuitement quel que soit le montant.</p>
    <h2>Comment payer ?</h2>
    <p>À la livraison, au livreur, quand vous recevez votre colis.</p>
    <h2>Suivre sa commande</h2>
    <p>Dans l'application, la rubrique « Mes commandes » montre où en est chaque commande et les points fidélité qu'elle vous rapporte.</p>
    <div class="callout">
      <p>Le catalogue complet et la commande sont dans l'application.</p>
      ${playButton('livraison')}
    </div>
  </div>
</section>`;
  return layout({
    title: 'Livraison dans toutes les wilayas et paiement à la livraison | Bellea',
    description: `Bellea livre dans toutes les wilayas d'Algérie, à domicile ou au bureau. Paiement à la livraison, livraison offerte dès ${SITE.freeShipping.toLocaleString('fr-FR')} DA.`,
    path: '/livraison/', current: '/livraison/', body,
  });
}

function faqPage() {
  const body = `
<section class="page-head">
  <div class="wrap">
    <h1>Questions fréquentes</h1>
    <p>Commande, livraison, conseils et fidélité : l'essentiel en quelques lignes.</p>
  </div>
</section>
<section class="section" style="padding-top:0">
  <div class="wrap">
    ${faqHtml(FAQ)}
    <div class="callout" style="max-width:820px">
      <p>Une autre question ? Posez-la à un pharmacien dans l'application.</p>
      ${playButton('faq')}
    </div>
  </div>
</section>`;
  return layout({
    title: 'Questions fréquentes | Bellea',
    description: "Commander, livraison, paiement, conseils de pharmaciens, parfums au millilitre, points fidélité : les réponses aux questions sur l'application Bellea.",
    path: '/faq/', current: '/faq/', body, jsonld: faqJsonLd(FAQ),
  });
}

function catalogue(products) {
  const body = `
<section class="page-head" style="padding-bottom:24px">
  <div class="wrap">
    <h1>Le catalogue Bellea</h1>
    <p>Consultez les produits ici, commandez-les dans l'application.</p>
  </div>
</section>
<section class="wrap" style="padding-bottom:var(--section)">
  <div class="toolbar">
    <div class="tabs" role="group" aria-label="Type de produit">
      <button type="button" data-type="soin" aria-pressed="true">Soins</button>
      <button type="button" data-type="parfum" aria-pressed="false">Parfums</button>
    </div>
    <label class="field"><span class="visually-hidden">Rechercher un produit</span>${icon.search}<input id="q" type="search" placeholder="Rechercher un produit ou une marque" autocomplete="off"></label>
    <label><span class="visually-hidden">Marque</span><select id="marque" class="select"><option value="">Toutes les marques</option></select></label>
  </div>
  <p class="count" id="count" aria-live="polite">${products.length} produits</p>
  <div class="grid" id="catalogue" style="margin-top:20px">
    ${products.map(card).join('\n    ')}
  </div>
  <div class="empty" id="empty">
    <strong>Aucun produit ne correspond.</strong>
    Essayez un autre mot ou une autre marque.
    <div><button class="btn btn-primary btn-small" type="button" id="reset">Effacer la recherche</button></div>
  </div>
</section>`;
  return layout({
    title: 'Catalogue : dermo-cosmétique et parfums | Bellea',
    description: "Tous les soins de dermo-cosmétique et parfums de Bellea, avec leurs prix. Commande dans l'application, livraison dans toutes les wilayas.",
    path: '/produits/', current: '/produits/', body,
  });
}

function productPage(p, all) {
  const url = productPath(p);
  const kind = p.type === 'parfum' ? 'Parfums' : 'Soins';
  const tags = p.type === 'parfum'
    ? [p.version, p.pourQui, p.volume ? `${p.volume} ${p.unite || 'ml'}` : '', p.auMl ? 'Disponible au ml' : '']
    : [p.effet, p.forme, p.volume ? `${p.volume} ${p.unite}` : '', ...(p.typeDePeau || []).map((t) => `Peau ${t.toLowerCase()}`)];
  const related = all.filter((o) => o.id !== p.id && o.type === p.type && o.marque === p.marque).slice(0, 4);
  const more = related.length ? related : all.filter((o) => o.id !== p.id && o.type === p.type).slice(0, 4);
  const appLink = `href="${play('fiche-produit')}" data-app-path="${url}"`;
  const desc = clip(`${fullName(p)}${subtitle(p) ? `, ${subtitle(p).toLowerCase()}` : ''} à ${da(p.prix)}. ${p.description || "Commandez-le dans l'application Bellea, livraison dans toutes les wilayas et paiement à la livraison."}`);
  const jsonld = `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org', '@type': 'Product',
    name: fullName(p), brand: { '@type': 'Brand', name: p.marque },
    image: p.image.startsWith('http') ? p.image : SITE.url + p.image,
    description: p.description || undefined,
    offers: { '@type': 'Offer', price: String(p.prix), priceCurrency: 'DZD', availability: 'https://schema.org/InStock', url: SITE.url + url },
  })}</script>`;

  const text = [['Description', p.description], ["Mode d'emploi", p.utilisation], ['Ingrédients', p.ingredient]]
    .filter(([, t]) => t && t.trim())
    .map(([h, t]) => `<h2>${h}</h2><p>${esc(t.trim())}</p>`).join('\n');

  const body = `
<div class="wrap">
  <nav class="crumbs" aria-label="Fil d'Ariane">
    <a href="/produits/${p.type === 'parfum' ? '?type=parfum' : ''}">${kind}</a><span aria-hidden="true">/</span><span>${esc(p.marque)}</span>
  </nav>
  <article class="product">
    <div class="product-media"><img src="${esc(p.image)}" alt="${esc(fullName(p))}" width="600" height="600" fetchpriority="high"></div>
    <div>
      <p class="product-brand">${esc(p.marque)}</p>
      <h1>${esc(p.nom)}</h1>
      ${tags.filter(Boolean).length ? `<div class="tags">${tags.filter(Boolean).map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>` : ''}
      <p class="price">${da(p.prix)}${p.ancienPrix > p.prix ? ` <s>${da(p.ancienPrix)}</s>` : ''}</p>
      ${p.points > 0 ? `<p class="points">${icon.star}+${Math.round(p.points)} points fidélité</p>` : ''}
      <div class="buy">
        <a class="btn btn-primary" ${appLink}>${icon.download}Commander dans l'app</a>
        <ul>
          <li>${icon.check}Application gratuite sur Google Play</li>
          <li>${icon.check}Livraison dans toutes les wilayas, offerte dès ${da(SITE.freeShipping)}</li>
          <li>${icon.check}Paiement à la livraison</li>
        </ul>
      </div>
      ${text ? `<div class="product-text">${text}</div>` : ''}
      <div class="ask">${icon.chat}<div><strong>Une question sur ce produit ?</strong><p>Est-il adapté à votre peau ? Comment l'utiliser ? Un pharmacien vous répond dans l'application.</p></div></div>
    </div>
  </article>
</div>
${more.length ? `<section class="section section-cream">
  <div class="wrap">
    <h2>${related.length ? `Aussi chez ${esc(p.marque)}` : `D'autres ${kind.toLowerCase()}`}</h2>
    <div class="grid">${more.map(card).join('\n')}</div>
  </div>
</section>` : ''}
<div class="sticky-cta">
  <span class="price-mini">${da(p.prix)}</span>
  <a class="btn btn-primary" ${appLink}>Commander dans l'app</a>
</div>`;

  return layout({
    title: `${fullName(p)} : ${da(p.prix)} | Bellea`,
    description: desc, path: url, current: '/produits/', body, image: p.image, jsonld, bodyClass: 'has-sticky',
  });
}

function notFound() {
  const body = `
<section class="notfound">
  <div class="wrap">
    <img src="/assets/img/bellea_pipette_b.svg" alt="" width="44" height="96">
    <h1>Cette page n'existe pas ou plus.</h1>
    <p>Le produit a peut-être été retiré du catalogue.</p>
    <a class="btn btn-primary" href="/produits/">Voir le catalogue</a>
  </div>
</section>`;
  return layout({ title: 'Page introuvable | Bellea', description: 'Cette page n’existe pas.', path: '/404.html', body });
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
  const urls = ['/', '/produits/', '/pharmaciens/', '/livraison/', '/faq/', ...products.map(productPath)];
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
const frenchSpaces = (html) => html.replace(/ ([?!:;%»])/g, '\u00a0$1').replace(/« /g, '«\u00a0');

const withBase = (html) => !BASE ? html : html
  .replace(/(href|src)="\/(?!\/)/g, `$1="${BASE}/`)
  .replace(/(srcset="|, )\/assets\//g, `$1${BASE}/assets/`);

async function write(rel, content) {
  if (rel.endsWith('.html')) content = withBase(frenchSpaces(content));
  const file = path.join(DIST, rel);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, content);
}

async function main() {
  const products = (await loadProducts()).sort((a, b) => a.marque.localeCompare(b.marque, 'fr') || a.nom.localeCompare(b.nom, 'fr'));
  if (existsSync(DIST)) await rm(DIST, { recursive: true });
  await mkdir(DIST, { recursive: true });
  await cp(path.join(ROOT, 'src/img'), path.join(DIST, 'assets/img'), { recursive: true });
  await cp(path.join(ROOT, 'src/fonts'), path.join(DIST, 'assets/fonts'), { recursive: true });
  const css = await readFile(path.join(ROOT, 'src/site.css'), 'utf8');
  await write('assets/site.css', css.replaceAll('url("/assets/', `url("${BASE}/assets/`));
  await cp(path.join(ROOT, 'src/site.js'), path.join(DIST, 'assets/site.js'));

  const qr = await QRCode.toString(play('qr-code'), { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: '#141414', light: '#ffffff' } });
  const qrSvg = qr.replace('<svg ', '<svg role="img" aria-label="QR code vers Bellea sur Google Play" ');

  await write('index.html', home(products, qrSvg));
  await write('produits/index.html', catalogue(products));
  await write('pharmaciens/index.html', pharmaciens());
  await write('livraison/index.html', livraison());
  await write('faq/index.html', faqPage());
  await write('404.html', notFound());
  for (const p of products) await write(`${productPath(p).slice(1)}index.html`, productPage(p, products));
  await write('.well-known/assetlinks.json', assetlinks);
  await write('sitemap.xml', sitemap(products));
  await write('CNAME', 'bellea.store\n');   // domaine pour GitHub Pages
  await write('.nojekyll', '');              // GitHub Pages : publier aussi /.well-known/
  await write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${SITE.url}/sitemap.xml\n`);

  console.log(`Site généré dans dist/ : ${products.length} fiches produit${SAMPLE ? ' (exemple)' : ''}${BASE ? `, adresses sous ${BASE}/` : ''}.`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
