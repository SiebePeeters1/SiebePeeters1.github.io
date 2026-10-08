/* BRUTALIST EDITORIAL — SIEBE PEETERS */
const activeCommentUnsubscribers = new Set();

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
      activeCommentUnsubscribers.forEach(unsubscribe => unsubscribe());
      activeCommentUnsubscribers.clear();
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
    initPostComments();

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

function createCommentElement(comment) {
  const item = document.createElement('li');
  item.className = 'post-comment';

  const avatar = document.createElement('span');
  const name = comment.username.trim();
  const emoticons = ['(=^.^=)', '(=^o^=)', '(=^-^=)', '(=^_^=)', '(=^w^=)', "(='.'=)", '(^._.^)', '(=^x^=)'];
  const nameHash = [...name.toLowerCase()].reduce((hash, char) => hash + char.charCodeAt(0), 0);
  const colorIndex = nameHash % 6;
  avatar.className = `comment-avatar avatar-tone-${colorIndex}`;
  avatar.textContent = emoticons[nameHash % emoticons.length];
  avatar.setAttribute('aria-hidden', 'true');

  const body = document.createElement('div');
  body.className = 'post-comment-body';
  const header = document.createElement('header');
  const username = document.createElement('strong');
  username.textContent = comment.username;
  const date = document.createElement('time');
  if (comment.createdAt) {
    date.dateTime = comment.createdAt;
    date.textContent = new Intl.DateTimeFormat('nl-BE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(comment.createdAt));
  } else {
    date.textContent = 'NU';
  }
  const text = document.createElement('p');
  text.textContent = comment.text;

  header.append(username, date);
  body.append(header, text);
  item.append(avatar, body);
  return item;
}

function renderPostComments(section, comments) {
  const list = section.querySelector('.post-comments-list');
  const count = section.querySelector('.post-comments-count');
  const status = section.querySelector('.post-comments-status');
  list.replaceChildren(...comments.map(createCommentElement));
  if (comments.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'post-comments-empty';
    empty.textContent = 'Nog geen reacties. Wees de eerste!';
    list.append(empty);
  }
  count.textContent = `(${comments.length})`;
  status.textContent = '';
  status.setAttribute('role', 'status');
}

function initPostComments() {
  document.querySelectorAll('.stage-week-report').forEach((post, index) => {
    const story = post.querySelector('.week-story');
    const content = post.querySelector('.acc-inner');
    if (!story || !content || content.querySelector('.post-comments')) return;

    const section = document.createElement('section');
    section.className = 'post-comments';
    section.dataset.postId = post.id;
    section.setAttribute('aria-labelledby', `post-comments-title-${index}`);

    const heading = document.createElement('header');
    const label = document.createElement('span');
    label.textContent = '[ GESPREK / REACTIES ]';
    const title = document.createElement('h3');
    title.id = `post-comments-title-${index}`;
    title.append('REACTIES ');
    const count = document.createElement('i');
    count.className = 'post-comments-count';
    count.textContent = '(0)';
    title.append(count);
    heading.append(label, title);

    const note = document.createElement('p');
    note.className = 'post-comments-note';
    note.textContent = 'Reacties zijn openbaar. Alleen de eigenaar kan ze verwijderen.';

    const list = document.createElement('ol');
    list.className = 'post-comments-list';
    list.setAttribute('aria-label', 'Reacties bij dit blogbericht');

    const form = document.createElement('form');
    form.className = 'post-comment-form';
    const nameLabel = document.createElement('label');
    const nameInput = document.createElement('input');
    nameInput.name = 'username';
    nameInput.type = 'text';
    nameInput.required = true;
    nameInput.maxLength = 40;
    nameInput.autocomplete = 'nickname';
    nameInput.placeholder = 'Je naam';
    nameInput.id = `post-comment-name-${index}`;
    nameLabel.htmlFor = nameInput.id;
    nameLabel.textContent = 'GEBRUIKERSNAAM';

    const textLabel = document.createElement('label');
    const textInput = document.createElement('textarea');
    textInput.name = 'text';
    textInput.required = true;
    textInput.maxLength = 1000;
    textInput.rows = 4;
    textInput.placeholder = 'Schrijf een reactie...';
    textInput.id = `post-comment-text-${index}`;
    textLabel.htmlFor = textInput.id;
    textLabel.textContent = 'JE REACTIE';

    const submit = document.createElement('button');
    submit.type = 'submit';
    submit.className = 'post-comment-submit';
    submit.textContent = 'REACTIE PLAATSEN ↗';
    const status = document.createElement('p');
    status.className = 'post-comments-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');

    form.append(nameLabel, nameInput, textLabel, textInput, submit, status);
    section.append(heading, note, list, form);
    content.append(section);
    section.querySelector('.post-comments-status').textContent = 'Reacties laden...';
    Promise.resolve(window.postCommentsReady).then(api => {
      if (!section.isConnected) return;
      activeCommentUnsubscribers.add(api.subscribe(
        section.dataset.postId,
        comments => renderPostComments(section, comments),
        error => {
          const status = section.querySelector('.post-comments-status');
          status.textContent = `Reacties konden niet worden geladen: ${error.message}`;
          status.setAttribute('role', 'alert');
        }
      ));
    }).catch(error => {
      const status = section.querySelector('.post-comments-status');
      status.textContent = `Reactieservice niet beschikbaar: ${error.message}`;
      status.setAttribute('role', 'alert');
    });
  });
}

