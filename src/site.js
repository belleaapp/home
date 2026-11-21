// Bellea — petits comportements du site (aucune dépendance).
(() => {
  const PACKAGE = 'com.pharmalium.bellea';
  const HOST = 'bellea.store';

  // Menu mobile
  const btn = document.querySelector('.menu-btn');
  const nav = document.getElementById('nav');
  if (btn && nav) {
    const setMenu = (open) => {
      nav.classList.toggle('open', open);
      document.body.classList.toggle('menu-open', open);
      document.body.style.overflow = open ? 'hidden' : '';
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? btn.dataset.close : btn.dataset.open);
    };
    btn.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('open')) { setMenu(false); btn.focus(); }
    });
    // Passage en largeur ordinateur menu ouvert : on referme pour ne pas bloquer le défilement.
    matchMedia('(min-width: 861px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });
    // Retour arrière vers une page restée en cache avec le menu ouvert.
    addEventListener('pageshow', () => setMenu(false));
  }

  // Barre « Installer » (mobile) : apparaît quand le bouton principal du haut
  // n'est plus visible, pour ne jamais afficher deux fois le même appel.
  const appbar = document.getElementById('appbar');
  if (appbar) {
    const setBar = (show) => {
      appbar.classList.toggle('show', show);
      appbar.setAttribute('aria-hidden', String(!show));
      appbar.querySelector('a').tabIndex = show ? 0 : -1;
    };
    const heroCta = document.querySelector('[data-hero-cta]');
    if (heroCta && 'IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => setBar(!e.isIntersecting && e.boundingClientRect.top < 0)).observe(heroCta);
    } else {
      setBar(true);
    }
  }

  // Carrousels produits : flèches (ordinateur), sens inversé en arabe
  document.querySelectorAll('.rail-wrap').forEach((wrap) => {
    const list = wrap.querySelector('.rail');
    const rtl = getComputedStyle(list).direction === 'rtl';
    const [prev, next] = [wrap.querySelector('.prev'), wrap.querySelector('.next')];
    const update = () => {
      const max = list.scrollWidth - list.clientWidth - 2;
      const pos = Math.abs(list.scrollLeft);
      prev.disabled = pos <= 2;
      next.disabled = pos >= max;
    };
    wrap.querySelectorAll('.rail-btn').forEach((b) => b.addEventListener('click', () => {
      list.scrollBy({ left: Number(b.dataset.dir) * list.clientWidth * 0.85 * (rtl ? -1 : 1), behavior: 'smooth' });
    }));
    list.addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
    update();
  });

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
    brand.innerHTML = `<option value="">${list.dataset.all}</option>` + names.map((n) => `<option>${n.replace(/</g, '&lt;')}</option>`).join('');
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
    count.textContent = shown === 1 ? list.dataset.one : list.dataset.many.replace('{n}', shown);
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
