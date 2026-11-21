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

// Test « Quel est mon type de peau ? » (mêmes questions et calcul que l'app)
(() => {
  const root = document.getElementById('quiz');
  const dataEl = document.getElementById('quiz-data');
  if (!root || !dataEl) return;
  const D = JSON.parse(dataEl.textContent);
  const S = D.str;
  const n = D.questions.length;
  const answers = [];
  let i = 0;
  const esc = (x) => String(x).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function focusTitle() {
    const h = root.querySelector('h2');
    if (h) h.focus({ preventScroll: true });
    const top = root.getBoundingClientRect().top + scrollY - 90;
    if (scrollY > top) scrollTo({ top, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  function question() {
    const q = D.questions[i];
    root.innerHTML = `
      <div class="quiz-top">
        ${i > 0 ? `<button type="button" class="quiz-back">${esc(S.back)}</button>` : '<span></span>'}
        <span class="quiz-count">${esc(S.progress.replace('{i}', i + 1).replace('{n}', n))}</span>
      </div>
      <div class="quiz-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${n}" aria-valuenow="${i}"><span style="width:${(i / n) * 100}%"></span></div>
      <p class="quiz-kicker">${esc(q.t)}</p>
      <h2 tabindex="-1">${esc(q.q)}</h2>
      <div class="quiz-answers">
        ${q.a.map((a, k) => `<button type="button" data-k="${k}"${answers[i] === k ? ' aria-pressed="true"' : ''}>${esc(a.l)}</button>`).join('')}
      </div>`;
    root.querySelector('.quiz-back')?.addEventListener('click', () => { i--; question(); focusTitle(); });
    root.querySelectorAll('.quiz-answers button').forEach((b) => b.addEventListener('click', () => {
      answers[i] = Number(b.dataset.k);
      if (i < n - 1) { i++; question(); } else { result(); }
      focusTitle();
    }));
  }

  function score() {
    const t = [0, 0, 0, 0, 0]; // sèche, normale, mixte, grasse, sensibilité
    answers.forEach((k, qi) => D.questions[qi].a[k].s.forEach((v, j) => { t[j] += v; }));
    const order = [['Mixte', t[2]], ['Sèche', t[0]], ['Grasse', t[3]], ['Normal', t[1]]];
    const best = Math.max(...order.map((o) => o[1]));
    let type = order.find((o) => o[1] === best)[0];
    if (t[0] >= 3 && t[3] >= 3) type = 'Mixte';
    return { type, sensitive: t[4] >= 3 };
  }

  function result() {
    const { type, sensitive } = score();
    const R = D.results[type];
    const picks = D.products.filter((p) => p.s.includes(type)).slice(0, 4);
    root.innerHTML = `
      <div class="quiz-bar"><span style="width:100%"></span></div>
      <div class="quiz-result">
        <p class="quiz-kicker">${esc(S.resultH)}</p>
        <h2 tabindex="-1">${esc(R.label)}</h2>
        <p class="quiz-desc">${esc(R.d)}</p>
        ${sensitive ? `<p class="quiz-sens">${esc(S.sensitive)}</p>` : ''}
      </div>
      <div class="quiz-cta">
        <div><strong>${esc(S.ctaH)}</strong><p>${esc(S.ctaP)}</p></div>
        <a class="btn btn-light btn-lg" href="${esc(D.play)}">${esc(S.ctaBtn)}</a>
      </div>
      ${picks.length ? `<h3 class="quiz-ph">${esc(S.productsH)}</h3>
      <div class="grid quiz-grid">${picks.map((p) => `<a class="card" href="${esc(p.u)}">
        <div class="card-img"><img src="${esc(p.i)}" alt="${esc(p.n)}" loading="lazy" width="300" height="300"></div>
        <div class="card-body"><span class="card-brand" dir="auto">${esc(p.b)}</span><span class="card-name" dir="auto">${esc(p.n)}</span><span class="card-price">${esc(p.p)}</span></div>
      </a>`).join('')}</div>` : ''}
      <p class="quiz-note">${esc(S.note)}</p>
      <button type="button" class="btn btn-small quiz-restart">${esc(S.restart)}</button>`;
    root.querySelector('.quiz-restart').addEventListener('click', () => { answers.length = 0; i = 0; question(); focusTitle(); });
  }

  question();
})();
