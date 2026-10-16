// CHAMPS — reveals, the round timer, the week, the hall frame and the trial form.

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const DAY_NAMES = ['Κυριακή', 'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο'];

// ---------- the week: read the timetable from the page ----------
const classes = [...document.querySelectorAll('.day')].flatMap((day) => {
  const d = Number(day.dataset.day);
  return [...day.querySelectorAll('.cls')].map((el) => {
    const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
    return { el, day: d, start: d * 1440 + toMin(el.dataset.start), end: d * 1440 + toMin(el.dataset.end), time: el.dataset.start, name: el.dataset.name };
  });
});

// Athens wall-clock, as seconds since Sunday 00:00
const athensFmt = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Athens', weekday: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
function athensNow() {
  const p = Object.fromEntries(athensFmt.formatToParts(new Date()).map((x) => [x.type, x.value]));
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday);
  return { day, sec: ((day * 24 + Number(p.hour)) * 60 + Number(p.minute)) * 60 + Number(p.second) };
}

const WEEK = 7 * 1440 * 60;
function nextClass(sec) {
  let best = null;
  for (const c of classes) {
    let s = c.start * 60;
    if (s <= sec) s += WEEK;
    if (!best || s < best.at) best = { c, at: s };
  }
  return best;
}
const running = (sec) => classes.find((c) => c.start * 60 <= sec && sec < c.end * 60);

function whenLabel(c, nowDay) {
  if (c.day === nowDay) return `σήμερα στις ${c.time}`;
  if (c.day === (nowDay + 1) % 7) return `αύριο στις ${c.time}`;
  return `${DAY_NAMES[c.day]} στις ${c.time}`;
}
const pad = (n) => String(n).padStart(2, '0');
const endTime = (c) => `${pad(Math.floor((c.end % 1440) / 60))}:${pad(c.end % 60)}`;

const tDigits = document.getElementById('timer-digits');
const tNext = document.getElementById('timer-next');
let lastMinute = -1;

function tick() {
  const now = athensNow();
  const nx = nextClass(now.sec);
  const run = running(now.sec);
  if (!nx) return;
  const left = nx.at - now.sec;
  tDigits.textContent = `${pad(Math.floor(left / 3600))}:${pad(Math.floor((left % 3600) / 60))}:${pad(left % 60)}`;
  const minute = Math.floor(now.sec / 60);
  if (minute === lastMinute) return;
  lastMinute = minute;
  tNext.textContent = `μέχρι το επόμενο μάθημα: ${nx.c.name}, ${whenLabel(nx.c, now.day)}.` + (run ? ` Τώρα στην αίθουσα: ${run.name}, μέχρι ${endTime(run)}.` : '');
  // mark now and next on the timetable
  for (const c of classes) {
    c.el.classList.remove('is-now', 'is-next');
    const flag = c.el.querySelector('.cls-flag');
    flag.hidden = true;
  }
  if (run) {
    run.el.classList.add('is-now');
    const f = run.el.querySelector('.cls-flag'); f.textContent = `Τώρα, μέχρι ${endTime(run)}`; f.hidden = false;
  }
  nx.c.el.classList.add('is-next');
  const f = nx.c.el.querySelector('.cls-flag');
  const mins = Math.ceil(left / 60);
  f.textContent = mins < 60 ? `Επόμενο, σε ${mins} λεπτά` : left < 86400 ? `Επόμενο, σε ${Math.floor(mins / 60)} ώρ. ${mins % 60} λεπ.` : 'Το επόμενο μάθημα';
  f.hidden = false;
}
if (classes.length && tDigits) { tick(); setInterval(tick, 1000); }

// ---------- day tabs ----------
const tabs = [...document.querySelectorAll('.day-tab')];
const panels = [...document.querySelectorAll('.day')];
if (tabs.length) {
  document.querySelector('.days').hidden = false;
  const today = athensNow().day;
  const show = (d, focus) => {
    tabs.forEach((t) => { const on = Number(t.dataset.day) === d; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; if (on && focus) t.focus(); });
    panels.forEach((p) => {
      const on = Number(p.dataset.day) === d;
      p.classList.toggle('is-shown', on);
      if (on && !reduce) p.querySelectorAll('.cls').forEach((li, i) => { li.animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: 520, delay: i * 60, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'backwards' }); });
    });
  };
  tabs.forEach((t, i) => {
    t.setAttribute('aria-controls', `day-${t.dataset.day}`);
    if (Number(t.dataset.day) === today) t.classList.add('is-today');
    t.addEventListener('click', () => show(Number(t.dataset.day)));
    t.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const j = (i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length;
      show(Number(tabs[j].dataset.day), true);
    });
  });
  panels.forEach((p) => { p.id = `day-${p.dataset.day}`; });
  show(today === 0 ? 1 : today);
}

// ---------- reveals: parts of each section arrive in reading order ----------
document.querySelectorAll('section, footer').forEach((sec) => {
  sec.querySelectorAll('[data-reveal]').forEach((el, i) => el.style.setProperty('--d', Math.min(i, 8)));
});
document.querySelectorAll('.mark-blocks span').forEach((s, i) => s.style.setProperty('--d', i));
const revealTargets = document.querySelectorAll('[data-reveal], .mark-blocks');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
  revealTargets.forEach((el) => io.observe(el));
  addEventListener('load', () => setTimeout(() => revealTargets.forEach((el) => { const r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) el.classList.add('is-in'); }), 2500));
} else revealTargets.forEach((el) => el.classList.add('is-in'));

// ---------- the hall: one frame, the picture changes ----------
const frame = document.querySelector('.frame-hex');
if (frame) {
  const imgs = [...frame.querySelectorAll('img')];
  const cap = document.querySelector('.frame-cap');
  let i = 0;
  let timer;
  const go = (n) => {
    imgs[i].classList.remove('is-on');
    i = (n + imgs.length) % imgs.length;
    imgs[i].loading = 'eager';
    imgs[i].classList.add('is-on');
    cap.textContent = imgs[i].dataset.cap;
  };
  const start = () => { if (!reduce) { clearInterval(timer); timer = setInterval(() => go(i + 1), 3000); } };
  frame.addEventListener('click', () => { go(i + 1); start(); });
  new IntersectionObserver(([e]) => { if (e.isIntersecting) start(); else clearInterval(timer); }).observe(frame);
}

// ---------- trial form: opens an email with the choices filled in ----------
const form = document.getElementById('trial');
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const d = new FormData(form);
    const subject = `Δοκιμαστικό μάθημα: ${d.get('class')}, ${d.get('day')}`;
    const body = `Γεια σας,\n\nθα ήθελα να κλείσω δοκιμαστικό μάθημα.\n\nΌνομα: ${d.get('name')}\nΤηλέφωνο: ${d.get('phone')}\nΤμήμα: ${d.get('class')}\nΜέρα: ${d.get('day')}\n`;
    location.href = `${form.getAttribute('action')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
}