document.addEventListener('submit', event => {
  const form = event.target.closest('.post-comment-form');
  if (!form) return;
  event.preventDefault();

  const section = form.closest('.post-comments');
  const username = form.elements.username.value.trim();
  const text = form.elements.text.value.trim();
  const status = section.querySelector('.post-comments-status');
  status.setAttribute('role', 'status');

  if (!username || !text) {
    status.textContent = 'Vul je gebruikersnaam en reactie in.';
    return;
  }

  const submit = form.querySelector('.post-comment-submit');
  submit.disabled = true;
  Promise.resolve(window.postCommentsReady).then(api => api.add(section.dataset.postId, username, text)).then(() => {
    form.reset();
    status.textContent = 'Je reactie is geplaatst.';
  }).catch(error => {
    status.textContent = `Je reactie kon niet worden opgeslagen: ${error.message}`;
    status.setAttribute('role', 'alert');
  }).finally(() => { submit.disabled = false; });
});

// WPL TABS
document.addEventListener('click', e => {
  const t = e.target.closest('.wpl-tab'); if (!t) return;
  document.querySelectorAll('.wpl-tab').forEach(b => {
    const active = b === t;
    b.classList.toggle('active', active);
    b.setAttribute('aria-selected', String(active));
  });
  document.querySelectorAll('.wpl-panel').forEach(p => {
    const on = p.dataset.panel === t.dataset.tab;
    p.classList.toggle('active', on);
    if (on) p.querySelectorAll('.rev').forEach(el => requestAnimationFrame(() => el.classList.add('on')));
  });
});

// WEEK ACCORDION
function syncWeekControls(panel) {
  panel.querySelectorAll('.stage-week-report').forEach(week => {
    const expanded = week.classList.contains('open');
    const head = week.querySelector('.acc-head');
    const selector = [...panel.querySelectorAll('[data-week-target]')].find(button => button.dataset.weekTarget === week.id);
    if (head) head.setAttribute('aria-expanded', String(expanded));
    if (selector) selector.setAttribute('aria-expanded', String(expanded));
  });
}

document.addEventListener('click', e => {
  const selector = e.target.closest('[data-week-target]');
  if (selector) {
    const panel = selector.closest('.wpl-panel');
    const week = panel && document.getElementById(selector.dataset.weekTarget);
    if (!panel || !week || !panel.contains(week)) return;
    const opening = !week.classList.contains('open');
    panel.querySelectorAll('.stage-week-report').forEach(item => item.classList.toggle('open', opening && item === week));
    syncWeekControls(panel);
    if (opening) week.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }

  const action = e.target.closest('[data-weeks-action]');
  if (action) {
    const panel = action.closest('.wpl-panel');
    if (!panel) return;
    const expand = action.dataset.weeksAction === 'expand';
    panel.querySelectorAll('.stage-week-report').forEach(week => week.classList.toggle('open', expand));
    syncWeekControls(panel);
    return;
  }

  const head = e.target.closest('.acc-head'); if (!head) return;
  const week = head.closest('.stage-week-report'); if (!week) return;
  week.classList.toggle('open');
  syncWeekControls(week.closest('.wpl-panel'));
});