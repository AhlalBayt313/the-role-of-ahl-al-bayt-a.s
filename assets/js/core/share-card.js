// ============================================================================
// SHARE CARD — v250
// ----------------------------------------------------------------------------
// Turns a hadith / ayah / Muharram-day text into a shareable picture (1080x1350,
// PNG) with three looks: Emerald (default), Ivory and Maroon (default for Muharram).
// It writes NO religious text of its own: the caller passes the text that the app
// already shows (today's hadith, today's ayah, a Muharram timeline entry) and the
// card only lays it out. Fixed labels are only the card titles ("আজকের হাদিস" ...).
// Everything is drawn on a canvas with the bundled fonts (Amiri + Noto Serif
// Bengali, assets/fonts/ff-*.woff2) — nothing is fetched from the network, nothing
// is stored except the chosen look ('ahlbayt_sharecard_theme').
// The dialog is built with DOM calls (not render()), so it never touches app state.
// Entry points:  window.abShareCard.open({kind, title, heading, arabic, text, source})
//                a click on any element with data-sc-act="hadith" | "ayah"
// ============================================================================
(function () {
'use strict';

const W = 1080, H = 1350;
const THEME_KEY = 'ahlbayt_sharecard_theme';
const AR = '"Amiri","Scheherazade New","Noto Naskh Arabic",serif';
const BN = '"Noto Serif Bengali","Hind Siliguri","Noto Sans Bengali",Georgia,serif';

const THEMES = {
    emerald: { n: ['এমারেল্ড', 'Emerald'], bg: ['#021f17', '#0a3d2e', '#031a13'], glow: 'rgba(52,211,153,.18)', gold: '#d4af37', gold2: '#f1d77a', text: '#f7f1da', sub: '#bcd0c6', line: 'rgba(212,175,55,.55)', pat: 'rgba(212,175,55,.07)', btn: '#065f46' },
    ivory:   { n: ['আইভরি', 'Ivory'],     bg: ['#fffaf0', '#f6ecd2', '#fbf4df'], glow: 'rgba(201,162,39,.20)', gold: '#a8791a', gold2: '#b8891f', text: '#0e3b2c', sub: '#476355', line: 'rgba(168,121,26,.6)', pat: 'rgba(168,121,26,.09)', btn: '#065f46' },
    maroon:  { n: ['মারুন', 'Maroon'],     bg: ['#1c0606', '#3d0d0d', '#140303'], glow: 'rgba(248,113,113,.15)', gold: '#e3b45c', gold2: '#f6d99a', text: '#fbeee6', sub: '#dcbcb1', line: 'rgba(227,180,92,.55)', pat: 'rgba(227,180,92,.07)', btn: '#991b1b' }
};

const EN = () => (typeof state !== 'undefined' && state.language === 'en');
const T = (b, e) => EN() ? e : b;

// ---- drawing helpers --------------------------------------------------------
function rrect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function diamond(ctx, x, y, r) { ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y); ctx.closePath(); }
function star(ctx, cx, cy, R, r, n) {
    ctx.beginPath();
    for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / n, rad = i % 2 ? r : R; ctx.lineTo(cx + rad * Math.cos(a), cy + rad * Math.sin(a)); }
    ctx.closePath();
}
function lattice(ctx, th) {
    ctx.save(); ctx.strokeStyle = th.pat; ctx.lineWidth = 1.6;
    const s = 132;
    for (let y = -s / 2; y < H + s; y += s) for (let x = -s / 2; x < W + s; x += s) {
        ctx.save(); ctx.translate(x + s / 2, y + s / 2);
        ctx.strokeRect(-34, -34, 68, 68); ctx.rotate(Math.PI / 4); ctx.strokeRect(-34, -34, 68, 68);
        ctx.restore();
    }
    ctx.restore();
}
function background(ctx, th) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, th.bg[0]); g.addColorStop(.5, th.bg[1]); g.addColorStop(1, th.bg[2]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    lattice(ctx, th);
    const rg = ctx.createRadialGradient(W / 2, 520, 40, W / 2, 520, 760);
    rg.addColorStop(0, th.glow); rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
}
function frame(ctx, th) {
    ctx.save();
    ctx.strokeStyle = th.gold; ctx.lineWidth = 4; rrect(ctx, 34, 34, W - 68, H - 68, 34); ctx.stroke();
    ctx.strokeStyle = th.line; ctx.lineWidth = 1.8; rrect(ctx, 56, 56, W - 112, H - 112, 24); ctx.stroke();
    ctx.fillStyle = th.gold;
    [[56, 56], [W - 56, 56], [56, H - 56], [W - 56, H - 56]].forEach(function (p) { diamond(ctx, p[0], p[1], 15); ctx.fill(); });
    [[W / 2, 56]].forEach(function (p) { diamond(ctx, p[0], p[1], 9); ctx.fill(); });
    ctx.restore();
}
function crescent(ctx, th, cx, cy, R) {
    const off = document.createElement('canvas'); off.width = off.height = R * 3; const c = off.getContext('2d');
    c.fillStyle = th.gold; c.beginPath(); c.arc(R * 1.5, R * 1.5, R, 0, Math.PI * 2); c.fill();
    c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(R * 1.5 + R * .42, R * 1.5 - R * .12, R * .84, 0, Math.PI * 2); c.fill();
    ctx.drawImage(off, cx - R * 1.5, cy - R * 1.5);
    ctx.fillStyle = th.gold2; star(ctx, cx + R * .62, cy - R * .38, R * .3, R * .12, 8); ctx.fill();
}
function divider(ctx, th, cx, y, half) {
    ctx.save(); ctx.strokeStyle = th.line; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx - half, y); ctx.lineTo(cx - 26, y); ctx.moveTo(cx + 26, y); ctx.lineTo(cx + half, y); ctx.stroke();
    ctx.fillStyle = th.gold; diamond(ctx, cx, y, 9); ctx.fill();
    diamond(ctx, cx - 40, y, 4); ctx.fill(); diamond(ctx, cx + 40, y, 4); ctx.fill();
    ctx.restore();
}
function wrap(ctx, text, maxW) {
    const out = [];
    String(text).split(/\n+/).forEach(function (para) {
        const words = para.trim().split(/\s+/).filter(Boolean); let line = '';
        words.forEach(function (w) {
            const t = line ? line + ' ' + w : w;
            if (ctx.measureText(t).width <= maxW || !line) line = t; else { out.push(line); line = w; }
        });
        if (line) out.push(line);
    });
    return out;
}
function fit(ctx, text, fontFn, maxW, maxH, maxPx, minPx, lh) {
    let lines = [], px = maxPx;
    for (; px >= minPx; px -= 2) {
        ctx.font = fontFn(px); lines = wrap(ctx, text, maxW);
        if (lines.length * px * lh <= maxH) return { px: px, lines: lines, h: lines.length * px * lh };
    }
    px = minPx; ctx.font = fontFn(px); lines = wrap(ctx, text, maxW);
    const maxLines = Math.max(1, Math.floor(maxH / (px * lh)));
    if (lines.length > maxLines) { lines = lines.slice(0, maxLines); lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, '') + '…'; }
    return { px: px, lines: lines, h: lines.length * px * lh };
}
function drawLines(ctx, o, x, y, lh) {
    o.lines.forEach(function (ln, i) { ctx.fillText(ln, x, y + i * o.px * lh + o.px * lh / 2); });
}

