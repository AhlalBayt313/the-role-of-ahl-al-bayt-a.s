# v251 — অ্যাপ শেয়ার, APK ডাউনলোড পেজ ও APK-তে ইনস্টল-বাটন ঠিক

**কী বদলেছে**
| | |
|---|---|
| ✓ নতুন `download.html` | Android APK ডাউনলোড বাটন, ইনস্টলের ৫ ধাপ (অজানা উৎস, Play Protect), নিরাপত্তা নোট (শুধু ইন্টারনেট পারমিশন), আপডেট/ব্যাকআপ নোট, iPhone ও কম্পিউটারের জন্য ওয়েব অ্যাপ ইনস্টল। বাংলা/English টগল; iPhone-এ APK অংশ লুকায়। `sitemap.xml`-এ যোগ |
| ✓ "অ্যাপ শেয়ার করুন" | মোবাইল মেনু ড্রয়ার + ফুটারের Quick Links-এ। বিদ্যমান `shareContent()` চালায় (নেটিভ শেয়ার শিট, নইলে কপি/WhatsApp)। লিংক সবসময় নির্দিষ্ট `download.html` — `window.location` নয় |
| ✓ APK লিংক | Android ব্রাউজারে (APK/ইনস্টল-করা PWA নয়) ড্রয়ার ও ফুটারে "Android অ্যাপ (APK) ডাউনলোড" |
| ✓ APK-র ভেতরে "Install App" বাটন লুকানো | Android WebView `display-mode: standalone` জানায় না, তাই `isPWAInstalled()` মিথ্যা বলত। এখন হোস্ট `appassets.androidplatform.net` হলে true ফেরত দেয় (অন্য WebView, যেমন Facebook/Gmail ইন-অ্যাপ ব্রাউজার, APK ধরা হয় না) |

**কীভাবে:** নতুন ফাইল `assets/js/core/apk-app.js` (`footer-seo-links.js`-এর মতো `render()` মুড়ে)। `script-2-ui.js`, `script-4-boot.js`, কোনো বিদ্যমান ফাংশন/আইডি/ক্লাস বদলায়নি। `index.html`-এ ১টি script tag (`footer-seo-links.js`-এর পরে, `browser-history.js`-এর আগে), `sw.js`-এ precache এন্ট্রি + CACHE `ahlbayt-v251`।

**⚠️ করণীয় (আপনার দিকে)**
1. **GitHub Release:** রেপোতে একটি Release বানিয়ে APK-টি ঠিক `Ahl_al-Bayt.apk` নামে সংযুক্ত করুন। `download.html`-এর বাটন `https://github.com/ahlalbayt313/The-Role-of-Ahl-al-Bayt-a.s/releases/latest/download/Ahl_al-Bayt.apk` লিংকে যায় — রেপোর নাম/ইউজার আলাদা হলে `download.html`-এ ওই একটি লিংক (দুই ভাষায় ২ জায়গা) বদলান।
2. **APK আবার বানান:** APK-র ভেতরের নতুন শেয়ার বাটন ও লুকানো ইনস্টল-বাটন পেতে v251 assets দিয়ে APK নতুন করে বিল্ড করে Release-এ দিন। `download.html` ওয়েবসাইটের অংশ, APK ছাড়াই চালু হবে।
3. APK-র সাইনিং কী (`my-upload-key.jks`) ব্যাকআপ রাখুন — একই কী না হলে ইউজারকে আনইনস্টল করতে হবে।
4. `public/`-এর পুরনো zip দুটি ও APK রেপোতে পুশ করবেন না; কী-ফাইল/`.env`/পুরো zip-ও নয়।

**জানা সীমা:** Android WebView-তে সাধারণত `navigator.share` নেই, তাই APK-র ভেতরে শেয়ার বাটন নেটিভ শিটের বদলে লিংক কপি করে ("কপি হয়েছে" টোস্ট)। নেটিভ শিট চাইলে `MainActivity.kt`-এ ব্রিজ লাগবে (আলাদা ধাপ, অনুমোদন বাকি)।

**আগে থেকে থাকা বাগ (এই সংস্করণে ঠিক করা হয়নি):** APK-র ভেতর থেকে হাদিস/দোয়া/সাইটেশন শেয়ারে `shareContent()` url না পেলে `window.location.href` নেয় — যা APK-তে `appassets.androidplatform.net` (অন্যের কাছে অচল লিংক)।

**আগের অবস্থায় ফেরা:** `index.html` থেকে `apk-app.js`-এর script tag, `sw.js` থেকে precache এন্ট্রি, `sitemap.xml` থেকে `download.html` এন্ট্রি ও `download.html`, `apk-app.js` ফাইল মুছুন।

**`sw.js`:** cache `ahlbayt-v251`।
