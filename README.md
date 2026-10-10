# PlayGround

<!-- omgithub:readme:start -->
## 🚀 Build, play, and remix with OMGithub

**Created using [OMGithub.com](https://omgithub.com).**

[![OMGithub](https://img.shields.io/badge/OMGithub-Open%20project-orange?style=for-the-badge)](https://omgithub.com/uop0/PlayGround)
[![GitHub](https://img.shields.io/badge/GitHub-Source-181717?logo=github&style=for-the-badge)](https://github.com/uop0/PlayGround)

- 🎮 [Open the project](https://omgithub.com/uop0/PlayGround).
- ✨ [Remix this project](https://omgithub.com/?remix=uop0%2FPlayGround).
- 💻 [Explore the source](https://github.com/uop0/PlayGround).
- 🛠️ [Check build runs](https://github.com/uop0/PlayGround/actions).
- 🐛 [Report an issue](https://github.com/uop0/PlayGround/issues).
- 👤 [Explore the creator's projects](https://omgithub.com/uop0).
- 🌍 [Create with OMGithub](https://omgithub.com).
<!-- omgithub:readme:end -->

---

# 🖤 BlackScript | @FFQPU

موقع أدوات عربية فاخر (RTL) بواجهة سوداء + نيون، مبني بـ **Python Flask**.
سريع · آمن · مجاني 100% · بدون تسجيل.

- 👤 الحساب: **@FFQPU**
- ✈️ تيليجرام: **https://t.me/FFQPU**
- 🏷️ العنوان: `BlackScript | @FFQPU`
- 🦶 الفوتر: `BlackScript — Developed by @FFQPU`

## ✨ المميزات

- شريط Badges متحرك (Marquee): سريع، آمن، Python Tools، مجاني 100%، بدون تسجيل، @FFQPU
- شارة `v1.0` نابضة + نقطة خضراء `Online` في الهيدر
- شارة `@FFQPU` متوهجة في الفوتر
- شارات `New` / `Fast` / `Featured` على كل بطاقة أداة
- زر تيليجرام عائم (Pulse + دوران + Glow)
- شريط إعلان متحرك: `BlackScript v1.0 — Developed by @FFQPU`
- شاشة تحميل بشعار BlackScript + مؤشر مخصص + Parallax في Hero
- وضع ليلي (افتراضي) + وضع نهاري، بحث فوري، Toast، نسخ تلقائي، متجاوب 100%

## 🛠️ الأدوات (كلها تعمل فعلياً)

| # | الأداة | الرابط |
|---|--------|--------|
| 1 | تشفير Base64 (Encode/Decode) | `/tools/base64` |
| 2 | منسّق JSON + Validator | `/tools/json` |
| 3 | مولّد البصمات MD5/SHA1/SHA256/SHA512 | `/tools/hash` |
| 4 | مولّد UUID | `/tools/uuid` |
| 5 | مولّد كلمات المرور | `/tools/password` |
| 6 | مولّد QR (تحميل PNG) | `/tools/qrcode` |
| 7 | مختصر الروابط | `/tools/url` |
| 8 | كاشف IP | `/tools/ip` |
| 9 | مشغّل بايثون (Sandbox + مهلة 5 ثوانٍ + حظر دوال النظام) | `/tools/python` |

## 📁 هيكل المشروع

```
app.py
requirements.txt
templates/
  base.html
  index.html
  404.html
  tools/
    base64.html  json.html  hash.html  uuid.html  password.html
    qrcode.html  url.html  ip.html  python.html
static/
  css/style.css
  js/script.js
  img/logo.svg
```

## ▶️ التشغيل محلياً

```bash
pip install -r requirements.txt
python app.py
# افتح: http://127.0.0.1:5000
```

## ☁️ النشر على Render

1. ارفع المشروع على GitHub.
2. في [render.com](https://render.com) اختر **New → Web Service**.
3. الإعدادات:
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `python app.py` (أو `gunicorn app:app`)
   - **Environment:** `PORT` يُضبط تلقائياً — التطبيق يقرأ `os.environ["PORT"]`.
4. اضغط Deploy.

## ☁️ النشر على Railway

1. ارفع المشروع على GitHub.
2. في [railway.app](https://railway.app) اختر **New Project → Deploy from GitHub**.
3. أضف متغير `PORT` (يُضبط تلقائياً غالباً).
4. أمر التشغيل الافتراضي: `python app.py`.

## ⚠️ ملاحظة أمان (مشغّل بايثون)

نسخة تجريبية تعليمية: تنفيذ معزول جزئياً عبر `subprocess` بمهلة 5 ثوانٍ
ومنع `os / sys / subprocess / open / eval / exec…`. لا تستخدمه لأكواد
غير موثوقة في بيئة إنتاجية دون حاوية (Docker/gVisor).