// ---- fonts ------------------------------------------------------------------
function loadFonts(opts) {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    const t = (opts.text || '') + (opts.heading || '') + (opts.source || '') + (opts.title || '');
    const jobs = [
        document.fonts.load('700 40px "Noto Serif Bengali"', t || 'আ'),
        document.fonts.load('500 40px "Noto Serif Bengali"', t || 'আ'),
        document.fonts.load('400 40px "Noto Serif Bengali"', t || 'আ')
    ];
    if (opts.arabic) jobs.push(document.fonts.load('700 40px Amiri', opts.arabic), document.fonts.load('400 40px Amiri', opts.arabic));
    return Promise.all(jobs.map(function (p) { return p.catch(function () { return null; }); }));
}

// ---- the card ---------------------------------------------------------------
function draw(opts, themeKey) {
    const th = THEMES[themeKey] || THEMES.emerald;
    return loadFonts(opts).then(function () {
        const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
        const ctx = cv.getContext('2d');
        background(ctx, th); frame(ctx, th);
        crescent(ctx, th, W / 2, 150, 42);
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr';
        ctx.fillStyle = th.gold; ctx.font = '700 40px ' + BN;
        ctx.fillText(opts.title || '', W / 2, 252);
        divider(ctx, th, W / 2, 300, 240);

        // content area
        const top = 338, bottom = 1130, maxW = 800;
        let src = null;
        if (opts.source) src = fit(ctx, '— ' + opts.source, function (p) { return '600 ' + p + 'px ' + BN; }, 860, 100, 34, 24, 1.4);
        const srcH = src ? src.h + 46 : 0, area = bottom - top - srcH;
        const blocks = [];
        let used = 0;
        if (opts.heading) {
            const hd = fit(ctx, opts.heading, function (p) { return '700 ' + p + 'px ' + BN; }, maxW, 130, 46, 32, 1.4);
            blocks.push({ k: 'h', o: hd, lh: 1.4 }); used += hd.h + 26;
        }
        if (opts.arabic) {
            const ar = fit(ctx, opts.arabic, function (p) { return '700 ' + p + 'px ' + AR; }, maxW, opts.text ? Math.min(330, area * .42) : area * .8, 78, 34, 1.9);
            blocks.push({ k: 'a', o: ar, lh: 1.9 }); used += ar.h + (opts.text ? 54 : 0);
        }
        if (opts.text) {
            const left = Math.max(160, area - used - 10);
            const tx = fit(ctx, opts.text, function (p) { return '500 ' + p + 'px ' + BN; }, maxW, left, opts.arabic ? 52 : 68, 26, 1.6);
            blocks.push({ k: 't', o: tx, lh: 1.6 }); used += tx.h;
        }
        let y = top + Math.max(0, (area - used) / 2);
        blocks.forEach(function (b, i) {
            if (b.k === 'h') { ctx.font = '700 ' + b.o.px + 'px ' + BN; ctx.fillStyle = th.gold2; ctx.direction = 'ltr'; drawLines(ctx, b.o, W / 2, y, b.lh); y += b.o.h + 26; }
            else if (b.k === 'a') {
                ctx.font = '700 ' + b.o.px + 'px ' + AR; ctx.fillStyle = th.gold2; ctx.direction = 'rtl'; drawLines(ctx, b.o, W / 2, y, b.lh); y += b.o.h;
                ctx.direction = 'ltr';
                if (opts.text) { divider(ctx, th, W / 2, y + 27, 150); y += 54; }
            } else { ctx.font = '500 ' + b.o.px + 'px ' + BN; ctx.fillStyle = th.text; ctx.direction = 'ltr'; drawLines(ctx, b.o, W / 2, y, b.lh); y += b.o.h; }
        });

        // source line, right under the text
        if (src) {
            ctx.font = '600 ' + src.px + 'px ' + BN; ctx.fillStyle = th.gold; ctx.direction = 'ltr';
            drawLines(ctx, src, W / 2, y + 46, 1.4);
        }
        // footer
        divider(ctx, th, W / 2, 1186, 120);
        ctx.fillStyle = th.text; ctx.globalAlpha = .9; ctx.font = '700 28px ' + BN; ctx.direction = 'ltr';
        ctx.fillText('The Role of Ahl al-Bayt (a.s)', W / 2, 1228);
        ctx.fillStyle = th.sub; ctx.globalAlpha = .85; ctx.font = '500 24px ' + BN;
        ctx.fillText('ahlalbayt313.github.io', W / 2, 1264);
        ctx.globalAlpha = 1;
        return cv;
    });
}

