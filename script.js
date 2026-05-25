/* BRUTALIST EDITORIAL — SIEBE PEETERS */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // LOADER
  const loader = $('#loader'), bar = $('#lbar'), pct = $('#lpct');
  let p = 0;
  const it = setInterval(() => {
    p += Math.random() * 10 + 3;
    if (p >= 100) { p = 100; clearInterval(it); setTimeout(() => { loader.classList.add('hide'); init(); }, 350); }
    bar.style.width = p + '%';
    pct.textContent = String(Math.floor(p)).padStart(3, '0');
  }, 70);

  // CURSOR
  const cur = $('#cursor');
  let mx = 0, my = 0, cx = 0, cy = 0;
  addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
  (function loop() { cx += (mx - cx) * .25; cy += (my - cy) * .25; cur.style.transform = `translate(${cx}px,${cy}px)`; requestAnimationFrame(loop); })();
  document.addEventListener('mouseover', e => { if (e.target.closest('a,button,[data-tilt]')) cur.classList.add('hover'); });
  document.addEventListener('mouseout', e => { if (e.target.closest('a,button,[data-tilt]')) cur.classList.remove('hover'); });

  $('#year').textContent = new Date().getFullYear();

  // ROUTER
  const routes = { '/': 'page-home', '/work': 'page-work', '/blog': 'page-blog' };
  const titles = { '/': 'SIEBE PEETERS — INDEX 26', '/work': 'WAT KAN IK — SIEBE PEETERS', '/blog': 'BLOG — SIEBE PEETERS' };
  const app = $('#app'), trans = $('#trans');

  function route() {
    const h = location.hash.replace('#', '') || '/';
    const t = $('#' + (routes[h] || 'page-home'));
    if (!t) return;
    trans.classList.add('in');
    setTimeout(() => {
      app.innerHTML = '';
      app.appendChild(t.content.cloneNode(true));
      document.title = titles[h] || titles['/'];
      scrollTo(0, 0);
      $$('.links a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + h));
      trans.classList.remove('in');
      trans.classList.add('out');
      setTimeout(() => { trans.classList.remove('out'); bind(); }, 620);
    }, 620);
  }

  document.addEventListener('click', e => {
    const a = e.target.closest('[data-link]');
    if (!a) return;
    e.preventDefault();
    const href = a.getAttribute('href').replace('#', '');
    if ((location.hash || '#/') === '#' + href) return;
    location.hash = href;
  });
  addEventListener('hashchange', route);

  function bind() {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); } }), { threshold: .15 });
    $$('.rev').forEach(el => io.observe(el));

    $$('.sk-list li').forEach(li => io.observe(li));

    $$('[b][data-count],b[data-count],.stat b').forEach(el => {
      if (!el.dataset.count) return;
      const target = +el.dataset.count, suf = el.dataset.suffix || '';
      const cio = new IntersectionObserver(es => es.forEach(e => {
        if (e.isIntersecting) {
          let v = 0; const step = Math.max(1, target / 50);
          const t = setInterval(() => { v += step; if (v >= target) { v = target; clearInterval(t); } el.textContent = Math.floor(v) + suf; }, 28);
          cio.unobserve(el);
        }
      }), { threshold: .5 });
      cio.observe(el);
    });

    $$('[data-split]').forEach(el => {
      const words = el.textContent.trim().split(/\s+/);
      el.innerHTML = words.map(w => `<span class="word">${w}</span>`).join(' ');
      const spans = el.querySelectorAll('.word');
      const sp = new IntersectionObserver(es => es.forEach(e => {
        if (e.isIntersecting) { spans.forEach((s, i) => setTimeout(() => s.classList.add('on'), i * 40)); sp.unobserve(el); }
      }), { threshold: .3 });
      sp.observe(el);
    });

    // Animate huge lines
    $$('.huge .ln').forEach((ln, i) => {
      const inner = ln.firstChild;
      if (!inner) return;
      // wrap text content if not already
      if (ln.children.length === 0 || ln.firstElementChild === null) {
        const span = document.createElement('span');
        span.innerHTML = ln.innerHTML; ln.innerHTML = ''; ln.appendChild(span);
      }
      const wrap = ln.firstElementChild;
      wrap.style.transform = 'translateY(110%)';
      wrap.style.transition = `transform .9s cubic-bezier(.7,0,.2,1) ${i * .08}s`;
      requestAnimationFrame(() => requestAnimationFrame(() => wrap.style.transform = 'translateY(0)'));
    });

    // Tilt
    $$('[data-tilt]').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5;
        const y = (e.clientY - r.top) / r.height - .5;
        el.style.transform = `perspective(900px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`;
      });
      el.addEventListener('mouseleave', () => el.style.transform = '');
    });
  }

  function init() { route(); }
})();
