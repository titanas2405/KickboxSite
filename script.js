/* Champs Kickboxing Club, site script. */

/* =====================================================================
   EDIT HERE: business details
   ===================================================================== */
const SITE = {
  phoneDisplay: '693 669 7026',
  phoneTel: '+306936697026',
  mapsUrl: 'https://www.google.com/maps/place/CHAMPS+KICKBOXING+CLUB/@37.9287967,23.7058763,17z/data=!3m1!4b1!4m6!3m5!1s0x14a1bd28fe6bd457:0x919b13afec4aba1b!8m2!3d37.9287925!4d23.7084566!16s%2Fg%2F11xf5dxsy9',
  instagramUrl: 'https://www.instagram.com/champs_kickboxing_club/',
  // Google rating badge: change these two numbers when the rating changes
  rating: { value: '5.0', count: 21 },
};

/* =====================================================================
   EDIT HERE: opening hours (Europe/Athens time)
   0 = Sunday, 1 = Monday ... 6 = Saturday. Use null for a closed day.
   Also update "openingHoursSpecification" in index.html (JSON-LD).
   ===================================================================== */
const HOURS = {
  1: ['17:00', '22:00'], // TODO: confirm Monday
  2: ['17:00', '22:00'], // TODO: confirm Tuesday
  3: ['17:00', '22:00'], // TODO: confirm Wednesday
  4: ['17:00', '22:00'], // TODO: confirm Thursday
  5: ['17:00', '22:00'], // TODO: confirm Friday
  6: ['10:00', '14:00'], // TODO: confirm Saturday
  0: null,               // TODO: confirm Sunday (closed)
};

/* =====================================================================
   EDIT HERE: weekly class timetable
   TODO: confirm. Copied from the current schedule poster.
   Class keys: mixed, kids, cross, boxing, sparring (names are in translations.js, "tt.*").
   Each day lists one entry per time slot, in the same order as "slots"; null = no class.
   ===================================================================== */
const TIMETABLE = {
  slots: ['10:30–11:30', '17:30–18:30', '18:30–19:30', '19:30–20:30', '20:30–21:30'],
  days: {
    1: ['mixed', 'kids', 'mixed', 'cross', 'mixed'],
    2: ['mixed', 'kids', 'mixed', 'boxing', 'mixed'],
    3: ['mixed', 'kids', 'mixed', 'cross', 'sparring'],
    4: ['mixed', 'kids', 'mixed', 'boxing', 'mixed'],
    5: ['mixed', 'kids', 'mixed', 'cross', 'mixed'],
    6: ['mixed', null, null, null, null],
  },
};

/* ===================================================================== */

const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
const STORAGE_KEY = 'champs-lang';
let lang = 'el';

/* ---------- translations ---------- */
function t(key, vars = {}) {
  const dict = window.TRANSLATIONS || {};
  let s = (dict[lang] && dict[lang][key]) ?? (dict.el && dict.el[key]) ?? '';
  vars = { phone: SITE.phoneDisplay, ...vars };
  return s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
}

function applyLang(next) {
  lang = next === 'en' ? 'en' : 'el';
  document.documentElement.lang = lang;

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const s = t(el.dataset.i18n);
    if (s) el.textContent = s;
  });
  document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    el.dataset.i18nAttr.split(';').forEach((pair) => {
      const [attr, key] = pair.split(':').map((x) => x.trim());
      const s = t(key);
      if (attr && s) el.setAttribute(attr, s);
    });
  });

  document.title = t('meta.title');
  document.querySelector('meta[name="description"]')?.setAttribute('content', t('meta.description'));
  document.querySelector('meta[property="og:locale"]')?.setAttribute('content', lang === 'el' ? 'el_GR' : 'en_GB');

  document.querySelectorAll('.lang-btn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));

  // gallery buttons get a spoken label
  document.querySelectorAll('.g-btn').forEach((b) => {
    b.setAttribute('aria-label', t('gallery.open', { caption: b.querySelector('img').alt }));
  });

  renderRating();
  renderHours();
  renderTimetable();
  try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* private mode: ignore */ }
}

/* ---------- business details into the page ---------- */
function applySiteDetails() {
  document.querySelectorAll('[data-phone-text]').forEach((el) => { el.textContent = SITE.phoneDisplay; });
  document.querySelectorAll('[data-link="tel"]').forEach((a) => { a.href = `tel:${SITE.phoneTel}`; });
  document.querySelectorAll('[data-link="maps"]').forEach((a) => { a.href = SITE.mapsUrl; });
  document.querySelectorAll('[data-link="instagram"]').forEach((a) => { a.href = SITE.instagramUrl; });
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
}