// ---- dialog -----------------------------------------------------------------
let _ov = null, _opts = null, _theme = 'emerald', _blob = null, _url = null, _busy = 0, _lastFocus = null;

function savedTheme() { try { const t = localStorage.getItem(THEME_KEY); return THEMES[t] ? t : null; } catch (e) { return null; } }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

function close() {
    if (!_ov) return;
    document.removeEventListener('keydown', onKey, true);
    if (_url) { try { URL.revokeObjectURL(_url); } catch (e) { /* ignore */ } }
    _url = null; _blob = null; _ov.remove(); _ov = null;
    if (_lastFocus && _lastFocus.focus) { try { _lastFocus.focus(); } catch (e) { /* ignore */ } }
}
function onKey(ev) { if (ev.key === 'Escape') { ev.stopPropagation(); close(); } }

function paint() {
    if (!_ov) return;
    const my = ++_busy, img = _ov.querySelector('#sc-img'), st = _ov.querySelector('#sc-status');
    st.textContent = T('কার্ড তৈরি হচ্ছে…', 'Making the card…');
    _ov.querySelectorAll('[data-sc-theme]').forEach(function (b) {
        const on = b.getAttribute('data-sc-theme') === _theme; b.setAttribute('aria-pressed', on ? 'true' : 'false');
        b.style.outline = on ? '3px solid #d4af37' : '1px solid rgba(255,255,255,.25)'; b.style.outlineOffset = on ? '1px' : '0';
    });
    draw(_opts, _theme).then(function (cv) {
        cv.toBlob(function (blob) {
            if (my !== _busy || !_ov) return;
            if (!blob) { st.textContent = T('কার্ড বানানো যায়নি', 'Could not make the card'); return; }
            if (_url) { try { URL.revokeObjectURL(_url); } catch (e) { /* ignore */ } }
            _blob = blob; _url = URL.createObjectURL(blob); img.src = _url; st.textContent = '';
        }, 'image/png');
    }).catch(function () { if (my === _busy && _ov) st.textContent = T('কার্ড বানানো যায়নি', 'Could not make the card'); });
}

