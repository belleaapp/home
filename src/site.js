// Bellea — petits comportements du site (aucune dépendance).
(() => {
  const PACKAGE = 'com.pharmalium.bellea';
  const HOST = 'bellea.store';

  // Menu mobile
  const btn = document.querySelector('.menu-btn');
  const nav = document.getElementById('nav');
  if (btn && nav) {
    btn.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    nav.addEventListener('click', (e) => {
      if (e.target.closest('a')) { nav.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; }
    });
  }

  // Sur Android : « Ouvrir dans l'app » ouvre l'app si elle est installée
  // (même page grâce aux App Links), sinon la fiche Google Play.
  if (/Android/i.test(navigator.userAgent)) {
    document.querySelectorAll('a[data-app-path]').forEach((a) => {
      const path = a.getAttribute('data-app-path');
      const fallback = encodeURIComponent(a.href);
      a.href = `intent://${HOST}${path}#Intent;scheme=https;package=${PACKAGE};S.browser_fallback_url=${fallback};end`;
    });
  }

  // Catalogue : filtres côté navigateur (toutes les fiches sont déjà dans la page)
  const list = document.getElementById('catalogue');
  if (!list) return;
  const cards = [...list.querySelectorAll('.card')];
  const tabs = [...document.querySelectorAll('.tabs button')];
  const search = document.getElementById('q');
  const brand = document.getElementById('marque');
  const count = document.getElementById('count');
  const empty = document.getElementById('empty');
  const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  let type = new URLSearchParams(location.search).get('type') || 'soin';

  function fillBrands() {
    const current = brand.value;
    const names = [...new Set(cards.filter((c) => c.dataset.type === type).map((c) => c.dataset.brand))].sort((a, b) => a.localeCompare(b, 'fr'));
    brand.innerHTML = '<option value="">Toutes les marques</option>' + names.map((n) => `<option>${n.replace(/</g, '&lt;')}</option>`).join('');
    if (names.includes(current)) brand.value = current;
  }

  function apply() {
    const q = norm(search.value.trim());
    let shown = 0;
    for (const c of cards) {
      const ok = c.dataset.type === type && (!brand.value || c.dataset.brand === brand.value) && (!q || c.dataset.search.includes(q));
      c.hidden = !ok;
      if (ok) shown++;
    }
    tabs.forEach((t) => t.setAttribute('aria-pressed', String(t.dataset.type === type)));
    count.textContent = shown === 1 ? '1 produit' : `${shown} produits`;
    empty.classList.toggle('show', shown === 0);
  }

  tabs.forEach((t) => t.addEventListener('click', () => {
    type = t.dataset.type;
    brand.value = '';
    fillBrands();
    apply();
    history.replaceState(null, '', type === 'soin' ? location.pathname : `?type=${type}`);
  }));
  search.addEventListener('input', apply);
  brand.addEventListener('change', apply);
  document.getElementById('reset').addEventListener('click', () => { search.value = ''; brand.value = ''; apply(); search.focus(); });
  fillBrands();
  apply();
})();