function renderRating() {
  const v = document.getElementById('rating-value');
  const c = document.getElementById('rating-count');
  const a = document.getElementById('rating');
  if (!v) return;
  v.textContent = t('rating.text', { value: SITE.rating.value });
  c.textContent = t('rating.count', { count: SITE.rating.count });
  a.setAttribute('aria-label', t('rating.aria', { value: SITE.rating.value, count: SITE.rating.count }));
}

/* ---------- Athens time ---------- */
const athensFmt = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Athens', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
function athensNow() {
  const p = Object.fromEntries(athensFmt.formatToParts(new Date()).map((x) => [x.type, x.value]));
  return { day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday), minutes: Number(p.hour) * 60 + Number(p.minute) };
}
const range = (h) => `${h[0]}–${h[1]}`;

/* ---------- hours: top bar, hero summary, hours list ---------- */
function renderHours() {
  const { day } = athensNow();
  const today = HOURS[day];

  const top = document.querySelector('#topbar-today span');
  if (top) top.textContent = today ? t('top.openToday', { hours: range(today) }) : t('top.closedToday');

  // hero summary: consecutive days with the same hours are grouped (Mon–Fri ...)
  const groups = [];
  WEEK_ORDER.forEach((d) => {
    const key = HOURS[d] ? range(HOURS[d]) : null;
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.to = d; else groups.push({ from: d, to: d, key });
  });
  const summary = groups.map((g) => {
    const days = g.from === g.to ? t(`daysShort.${g.from}`) : `${t(`daysShort.${g.from}`)}–${t(`daysShort.${g.to}`)}`;
    return `${days} ${g.key || t('hours.closed')}`;
  }).join(' · ');
  const heroHours = document.getElementById('hero-hours');
  if (heroHours) heroHours.textContent = summary;

  const list = document.getElementById('hours-list');
  if (list) {
    list.innerHTML = '';
    WEEK_ORDER.forEach((d) => {
      const li = document.createElement('li');
      const name = document.createElement('span');
      name.textContent = t(`days.${d}`);
      if (d === day) {
        li.className = 'is-today';
        const flag = document.createElement('span');
        flag.className = 'today-flag';
        flag.textContent = t('hours.today');
        name.append(flag);
      }
      const time = document.createElement('span');
      if (HOURS[d]) time.textContent = `${HOURS[d][0]} – ${HOURS[d][1]}`;
      else { time.textContent = t('hours.closed'); time.className = 'closed'; }
      li.append(name, time);
      list.append(li);
    });
  }
}

/* ---------- timetable ---------- */
function renderTimetable() {
  const table = document.getElementById('timetable');
  if (!table) return;
  const { day } = athensNow();
  const days = Object.keys(TIMETABLE.days).map(Number);
  let html = `<caption class="sr-only">${t('hours.timetable')}</caption><thead><tr><th scope="col">${t('hours.time')}</th>`;
  days.forEach((d) => { html += `<th scope="col"${d === day ? ' class="is-today"' : ''}>${t(`days.${d}`)}</th>`; });
  html += '</tr></thead><tbody>';
  TIMETABLE.slots.forEach((slot, i) => {
    html += `<tr><th scope="row">${slot}</th>`;
    days.forEach((d) => {
      const c = TIMETABLE.days[d][i];
      const cls = [c ? `tt-${c}` : 'tt-empty', d === day ? 'is-today' : ''].filter(Boolean).join(' ');
      html += `<td class="${cls}">${c ? t(`tt.${c}`) : '–'}</td>`;
    });
    html += '</tr>';
  });
  table.innerHTML = html + '</tbody>';
}

/* ---------- header height (for scroll offsets) ---------- */
const header = document.getElementById('site-header');
function setHeaderHeight() {
  document.documentElement.style.setProperty('--header-h', `${header.offsetHeight}px`);
}
if ('ResizeObserver' in window) new ResizeObserver(setHeaderHeight).observe(header);
setHeaderHeight();