function fileName() { return 'ahlbayt-' + (_opts.kind || 'card') + '-' + new Date().toISOString().slice(0, 10) + '.png'; }
function download() {
    if (!_blob) return;
    const a = document.createElement('a'); a.href = _url; a.download = fileName(); document.body.appendChild(a); a.click(); a.remove();
}
function share() {
    if (!_blob) return;
    try {
        const f = new File([_blob], fileName(), { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [f] }) && navigator.share) {
            navigator.share({ files: [f], title: _opts.title || 'Ahl al-Bayt' }).catch(function () { /* cancelled */ });
            return;
        }
    } catch (e) { /* fall through to download */ }
    download();
    if (typeof showToast === 'function') showToast(T('ছবি ডাউনলোড হয়েছে', 'Image downloaded'), 'success');
}

function open(opts) {
    if (!opts || !(opts.text || opts.arabic)) return;
    close();
    _opts = opts; _lastFocus = document.activeElement;
    _theme = savedTheme() || opts.theme || (opts.kind === 'muharram' ? 'maroon' : 'emerald');
    if (opts.kind === 'muharram' && !savedTheme()) _theme = 'maroon';
    const ov = document.createElement('div');
    ov.id = 'sc-overlay'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', T('শেয়ার কার্ড', 'Share card'));
    ov.style.cssText = 'position:fixed;inset:0;z-index:10050;background:rgba(0,0,0,.78);display:flex;align-items:center;justify-content:center;padding:10px;overscroll-behavior:contain';
    const btn = 'min-height:44px;padding:8px 14px;border-radius:12px;font-weight:700;font-size:.9rem;cursor:pointer;border:1px solid rgba(255,255,255,.25);color:#fff;background:rgba(255,255,255,.1)';
    ov.innerHTML =
        '<div style="width:100%;max-width:430px;max-height:100%;overflow:auto;background:#0b1512;border:1px solid rgba(212,175,55,.45);border-radius:20px;padding:12px;color:#fff">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px">' +
        '<strong style="font-size:1rem">🖼️ ' + esc(T('শেয়ার কার্ড', 'Share card')) + '</strong>' +
        '<button type="button" data-sc-close aria-label="' + esc(T('বন্ধ করুন', 'Close')) + '" style="min-width:44px;min-height:44px;border-radius:12px;font-size:1.2rem;cursor:pointer;border:1px solid rgba(255,255,255,.25);color:#fff;background:rgba(255,255,255,.1)">✕</button></div>' +
        '<div style="position:relative;border-radius:12px;overflow:hidden;background:#000;aspect-ratio:1080/1350">' +
        '<img id="sc-img" alt="' + esc(T('কার্ডের প্রিভিউ', 'Card preview')) + '" style="display:block;width:100%;height:100%;object-fit:contain">' +
        '<div id="sc-status" role="status" aria-live="polite" style="position:absolute;left:0;right:0;top:50%;transform:translateY(-50%);text-align:center;font-size:.9rem;color:#e5e7eb"></div></div>' +
        '<div style="display:flex;gap:8px;margin:10px 0" role="group" aria-label="' + esc(T('কার্ডের রং', 'Card look')) + '">' +
        Object.keys(THEMES).map(function (k) { return '<button type="button" data-sc-theme="' + k + '" aria-pressed="false" style="' + btn + ';flex:1">' + esc(T(THEMES[k].n[0], THEMES[k].n[1])) + '</button>'; }).join('') + '</div>' +
        '<div style="display:flex;gap:8px"><button type="button" data-sc-share style="' + btn + ';flex:1;background:#065f46;border-color:#10b981">📤 ' + esc(T('শেয়ার', 'Share')) + '</button>' +
        '<button type="button" data-sc-dl style="' + btn + ';flex:1">⬇️ ' + esc(T('ডাউনলোড', 'Download')) + '</button></div></div>';
    ov.addEventListener('click', function (ev) {
        const t = ev.target;
        if (t === ov || (t.closest && t.closest('[data-sc-close]'))) { close(); return; }
        const th = t.closest && t.closest('[data-sc-theme]');
        if (th) { _theme = th.getAttribute('data-sc-theme'); try { localStorage.setItem(THEME_KEY, _theme); } catch (e) { /* ignore */ } paint(); return; }
        if (t.closest && t.closest('[data-sc-share]')) { share(); return; }
        if (t.closest && t.closest('[data-sc-dl]')) { download(); }
    });
    document.body.appendChild(ov); _ov = ov;
    document.addEventListener('keydown', onKey, true);
    const first = ov.querySelector('[data-sc-share]'); if (first) first.focus();
    paint();
}

