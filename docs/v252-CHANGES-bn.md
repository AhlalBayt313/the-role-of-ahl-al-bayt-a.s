# v252 — APK-র ভেতর থেকে শেয়ার করা লিংক এখন অন্যের কাছেও কাজ করে

**সমস্যা:** APK-তে অ্যাপ চলে `https://appassets.androidplatform.net/assets/...` ঠিকানায়। তাই শেয়ার লিংক অন্যের কাছে অচল ছিল:
| কোথা থেকে | আগে কী লিংক যেত |
|---|---|
| `shareContent()` খালি url-এ (হাদিস, দোয়া, সাইটেশন, তারিখ কনভার্টার, খুমুস-যাকাত, ইমামের উক্তি, জ্ঞান কেন্দ্র) | `window.location.href` → appassets ঠিকানা |
| `slPostUrl()` (ব্লগ পোস্ট) | `appassets.../assets/p/<id>.html` |
| `clShareUrl()` (দোয়া/যিয়ারত/আমল) | `appassets.../assets/d/<id>.html` |

**কী বদলেছে:** `assets/js/core/apk-app.js`-এ **শুধু APK-তে** চালু একটি `shareContent` মোড়ক (মূল ফাংশন অক্ষত, কল-সাইট বদলায়নি):
- url খালি → পাবলিক সাইটের একই পেজ (`https://ahlalbayt313.github.io/The-Role-of-Ahl-al-Bayt-a.s/` + বর্তমান `?query`, ওয়েবে যেমন যেত)।
- url-এর হোস্ট `appassets.androidplatform.net` → `/assets/` বাদ দিয়ে পাবলিক হোস্টে (`.../assets/p/12.html` → `.../p/12.html`, query/hash সহ)।
- অন্য সব url (পাবলিক সাইট, `download.html`, বাইরের) অপরিবর্তিত।
- ওয়েব / ইনস্টল-করা PWA / iPhone / অন্য WebView-তে মোড়ক চালুই হয় না — আচরণ হুবহু আগের মতো।

**অন্য ফাইল:** `sw.js` (CACHE `ahlbayt-v252`), এই নোট। `script-1-core.js`, `share-links.js`, `content-links.js` অপরিবর্তিত।

**পরীক্ষা (jsdom):** APK-তে খালি url, `/assets/p/..`, `/assets/d/..?a=1#h`, পাবলিক ও বাইরের url, এবং আসল `shareHadith()` / `shareDua()` কল — সব ঠিক। সাধারণ হোস্ট, iPhone ও অন্য WebView-তে `shareContent` মোড়কহীন।

**⚠️ APK আবার বিল্ড করুন:** ফিক্স APK-র ভেতরে পেতে v252 assets দিয়ে APK নতুন করে বিল্ড করে Release-এ দিন (আগের APK-তে এখনো পুরনো আচরণ)।

**আগের অবস্থায় ফেরা:** `apk-app.js`-এ `4. share links …` ব্লক ও `window.apkPublicShareUrl` মুছুন।

**`sw.js`:** cache `ahlbayt-v252`।
