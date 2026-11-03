// ============================================================================
// APK + "SHARE THE APP"  (v251)
// ----------------------------------------------------------------------------
// WHAT THIS ADDS (purely additive — script-2-ui.js, script-4-boot.js and every
// existing id / class / function name are untouched)
//
//   1  "Share the app" option
//        • mobile menu drawer (end of the page list)
//        • footer "Quick Links" grid
//      Both call the EXISTING shareContent() (script-1-core.js): native share
//      sheet where the browser has one, otherwise clipboard copy / WhatsApp.
//      The link is always the fixed public download page (DOWNLOAD_URL), never
//      window.location — inside the Android APK the app is served from
//      appassets.androidplatform.net, which is a dead link for anyone else.
//
//   2  Android APK link for people using the website in an Android browser
//        (drawer + footer). Not shown inside the APK or an installed PWA.
//
//   3  Inside the APK the "Install App" buttons are hidden.
//        The Android WebView never reports display-mode: standalone, so
//        isPWAInstalled() (script-4-boot.js) said "not installed" and the
//        header / drawer / footer all offered "Install App" inside the app
//        itself. isPWAInstalled is wrapped to return true when the page is
//        served from the APK's own host. Detection is by host name only —
//        other Android WebViews (Facebook / Gmail in-app browsers) are NOT
//        treated as the APK.
//
//   4  (v252) Share links that work for other people, from inside the APK.
//        The APK serves the app from appassets.androidplatform.net, so every
//        link the app built from the current address was dead for the
//        receiver: shareContent() with an empty url (hadith, dua, citation,
//        date converter, Khums & Zakat, imam quote, Knowledge Center) took
//        window.location.href, and slPostUrl() / clShareUrl() (share-links.js /
//        content-links.js: blog posts, dua / ziyarat / amal) took
//        document.baseURI. shareContent is wrapped ONLY inside the APK: an empty
//        url becomes the same page on the public site (PUBLIC_BASE + ?query),
//        a url on the APK host is moved to the public site (the /assets/ prefix
//        dropped: /assets/p/12.html -> p/12.html); any other url is left alone.
//        On the website / installed PWA / iPhone nothing is wrapped.
//
// HOW   render() is wrapped (same pattern as footer-seo-links.js /
//       page-titles.js): after every render the controls are added if the
//       drawer / footer exist and do not have them yet. Nothing is added if
//       the markup is not found. Never throws.
//
// LOAD ORDER   After script-4-boot.js (it re-assigns window.isPWAInstalled),
//              after footer-seo-links.js, BEFORE browser-history.js (which must
//              wrap the final render()).
// ============================================================================
(function () {
    'use strict';
    if (window.__apkApp) return;
    window.__apkApp = true;

    // The one public page that explains how to install (Android APK, iPhone,
    // desktop). Shared links point here so they work for every device.
    var DOWNLOAD_URL = 'https://ahlalbayt313.github.io/The-Role-of-Ahl-al-Bayt-a.s/download.html';
    var APK_HOST = 'appassets.androidplatform.net';   // MainActivity.kt ASSET_DOMAIN
    var PUBLIC_BASE = 'https://ahlalbayt313.github.io/The-Role-of-Ahl-al-Bayt-a.s/';   // the live site (same as DOWNLOAD_URL's folder)

    function isApkApp() {
        try { return location.hostname === APK_HOST; } catch (e) { return false; }
    }
    window.isApkApp = isApkApp;

    function isAndroid() {
        try { return /Android/i.test(navigator.userAgent || ''); } catch (e) { return false; }
    }

    function lang() {
        try { return (typeof state !== 'undefined' && state.language === 'en') ? 'en' : 'bn'; } catch (e) { return 'bn'; }
    }
    function dark() {
        try { return !!(typeof state !== 'undefined' && state.darkMode); } catch (e) { return false; }
    }

    // ── 3. hide "Install App" inside the APK ───────────────────────────────
    var patchedInstall = false;
    if (isApkApp() && typeof window.isPWAInstalled === 'function' && !window.isPWAInstalled.__apk) {
        var patched = function () { return true; };
        patched.__apk = true;
        window.isPWAInstalled = patched;
        patchedInstall = true;
    }

    // ── 4. share links that work outside the APK (v252) ────────────────────
    function publicShareUrl(url) {
        try {
            if (!url) return PUBLIC_BASE + (location.search || '') + (location.hash || '');
            var u = new URL(url, location.href);
            if (u.hostname === APK_HOST) {
                var path = u.pathname.replace(/^\/assets\//, '').replace(/^\//, '');
                if (path === 'index.html') path = '';
                return PUBLIC_BASE + path + u.search + u.hash;
            }
        } catch (e) { /* fall through */ }
        return url;
    }
    window.apkPublicShareUrl = publicShareUrl;
    if (isApkApp() && typeof window.shareContent === 'function' && !window.shareContent.__apk) {
        var _shareContent = window.shareContent;
        var shareWrapped = function (title, text, url) {
            return _shareContent.call(this, title, text, publicShareUrl(url));
        };
        shareWrapped.__apk = true;
        window.shareContent = shareWrapped;
    }

    function alreadyInstalled() {
        try { return typeof window.isPWAInstalled === 'function' ? !!window.isPWAInstalled() : false; } catch (e) { return false; }
    }

    // ── 1. share ────────────────────────────────────────────────────────────
    function shareApp() {
        var bn = lang() !== 'en';
        var title = bn ? '📲 আহলে বাইত (আ.) অ্যাপ' : '📲 Ahl al-Bayt (a.s.) App';
        var text = bn
            ? 'দোয়া, যিয়ারত, নামাজের সময়, হাদিস ও আহলে বাইত (আ.)-এর জ্ঞান — এক অ্যাপে, অফলাইনেও চলে।'
            : 'Duas, ziyarat, prayer times, hadith and Ahl al-Bayt (a.s.) knowledge — in one app, works offline.';
        try {
            if (typeof shareContent === 'function') { shareContent(title, text, DOWNLOAD_URL); return; }
        } catch (e) { /* fall through */ }
        try { window.open('https://wa.me/?text=' + encodeURIComponent(title + '\n' + text + '\n\n' + DOWNLOAD_URL), '_blank'); } catch (e) { /* ignore */ }
    }
    window.apkShareApp = shareApp;

    function closeDrawer() {
        try {
            var m = document.getElementById('mobile-menu-drawer');
            if (m) m.classList.remove('open');
            var b = document.getElementById('mobile-menu-backdrop');
            if (b) b.classList.add('hidden');
            if (typeof state !== 'undefined') state.menuOpen = false;
        } catch (e) { /* ignore */ }
    }

    var L = {
        share:  { bn: 'অ্যাপ শেয়ার করুন',          en: 'Share the app' },
        apk:    { bn: 'Android অ্যাপ (APK) ডাউনলোড', en: 'Download Android app (APK)' }
    };
    var ARROW = '<svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M2 6h8M6 2l4 4-4 4"/></svg>';

    // ── mobile drawer ───────────────────────────────────────────────────────
    function drawerRow(tag, icon, label, d) {
        var el = document.createElement(tag);
        el.className = 'flex items-center gap-3 w-full px-3.5 py-2.5 rounded-2xl text-sm transition-all focus:outline-none text-left';
        el.style.cssText = 'border:1.5px solid transparent;font-weight:500;min-height:48px;text-decoration:none;cursor:pointer;' +
            'background:none;color:' + (d ? '#d1d5db' : '#374151');
        el.innerHTML =
            '<span style="width:32px;height:32px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0;' +
            'background:' + (d ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.05)') + '" aria-hidden="true">' + icon + '</span>' +
            '<span class="flex-1">' + label + '</span>';
        return el;
    }
    function addDrawer() {
        var nav = document.querySelector('#mobile-menu-drawer nav');
        if (!nav || nav.querySelector('[data-apk-share]')) return;
        var l = lang(), d = dark();

        var share = drawerRow('button', '📤', L.share[l], d);
        share.type = 'button';
        share.setAttribute('data-apk-share', '1');
        share.onclick = function () { closeDrawer(); shareApp(); };
        nav.appendChild(share);

        if (isAndroid() && !alreadyInstalled()) {
            var apk = drawerRow('a', '📲', L.apk[l], d);
            apk.href = DOWNLOAD_URL;
            apk.target = '_blank';
            apk.rel = 'noopener';
            apk.setAttribute('data-apk-link', '1');
            apk.onclick = function () { closeDrawer(); };
            nav.appendChild(apk);
        }
    }

    // ── footer quick-links grid ─────────────────────────────────────────────
    function footerRow(tag, label) {
        var el = document.createElement(tag);
        el.className = 'text-left text-sm transition-all hover:translate-x-1';
        el.style.cssText = 'color:rgba(255,255,255,.5);display:flex;align-items:center;gap:5px;text-decoration:none;' +
            'background:none;border:0;padding:0;cursor:pointer;min-height:44px';
        el.onmouseover = function () { this.style.color = '#34d399'; };
        el.onmouseout = function () { this.style.color = 'rgba(255,255,255,.5)'; };
        el.innerHTML = ARROW + ' ' + label;
        return el;
    }
    function addFooter() {
        var footer = document.querySelector('footer.footer-luxury');
        if (!footer || footer.querySelector('[data-apk-share]')) return;
        var btn = footer.querySelector('button[data-action="changePage"]');
        var grid = btn && btn.parentElement;
        if (!grid) return;
        var l = lang();

        var share = footerRow('button', '📤 ' + L.share[l]);
        share.type = 'button';
        share.setAttribute('data-apk-share', '1');
        share.onclick = shareApp;
        grid.appendChild(share);

        if (isAndroid() && !alreadyInstalled()) {
            var apk = footerRow('a', '📲 ' + L.apk[l]);
            apk.href = DOWNLOAD_URL;
            apk.target = '_blank';
            apk.rel = 'noopener';
            apk.setAttribute('data-apk-link', '1');
            grid.appendChild(apk);
        }
    }

    function add() {
        try { addDrawer(); } catch (e) { /* a menu item must never break the app */ }
        try { addFooter(); } catch (e) { /* same */ }
    }

    // ── render() wrapper ────────────────────────────────────────────────────
    if (typeof window.render === 'function' && !window.render.__apk) {
        var _render = window.render;
        var wrapped = function () {
            var r = _render.apply(this, arguments);
            add();
            return r;
        };
        Object.keys(_render).forEach(function (k) { wrapped[k] = _render[k]; });   // keep other wrappers' markers
        wrapped.__apk = true;
        window.render = wrapped;
    }
    add();

    // init() (end of script-4-boot.js) has already rendered once, before
    // isPWAInstalled was patched. If any "Install App" button is in that first
    // render, render again so the APK never shows it.
    if (patchedInstall) {
        try {
            if (document.querySelector('[onclick*="triggerPWAInstall"]') && typeof window.render === 'function') window.render();
        } catch (e) { /* ignore */ }
    }
})();