// ---- triggers from the home page ---------------------------------------------
function fromAction(kind) {
    const bn = !EN();
    try {
        if (kind === 'hadith' && typeof getDailyHadith === 'function') {
            const h = getDailyHadith(); if (!h) return;
            open({ kind: 'hadith', title: T('আজকের হাদিস', "Today's Hadith"), text: bn ? (h.textBn || h.textEn) : (h.textEn || h.textBn), source: bn ? (h.sourceBn || h.sourceEn) : (h.sourceEn || h.sourceBn) });
        } else if (kind === 'ayah' && typeof getDailyAyah === 'function') {
            const a = getDailyAyah(); if (!a) return;
            open({ kind: 'ayah', title: T('আজকের আয়াত', "Today's Verse"), arabic: a.arabic || '', text: bn ? (a.meaningBn || a.meaningEn || '') : (a.meaningEn || a.meaningBn || ''), source: bn ? (a.ref || a.refEn || '') : (a.refEn || a.ref || '') });
        }
    } catch (e) { /* never break the page */ }
}
document.addEventListener('click', function (ev) {
    const el = ev.target && ev.target.closest ? ev.target.closest('[data-sc-act]') : null;
    if (!el) return;
    const k = el.getAttribute('data-sc-act');
    if (k === 'hadith' || k === 'ayah') { ev.preventDefault(); fromAction(k); }
});

window.abShareCard = { open: open, close: close, draw: draw, THEMES: THEMES };
})();