/* ---------- mobile menu ---------- */
const menuBtn = document.getElementById('menu-btn');
function setMenu(open) {
  header.classList.toggle('is-open', open);
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.querySelector('.sr-only').textContent = open ? t('nav.close') : t('nav.menu');
}
menuBtn.addEventListener('click', () => setMenu(!header.classList.contains('is-open')));
document.querySelectorAll('.nav-link').forEach((a) => a.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && header.classList.contains('is-open')) { setMenu(false); menuBtn.focus(); }
});
document.addEventListener('click', (e) => {
  if (header.classList.contains('is-open') && !header.contains(e.target)) setMenu(false);
});
matchMedia('(min-width: 960px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

/* ---------- language switch ---------- */
document.querySelectorAll('.lang-btn').forEach((b) => b.addEventListener('click', () => applyLang(b.dataset.lang)));

/* ---------- highlight the current section in the menu ---------- */
const navLinks = [...document.querySelectorAll('.nav-link')];
const tracked = navLinks.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
const visible = new Map();
function setActive(id) {
  navLinks.forEach((a) => {
    const on = a.getAttribute('href') === `#${id}`;
    a.classList.toggle('is-active', on);
    if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
  });
}
if ('IntersectionObserver' in window) {
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) visible.set(e.target.id, e.target); else visible.delete(e.target.id); });
    // the section crossing the middle band of the screen wins; none (hero, stats) clears the highlight
    const current = tracked.find((s) => visible.has(s.id));
    setActive(current ? current.id : null);
  }, { rootMargin: '-45% 0px -50% 0px' });
  tracked.forEach((s) => spy.observe(s));
}

/* ---------- back to top: shows once the hero has gone ---------- */
const backtop = document.getElementById('backtop');
const hero = document.getElementById('home');
if (backtop && hero && 'IntersectionObserver' in window) {
  new IntersectionObserver(([e]) => backtop.classList.toggle('is-visible', !e.isIntersecting), { threshold: 0.05 }).observe(hero);
}

/* ---------- subtle reveal on scroll ---------- */
document.querySelectorAll('.tile').forEach((el, i) => el.style.setProperty('--i', i));
const reveals = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  reveals.forEach((el) => io.observe(el));
} else {
  reveals.forEach((el) => el.classList.add('is-visible'));
}

/* ---------- lightbox (an overlay on this page) ---------- */
const lb = document.getElementById('lightbox');
const lbImg = document.getElementById('lb-img');
const lbCap = document.getElementById('lb-cap');
const items = [...document.querySelectorAll('.g-btn')];
let lbIndex = 0;
let lbTrigger = null;

function showItem(i) {
  lbIndex = (i + items.length) % items.length;
  const btn = items[lbIndex];
  const img = btn.querySelector('img');
  lbImg.src = btn.dataset.full || img.src;
  lbImg.alt = img.alt;
  lbCap.textContent = btn.querySelector('.tag')?.textContent || '';
}
function openLightbox(i) {
  lbTrigger = items[i];
  showItem(i);
  if (typeof lb.showModal === 'function') lb.showModal(); else lb.setAttribute('open', '');
  document.getElementById('lb-close').focus();
}
function closeLightbox() {
  if (lb.open) lb.close();
}
items.forEach((btn, i) => btn.addEventListener('click', () => openLightbox(i)));
document.getElementById('lb-prev').addEventListener('click', () => showItem(lbIndex - 1));
document.getElementById('lb-next').addEventListener('click', () => showItem(lbIndex + 1));
document.getElementById('lb-close').addEventListener('click', closeLightbox);
lb.addEventListener('click', (e) => { if (e.target === lb) closeLightbox(); });
lb.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') { e.preventDefault(); showItem(lbIndex - 1); }
  if (e.key === 'ArrowRight') { e.preventDefault(); showItem(lbIndex + 1); }
});
lb.addEventListener('close', () => { lbTrigger?.focus(); });

/* ---------- trial form ----------
   TODO: connect the form (see the comment above <form> in index.html).
   While the action still says YOUR_FORM_ID, nothing is sent and visitors are asked to call. */
const form = document.getElementById('contact-form');
const status = document.getElementById('form-status');
if (form) {
  form.addEventListener('submit', async (e) => {
    if (form.hasAttribute('data-netlify')) return; // Netlify Forms handles a normal submit
    e.preventDefault();
    status.className = 'form-status';
    if (form.action.includes('YOUR_FORM_ID')) {
      status.textContent = t('form.notConnected');
      status.classList.add('is-error');
      return;
    }
    try {
      const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(String(res.status));
      form.reset();
      status.textContent = t('form.sent');
      status.classList.add('is-ok');
    } catch (err) {
      status.textContent = t('form.error');
      status.classList.add('is-error');
    }
  });
}

/* ---------- start ---------- */
applySiteDetails();
let saved = null;
try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) { /* ignore */ }
applyLang(saved || 'el');
// keep "open today" right across midnight
setInterval(renderHours, 60 * 1000);
