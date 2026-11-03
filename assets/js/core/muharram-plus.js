// ============================================================================
// MUHARRAM MODE — v250 (v254: daily Ziyarat Ashura link on days 1–9)
// ----------------------------------------------------------------------------
// A card for the Muharram page (always) and the home page (1 Muharram → 20 Safar,
// plus the last two weeks before Muharram). It shows
//   • during 1–10 Muharram: today's Muharram day, a 10-dot majlis tracker (tap a
//     day you attended a majlis — stays on this device), today's entry from the
//     page's own timeline (window._mhStaticTimeline, set by renderMuharramPage),
//     the calendar's own related ziyarat/amal links (calEventLinksHtml) and a
//     button that turns today's timeline entry into a share card (share-card.js);
//   • from 11 Muharram to 20 Safar: Arbaeen (20 Safar) countdown + its ziyarat link;
//   • otherwise: days left to 1 Muharram (approximate, follows the calendar's ±1
//     moon-sighting adjustment).
// It writes NO religious text: every sentence about Karbala comes from the existing
// timeline, every link from CAL_EVENT_LINKS. Only labels/counts are new.
// Storage: 'ahlbayt_muharram' = { "<hijri year>": [days attended] } (Backup group
// "Muharram"). Wraps renderMuharramPage and todayAmalCard; typeof-guarded; any
// error falls back to the original page.
// ============================================================================
(function () {
'use strict';

const KEY = 'ahlbayt_muharram';
const EN = () => (typeof state !== 'undefined' && state.language === 'en');
const T = (b, e) => EN() ? e : b;
const N = n => EN() ? String(n) : (typeof toBengaliDigits === 'function' ? toBengaliDigits(n) : String(n));
const E = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function load() { try { const o = JSON.parse(localStorage.getItem(KEY) || '{}'); return (o && typeof o === 'object') ? o : {}; } catch (e) { return {}; } }
function save(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) { /* storage full / blocked */ } }
function hNow() { try { return typeof approxHijriNow === 'function' ? approxHijriNow() : null; } catch (e) { return null; } }
function daysBetween(a, b) {
    if (typeof calDaysBetween === 'function') return calDaysBetween(a, b);
    return Math.round((b - a) / 86400000);
}
function today0() { const t = new Date(); t.setHours(0, 0, 0, 0); return t; }

// where are we in the cycle?
function phase() {
    const h = hNow(); if (!h || typeof hijriToGregorian !== 'function') return null;
    if (h.month === 1 && h.day <= 10) return { p: 'days', day: h.day, year: h.year };
    if ((h.month === 1 && h.day > 10) || (h.month === 2 && h.day <= 20)) {
        const arb = hijriToGregorian(20, 2, h.year); arb.setHours(0, 0, 0, 0);
        return { p: 'arbaeen', year: h.year, left: daysBetween(today0(), arb), h: h };
    }
    const y = h.year + 1, st = hijriToGregorian(1, 1, y); st.setHours(0, 0, 0, 0);
    return { p: 'off', year: y, left: daysBetween(today0(), st), h: h };
}
function timeline() { return Array.isArray(window._mhStaticTimeline) ? window._mhStaticTimeline : []; }
function eventFor(day) {
    const t = timeline();
    for (let i = 0; i < t.length; i++) if (t[i].mday === day) return t[i]; // v254: each timeline entry carries its own Muharram day
    return null;
}
function attended(year) { const a = load()[String(year)]; return Array.isArray(a) ? a.filter(d => d >= 1 && d <= 10) : []; }


// v254: Ziyarat Ashura is recommended every day, so days 1-9 get its link too (day 10 already
// gets it from CAL_EVENT_LINKS['1-10']). Existing id only; title read from the app's own data.
const DAILY_ZIYARAT = 'ziyarat-ashura';
function dailyZiyaratHtml() {
    const zs = (typeof ziyarats !== 'undefined' && Array.isArray(ziyarats)) ? ziyarats : [];
    const it = zs.find(x => x && x.id === DAILY_ZIYARAT);
    if (!it) return '';
    const title = EN() ? (it.titleEn || it.titleBn) : (it.titleBn || it.titleEn);
    if (!title) return '';
    return '<button type="button" data-action="readZiyarat" data-param="' + E(DAILY_ZIYARAT) + '"'
        + ' style="display:flex;align-items:center;gap:8px;width:100%;min-height:44px;margin-top:6px;padding:8px 12px;border-radius:12px;text-align:left;cursor:pointer;'
        + 'font-size:.85rem;font-weight:600;line-height:1.35;border:1px solid #374151;background:rgba(255,255,255,.05);color:#f3f4f6">'
        + '<span aria-hidden="true">🕋</span><span style="flex:1;min-width:0">' + E(title) + '</span>'
        + '<span aria-hidden="true" style="opacity:.6">›</span></button>';
}

// ---------------------------------------------------------------------------
// the card
// ---------------------------------------------------------------------------
const CARD = 'background:linear-gradient(135deg,#1a0000,#3b0000 60%,#1a0000);border:1px solid rgba(248,113,113,.35);border-radius:22px;padding:18px;color:#fde8e8;box-shadow:0 6px 28px rgba(220,38,38,.22);text-align:left';
const BTN = 'display:inline-flex;align-items:center;gap:6px;min-height:44px;padding:8px 14px;border-radius:12px;font-size:.85rem;font-weight:700;cursor:pointer;border:1px solid rgba(252,165,165,.45);background:rgba(255,255,255,.08);color:#fff';

function dotsHtml(ph) {
    const got = attended(ph.year), td = ph.day;
    let h = '<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin:12px 0 6px" role="group" aria-label="' + E(T('মজলিসে অংশ নেওয়ার দিন', 'Days you attended a majlis')) + '">';
    for (let d = 1; d <= 10; d++) {
        const on = got.indexOf(d) >= 0, isT = d === td, future = d > td;
        const bg = on ? 'linear-gradient(135deg,#dc2626,#991b1b)' : 'rgba(255,255,255,.07)';
        const bd = isT ? '2px solid #fbbf24' : '1px solid rgba(252,165,165,.35)';
        h += '<button type="button" data-mh-act="day" data-mh-d="' + d + '" aria-pressed="' + (on ? 'true' : 'false') + '"' + (future ? ' disabled' : '')
            + ' aria-label="' + E(T(N(d) + ' মুহাররম — মজলিসে অংশ নিয়েছি', d + ' Muharram — attended a majlis')) + '"'
            + ' style="min-height:44px;border-radius:12px;font-weight:800;font-size:1rem;cursor:' + (future ? 'default' : 'pointer') + ';color:#fff;background:' + bg + ';border:' + bd + ';opacity:' + (future ? '.45' : '1') + '">'
            + (on ? '✓ ' : '') + N(d) + '</button>';
    }
    return h + '</div>';
}

function inner(forHome) {
    const ph = phase(); if (!ph) return '';
    const bn = !EN();
    let h = '';
    if (ph.p === 'days') {
        const ev = eventFor(ph.day), got = attended(ph.year).length;
        h += '<div style="display:flex;align-items:center;gap:10px"><div style="font-size:1.8rem" aria-hidden="true">🌙</div><div style="flex:1;min-width:0">'
            + '<div style="font-size:1.15rem;font-weight:900;color:#fecaca">' + E(T('মুহাররম ' + N(ph.day), 'Muharram ' + ph.day)) + ' · ' + E(T('কারবালার দিনগুলো', 'The days of Karbala')) + '</div>'
            + '<div style="font-size:.8rem;color:#f5c6c6">' + E(T('মজলিসে অংশ: ' + N(got) + '/১০ — শুধু এই ডিভাইসে থাকে', 'Majlis attended: ' + got + '/10 — stays on this device')) + '</div></div></div>';
        h += dotsHtml(ph);
        if (ev) {
            h += '<div style="margin-top:10px;padding:12px;border-radius:14px;background:rgba(255,255,255,.07);border:1px solid rgba(252,165,165,.25)">'
                + '<div style="font-weight:800;color:#fff;font-size:.95rem">' + E((ev.icon || '') + ' ' + (ev.titleBn || '')) + '</div>'
                + (ev.descBn ? '<div style="margin-top:4px;font-size:.85rem;line-height:1.6;color:#fde8e8">' + E(ev.descBn) + '</div>' : '') + '</div>';
        }
        if (typeof calEventLinksHtml === 'function') { try { h += '<div style="margin-top:4px">' + calEventLinksHtml('1-' + ph.day, state.language, true) + '</div>'; } catch (e) { /* skip links */ } }
        if (ph.day < 10) { try { const dz = dailyZiyaratHtml(); if (dz) h += '<div style="margin-top:4px">' + dz + '</div>'; } catch (e) { /* skip link */ } }
        h += '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px">';
        if (ev && window.abShareCard) h += '<button type="button" data-mh-act="card" style="' + BTN + '">🖼️ ' + E(T('আজকের কার্ড', "Today's card")) + '</button>';
        if (forHome) h += '<button type="button" data-action="changePage" data-param="muharram" style="' + BTN + '">' + E(T('মুহাররম পেজ খুলুন', 'Open Muharram page')) + ' ›</button>';
        h += '</div>';
    } else if (ph.p === 'arbaeen') {
        const got = attended(ph.year).length;
        h += '<div style="display:flex;align-items:center;gap:10px"><div style="font-size:1.8rem" aria-hidden="true">🌿</div><div style="flex:1;min-width:0">'
            + '<div style="font-size:1.15rem;font-weight:900;color:#fecaca">' + E(T('আরবাঈন (২০ সফর)', 'Arbaeen (20 Safar)')) + '</div>'
            + '<div style="font-size:.85rem;color:#f5c6c6">' + (ph.left > 0 ? E(T(N(ph.left) + ' দিন বাকি (আনুমানিক)', ph.left + ' days left (approx.)')) : (ph.left === 0 ? E(T('আজ আরবাঈন', 'Arbaeen is today')) : '')) + '</div></div></div>';
        if (got) h += '<div style="margin-top:8px;font-size:.8rem;color:#f5c6c6">' + E(T('এ বছরের মুহাররমে মজলিসে অংশ: ' + N(got) + '/১০', 'Majlis attended this Muharram: ' + got + '/10')) + '</div>';
        if (typeof calEventLinksHtml === 'function') { try { h += '<div style="margin-top:6px">' + calEventLinksHtml('2-20', state.language, true) + '</div>'; } catch (e) { /* skip links */ } }
        if (forHome) h += '<div style="margin-top:10px"><button type="button" data-action="changePage" data-param="muharram" style="' + BTN + '">' + E(T('মুহাররম পেজ', 'Muharram page')) + ' ›</button></div>';
    } else {
        const prev = attended(ph.year - 1).length;
        h += '<div style="display:flex;align-items:center;gap:10px"><div style="font-size:1.8rem" aria-hidden="true">🌙</div><div style="flex:1;min-width:0">'
            + '<div style="font-size:1.15rem;font-weight:900;color:#fecaca">' + E(T('মুহাররম শুরু হতে', 'Until Muharram begins')) + ' ' + E(T(N(ph.left) + ' দিন', ph.left + ' days')) + '</div>'
            + '<div style="font-size:.8rem;color:#f5c6c6">' + E(T('আনুমানিক — চাঁদ দেখার ওপর নির্ভর করে', 'Approximate — depends on moon sighting')) + '</div></div></div>';
        if (prev) h += '<div style="margin-top:8px;font-size:.8rem;color:#f5c6c6">' + E(T('গত মুহাররমে মজলিসে অংশ: ' + N(prev) + '/১০', 'Majlis attended last Muharram: ' + prev + '/10')) + '</div>';
        if (forHome) h += '<div style="margin-top:10px"><button type="button" data-action="changePage" data-param="muharram" style="' + BTN + '">' + E(T('মুহাররম পেজ', 'Muharram page')) + ' ›</button></div>';
    }
    return h;
}
function box(forHome) {
    let c = ''; try { c = inner(forHome); } catch (e) { c = ''; }
    return c ? '<section id="mh-root" aria-label="' + E(T('মুহাররম মোড', 'Muharram mode')) + '" style="' + CARD + '">' + c + '</section>' : '';
}
function repaint() {
    const el = document.getElementById('mh-root'); if (!el) return;
    const home = el.getAttribute('data-home') === '1';
    const tmp = document.createElement('div'); tmp.innerHTML = box(home);
    const n = tmp.firstElementChild; if (!n) return;
    if (home) n.setAttribute('data-home', '1');
    el.replaceWith(n);
}
function showOnHome() {
    const ph = phase(); if (!ph) return false;
    return ph.p !== 'off' || ph.left <= 14;
}

// ---------------------------------------------------------------------------
// wiring
// ---------------------------------------------------------------------------
if (typeof window.renderMuharramPage === 'function') {
    const _orig = window.renderMuharramPage;
    window.renderMuharramPage = function () {
        let html = _orig.apply(this, arguments);
        if (typeof html !== 'string') return html;
        try {
            const b = box(false); if (!b) return html;
            const marker = html.indexOf('আশুরা কাউন্টডাউন') >= 0 ? html.indexOf('আশুরা কাউন্টডাউন') : html.indexOf('Ashura Countdown');
            const at = marker >= 0 ? html.lastIndexOf('<div', marker) : -1;
            if (at < 0) return html;
            return html.slice(0, at) + b + html.slice(at);
        } catch (e) { return html; }
    };
}
if (typeof window.todayAmalCard === 'function') {
    const _card = window.todayAmalCard;
    window.todayAmalCard = function () {
        let html = _card.apply(this, arguments);
        try {
            if (showOnHome()) { const b = box(true).replace('<section id="mh-root"', '<section id="mh-root" data-home="1"'); if (b) html = '<div style="margin-bottom:14px">' + b + '</div>' + (html || ''); }
        } catch (e) { /* keep original */ }
        return html;
    };
}
document.addEventListener('click', function (ev) {
    const el = ev.target && ev.target.closest ? ev.target.closest('[data-mh-act]') : null;
    if (!el) return;
    const act = el.getAttribute('data-mh-act'), ph = phase();
    if (!ph || ph.p !== 'days') return;
    if (act === 'day') {
        const d = parseInt(el.getAttribute('data-mh-d'), 10);
        if (!(d >= 1 && d <= ph.day)) return;
        const o = load(), k = String(ph.year), a = Array.isArray(o[k]) ? o[k].slice() : [], i = a.indexOf(d);
        if (i >= 0) a.splice(i, 1); else a.push(d);
        a.sort((x, y) => x - y); o[k] = a; save(o); repaint();
    } else if (act === 'card') {
        const evn = eventFor(ph.day);
        if (evn && window.abShareCard) window.abShareCard.open({ kind: 'muharram', title: T('মুহাররম ' + N(ph.day), 'Muharram ' + ph.day), heading: evn.titleBn || '', text: evn.descBn || '' });
    }
});

window._mh = { phase: phase, attended: attended, load: load, box: box };
})();
