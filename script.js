/* BRUTALIST EDITORIAL — SIEBE PEETERS */
const activeCommentUnsubscribers = new Set();

(() => {
  const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  const emiliaCode = 'emilia';
  let keyProgress = 0;
  let emiliaProgress = 0;
  let konamiTimer;

  document.addEventListener('keydown', event => {
    const target = event.target;
    if (target instanceof HTMLElement && (target.isContentEditable || target.closest('input, textarea, select'))) return;

    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (!document.querySelector('.mini-game-overlay') && key.length === 1 && key === emiliaCode[emiliaProgress]) {
      emiliaProgress += 1;
    } else {
      emiliaProgress = key === emiliaCode[0] ? 1 : 0;
    }

    if (emiliaProgress === emiliaCode.length) {
      emiliaProgress = 0;
      openMiniGame();
      showEasterEggMessage('EMILIA MODE // CAT RUNNER');
      return;
    }

    if (key === konamiCode[keyProgress]) {
      keyProgress += 1;
    } else {
      keyProgress = key === konamiCode[0] ? 1 : 0;
    }

    if (keyProgress !== konamiCode.length) return;
    keyProgress = 0;
    document.body.classList.add('konami-mode');
    clearTimeout(konamiTimer);
    showEasterEggMessage('KONAMI CODE // COLOR SHIFT');
    konamiTimer = setTimeout(() => document.body.classList.remove('konami-mode'), 10000);
  });

  document.addEventListener('click', event => {
    if (!event.target.closest('.comment-avatar')) return;
    startCatMode();
  });

  let gameFrame;
  let runnerState;

  document.addEventListener('click', event => {
    const closeButton = event.target.closest('[data-close-game]');
    const gameOverlay = document.querySelector('.mini-game-overlay');
    if (gameOverlay && (closeButton || event.target === gameOverlay)) closeMiniGame(gameOverlay);

    if (event.target.closest('[data-runner-jump]') && gameOverlay) jumpCatRunner();
    if (event.target.closest('[data-runner-restart]') && gameOverlay) resetCatRunner(gameOverlay);
  });

  document.addEventListener('keydown', event => {
    const overlay = document.querySelector('.mini-game-overlay');
    if (!overlay) return;
    if (event.key === 'Escape') {
      closeMiniGame(overlay);
      return;
    }
    if (event.key.startsWith('Arrow')) event.preventDefault();
    if (event.key === 'ArrowDown') {
      if (runnerState?.running && runnerState.catY === 205) runnerState.crouching = true;
      return;
    }
    if (event.key !== ' ' && event.key !== 'ArrowUp') return;
    if (event.key === ' ' && event.target instanceof HTMLElement && event.target.closest('button')) return;
    event.preventDefault();
    jumpCatRunner();
  });
  document.addEventListener('keyup', event => {
    if (event.key === 'ArrowDown' && runnerState) runnerState.crouching = false;
  });

  document.addEventListener('emilia-comment', openMiniGame);
  document.addEventListener('click', event => {
    const control = event.target.closest('[data-carousel-action], [data-carousel-index]');
    if (!control) return;

    const carousel = control.closest('.week-carousel');
    if (!carousel) return;
    const thumbnails = [...carousel.querySelectorAll('[data-carousel-index]')];
    const image = carousel.querySelector('.week-carousel-image');
    const indexLabel = carousel.querySelector('.week-carousel-index');
    const currentIndex = thumbnails.findIndex(button => button.classList.contains('active'));
    if (!image || !indexLabel || !thumbnails.length || currentIndex < 0) return;

    const direction = control.dataset.carouselAction === 'previous' ? -1 : 1;
    const nextIndex = control.hasAttribute('data-carousel-index')
      ? Number(control.dataset.carouselIndex)
      : (currentIndex + direction + thumbnails.length) % thumbnails.length;
    const nextThumbnail = thumbnails[nextIndex];
    if (!nextThumbnail) return;

    image.src = nextThumbnail.dataset.imageSrc;
    image.alt = nextThumbnail.dataset.imageAlt;
    indexLabel.textContent = `${String(nextIndex + 1).padStart(2, '0')} / ${String(thumbnails.length).padStart(2, '0')}`;
    image.classList.add('changing');
    requestAnimationFrame(() => requestAnimationFrame(() => image.classList.remove('changing')));
    thumbnails.forEach((thumbnail, index) => {
      const active = index === nextIndex;
      thumbnail.classList.toggle('active', active);
      thumbnail.setAttribute('aria-pressed', String(active));
    });
  });
  function openMiniGame() {
    document.querySelector('.mini-game-overlay')?.remove();
    cancelAnimationFrame(gameFrame);

    const overlay = document.createElement('div');
    overlay.className = 'mini-game-overlay';
    const dialog = document.createElement('section');
    dialog.className = 'mini-game-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'mini-game-title');

    const heading = document.createElement('header');
    heading.className = 'mini-game-heading';
    const title = document.createElement('h2');
    title.id = 'mini-game-title';
    title.textContent = 'ASCII CAT RUNNER';
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'mini-game-close';
    close.dataset.closeGame = '';
    close.setAttribute('aria-label', 'Sluit minigame');
    close.textContent = '×';
    heading.append(title, close);

    const content = document.createElement('div');
    content.className = 'mini-game-content';
    dialog.append(heading, content);
    overlay.append(dialog);
    document.body.append(overlay);

    startCatRunner(content);
    content.querySelector('[data-runner-jump]').focus();
  }

  function closeMiniGame(overlay) {
    cancelAnimationFrame(gameFrame);
    runnerState = null;
    overlay.remove();
  }

   function startCatRunner(content) {
     content.innerHTML = '<div class="runner-score"><span>REN, KATJE, REN</span><span>SCORE <b data-runner-score>00000</b></span><span>SNELHEID <b data-runner-speed>260</b></span></div><p class="mini-game-instruction">Spring over de kleine ASCII-roosjes. Houd ↓ ingedrukt om onder de vliegende bijtjes door te duiken.</p><canvas class="runner-canvas" width="720" height="250" data-runner-canvas role="img" aria-label="Een klein ASCII-katje rent door een veld. Spring over roosjes en duik onder vliegende bijtjes."></canvas><div class="runner-controls"><span class="mini-game-status" data-runner-status role="status" aria-live="polite">Spatie / ↑ springen · houd ↓ ingedrukt om te duiken.</span><button type="button" data-runner-restart hidden>OPNIEUW</button><button type="button" class="runner-duck" data-runner-duck>DUIK ↓</button><button type="button" class="runner-jump" data-runner-jump>SPRING ↑</button></div>';
    const overlay = content.closest('.mini-game-overlay');
    const canvas = content.querySelector('[data-runner-canvas]');
    canvas.addEventListener('pointerdown', jumpCatRunner);
    const duckButton = content.querySelector('[data-runner-duck]');
    duckButton.addEventListener('pointerdown', () => { if (runnerState?.running && runnerState.catY === 205) runnerState.crouching = true; });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(type => duckButton.addEventListener(type, () => { if (runnerState) runnerState.crouching = false; }));
    resetCatRunner(overlay);
  }

  function resetCatRunner(overlay) {
    const canvas = overlay.querySelector('[data-runner-canvas]');
    if (!canvas) return;
    cancelAnimationFrame(gameFrame);
    runnerState = { score: 0, catY: 205, velocityY: 0, obstacleX: 760, obstacleType: 'flower', speed: 260, running: true, crouching: false, lastTime: 0 };
    overlay.querySelector('[data-runner-score]').textContent = '00000';
    overlay.querySelector('[data-runner-speed]').textContent = String(Math.round(runnerState.speed));
    overlay.querySelector('[data-runner-status]').textContent = 'Klaar voor de start, miauw!';
    overlay.querySelector('[data-runner-restart]').hidden = true;
    drawCatRunner(canvas);
    gameFrame = requestAnimationFrame(timestamp => tickCatRunner(timestamp, overlay));
  }

  function jumpCatRunner() {
    if (!runnerState?.running || runnerState.catY < 205) return;
    runnerState.crouching = false;
    runnerState.velocityY = -540;
  }

  function tickCatRunner(timestamp, overlay) {
    if (!runnerState?.running || !overlay.isConnected) return;
    const canvas = overlay.querySelector('[data-runner-canvas]');
    if (!canvas) return;
    const state = runnerState;
    const delta = state.lastTime ? Math.min((timestamp - state.lastTime) / 1000, .04) : 0;
    state.lastTime = timestamp;
    state.score += delta * 10;
    state.speed = 260 + state.score * 1.5;
    state.obstacleX -= state.speed * delta;
    if (state.obstacleX < -70) {
      state.obstacleX = 720 + Math.max(230, 380 - state.score * 1.2) + Math.random() * 220;
      state.obstacleType = Math.random() < .68 ? 'flower' : 'bee';
    }
    state.velocityY += 1500 * delta;
    state.catY = Math.min(205, state.catY + state.velocityY * delta);
    if (state.catY === 205) state.velocityY = 0;

    const catBounds = state.crouching
      ? { left: 78, right: 118, top: state.catY - 19, bottom: state.catY - 2 }
      : { left: 74, right: 124, top: state.catY - 39, bottom: state.catY - 5 };
    const obstacleBounds = state.obstacleType === 'flower'
      ? { left: state.obstacleX + 8, right: state.obstacleX + 48, top: 159, bottom: 202 }
      : { left: state.obstacleX + 8, right: state.obstacleX + 62, top: 128, bottom: 165 };
    if (catBounds.left < obstacleBounds.right && catBounds.right > obstacleBounds.left && catBounds.top < obstacleBounds.bottom && catBounds.bottom > obstacleBounds.top) {
      state.running = false;
      state.crouching = false;
      overlay.querySelector('[data-runner-status]').textContent = `AU! Einde van de rit — score ${String(Math.floor(state.score)).padStart(5, '0')}.`;
      overlay.querySelector('[data-runner-restart]').hidden = false;
    }

    overlay.querySelector('[data-runner-score]').textContent = String(Math.floor(state.score)).padStart(5, '0');
    overlay.querySelector('[data-runner-speed]').textContent = String(Math.round(state.speed));
    drawCatRunner(canvas);
    if (state.running) gameFrame = requestAnimationFrame(nextTimestamp => tickCatRunner(nextTimestamp, overlay));
  }

  function drawCatRunner(canvas) {
    const context = canvas.getContext('2d');
    if (!context) return;
    const style = getComputedStyle(document.documentElement);
    const background = style.getPropertyValue('--paper').trim();
    const ink = style.getPropertyValue('--ink').trim();
    const accent = style.getPropertyValue('--accent').trim();
    const state = runnerState;
    const groundY = 205;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = background;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = 'rgba(10,10,10,.08)';
    context.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 24) {
      context.beginPath();
      context.moveTo(x, 16);
      context.lineTo(x, groundY);
      context.stroke();
    }
    context.fillStyle = `${accent}22`;
    context.beginPath();
    context.arc(610, 56, 23, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = accent;
    context.font = '12px "JetBrains Mono", monospace';
    context.fillText('✳', 603, 60);
    context.fillStyle = `${accent}14`;
    context.beginPath();
    context.moveTo(0, 174);
    context.quadraticCurveTo(170, 116, 340, 174);
    context.quadraticCurveTo(520, 132, 720, 166);
    context.lineTo(720, groundY);
    context.lineTo(0, groundY);
    context.fill();
    context.strokeStyle = ink;
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(0, groundY);
    context.lineTo(canvas.width, groundY);
    context.stroke();

    const catY = state?.catY ?? groundY;
    context.fillStyle = accent;
    context.font = 'bold 12px "JetBrains Mono", monospace';
    const catStep = Math.floor((state?.score ?? 0) * 2) % 2;
    const catLines = state?.crouching && catY === groundY
      ? ['( o.o )', '(_/ \\_)']
      : [
          ' /\\_/\\\\',
          '( o.o )',
          ' /|= =|\\',
          catStep ? '(_/   \\_)' : '(_\\   /_)'
        ];
    const catTop = catY - (state?.crouching && catY === groundY ? 23 : 41);
    catLines.forEach((line, index) => context.fillText(line, 58, catTop + index * 12));

    context.font = 'bold 13px "JetBrains Mono", monospace';
    if (state?.obstacleType === 'bee') {
      context.fillStyle = style.getPropertyValue('--accent-2').trim();
      context.fillText('  \\/ \\/', state.obstacleX, 133);
      context.fillStyle = accent;
      context.fillText('<(o)==', state.obstacleX, 149);
      context.fillStyle = ink;
      context.fillText('  / \\', state.obstacleX + 8, 163);
    } else {
      const flowerX = state?.obstacleX ?? 760;
      context.fillStyle = accent;
      context.fillText('(@@@)', flowerX, 174);
      context.fillText(' \\|/ ', flowerX, 186);
      context.fillStyle = style.getPropertyValue('--accent-2').trim();
      context.fillText('  |  ', flowerX, 198);
    }

    const groundOffset = state ? Math.floor(state.score * 4) % 24 : 0;
    context.strokeStyle = 'rgba(10,10,10,.45)';
    context.lineWidth = 2;
    for (let x = -24 + groundOffset; x < canvas.width; x += 24) {
      context.beginPath();
      context.moveTo(x, groundY + 12);
      context.lineTo(x + 10, groundY + 12);
      context.stroke();
    }
  }

  function showEasterEggMessage(message) {
    let toast = document.querySelector('.easter-egg-message');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'easter-egg-message';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.append(toast);
    }
    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(toast.hideTimer);
    toast.hideTimer = setTimeout(() => toast.classList.remove('visible'), 2600);
  }

  function startCatMode() {
    document.querySelector('.cat-mode-overlay')?.remove();
    const overlay = document.createElement('div');
    overlay.className = 'cat-mode-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    const cats = ['=^..^=', '=^.^=', '=^o.o^=', '=^_^=', '=^w^='];

    cats.forEach((cat, index) => {
      const runner = document.createElement('span');
      runner.className = 'ascii-cat-runner';
      runner.textContent = cat;
      runner.style.top = `${12 + index * 16}%`;
      runner.style.animationDelay = `${index * 0.16}s`;
      overlay.append(runner);
    });

    document.body.append(overlay);
    showEasterEggMessage('CAT MODE // MEOW!');
    setTimeout(() => overlay.remove(), 4200);
  }

})();

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
  document.addEventListener('mouseover', e => { if (e.target.closest('a,button:not(.comment-avatar),[data-tilt]')) cur.classList.add('hover'); });
  document.addEventListener('mouseout', e => { if (e.target.closest('a,button:not(.comment-avatar),[data-tilt]')) cur.classList.remove('hover'); });

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
    if (location.hash === '#/blog') {
      const latestWeek = $('#wpl1-week-04');
      if (latestWeek?.classList.contains('open')) {
        window.scrollTo({
          top: latestWeek.getBoundingClientRect().top + window.scrollY - 120,
          behavior: 'instant'
        });
      }
    }

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

  const avatar = document.createElement('button');
  avatar.type = 'button';
  const name = comment.username.trim();
  const emoticons = ['(=^.^=)', '(=^o^=)', '(=^-^=)', '(=^_^=)', '(=^w^=)', "(='.'=)", '(^._.^)', '(=^x^=)'];
  const nameHash = [...name.toLowerCase()].reduce((hash, char) => hash + char.charCodeAt(0), 0);
  const colorIndex = nameHash % 6;
  avatar.className = `comment-avatar avatar-tone-${colorIndex}`;
  avatar.textContent = emoticons[nameHash % emoticons.length];
  avatar.setAttribute('aria-label', 'Start de kattenmodus');
  avatar.title = 'Klik voor kattenmodus';

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
    const normalizedUsername = username.toLocaleLowerCase('nl-BE');
    if (normalizedUsername === 'emilia' || normalizedUsername === 'emilia toffoletto') {
      document.dispatchEvent(new Event('emilia-comment'));
    }
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