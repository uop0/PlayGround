#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
BlackScript | @FFQPU
Luxurious black + neon Arabic RTL online tools website.
Run:  pip install -r requirements.txt && python app.py
"""
import base64
import hashlib
import io
import ipaddress
import json
import random
import re
import secrets
import socket
import string
import subprocess
import sys
import tempfile
import os
import uuid
from datetime import datetime
from urllib.parse import urlparse

from flask import Flask, jsonify, redirect, render_template, request, url_for

try:
    import qrcode
    HAS_QRCODE = True
except Exception:
    HAS_QRCODE = False

app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "blackscript-ffqpu-secret-v1")
app.config["JSON_AS_ASCII"] = False

SITE = {
    "name": "BlackScript",
    "user": "@FFQPU",
    "telegram": "https://t.me/FFQPU",
    "version": "v1.0",
    "year": datetime.now().year,
}

# ---------------------------------------------------------------- tools meta
TOOLS = [
    {"slug": "base64", "icon": "fa-solid fa-code", "ar": "تشفير Base64",
     "en": "Base64 Encode / Decode", "desc": "تشفير وفك تشفير النصوص بخوارزمية Base64 بسرعة وأمان.",
     "badge": "Fast", "badge_class": "badge-fast", "color": "green"},
    {"slug": "json", "icon": "fa-solid fa-brackets-curly", "ar": "منسّق JSON",
     "en": "JSON Formatter & Validator", "desc": "تنسيق ملفات JSON والتحقق من صحتها مع تلوين احترافي.",
     "badge": "Featured", "badge_class": "badge-featured", "color": "violet"},
    {"slug": "hash", "icon": "fa-solid fa-fingerprint", "ar": "مولّد البصمات",
     "en": "Hash Generator MD5/SHA", "desc": "توليد MD5 و SHA1 و SHA256 و SHA512 لأي نص فوراً.",
     "badge": "Fast", "badge_class": "badge-fast", "color": "blue"},
    {"slug": "uuid", "icon": "fa-solid fa-id-card", "ar": "مولّد UUID",
     "en": "UUID Generator", "desc": "توليد معرفات UUID v4 فريدة بضغطة واحدة مع نسخ تلقائي.",
     "badge": "New", "badge_class": "badge-new", "color": "green"},
    {"slug": "password", "icon": "fa-solid fa-key", "ar": "مولّد كلمات المرور",
     "en": "Password Generator", "desc": "كلمات مرور قوية وعشوائية بطول وخيارات مخصصة.",
     "badge": "Featured", "badge_class": "badge-featured", "color": "violet"},
    {"slug": "qrcode", "icon": "fa-solid fa-qrcode", "ar": "مولّد QR",
     "en": "QR Code Generator", "desc": "حوّل أي نص أو رابط إلى رمز QR وحمّله كصورة.",
     "badge": "New", "badge_class": "badge-new", "color": "green"},
    {"slug": "url", "icon": "fa-solid fa-link", "ar": "مختصر الروابط",
     "en": "URL Shortener", "desc": "اختصر روابطك الطويلة إلى روابط قصيرة أنيقة.",
     "badge": "New", "badge_class": "badge-new", "color": "green"},
    {"slug": "ip", "icon": "fa-solid fa-network-wired", "ar": "كاشف IP",
     "en": "IP Lookup", "desc": "تحليل عنوان IP: النوع، النطاق، DNS العكسي.",
     "badge": "Fast", "badge_class": "badge-fast", "color": "blue"},
    {"slug": "python", "icon": "fa-brands fa-python", "ar": "مشغّل بايثون",
     "en": "Python Code Runner", "desc": "جرّب أكواد بايثون بأمان مع مهلة زمنية وتحذير أمني.",
     "badge": "Featured", "badge_class": "badge-featured", "color": "violet"},
]

URL_STORE = {}  # code -> long url (in-memory demo)

# --------------------------------------------------------------- helpers
def tool_by_slug(slug):
    for t in TOOLS:
        if t["slug"] == slug:
            return t
    return None


def short_code(length=6):
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


BLOCKED_PATTERNS = [
    r"\bos\b", r"\bsys\b", r"subprocess", r"socket", r"shutil",
    r"pathlib", r"open\s*\(", r"__import__", r"eval\s*\(", r"exec\s*\(",
    r"compile\s*\(", r"os\.", r"sys\.", r"pty", r"threading", r"multiprocessing",
]

MARQUEE_ITEMS = ["سريع ⚡", "آمن 🔒", "Python Tools 🐍", "مجاني 100%", "بدون تسجيل", "@FFQPU"]


@app.context_processor
def inject_globals():
    return {"SITE": SITE, "TOOLS": TOOLS, "MARQUEE_ITEMS": MARQUEE_ITEMS}


# ---------------------------------------------------------------- routes
@app.route("/")
def index():
    return render_template("index.html")


@app.route("/tools/<slug>")
def tool_page(slug):
    tool = tool_by_slug(slug)
    if not tool:
        return render_template("404.html"), 404
    return render_template(f"tools/{slug}.html", tool=tool)


@app.route("/s/<code>")
def short_redirect(code):
    target = URL_STORE.get(code)
    if not target:
        return render_template("404.html"), 404
    return redirect(target)


@app.errorhandler(404)
def not_found(e):
    return render_template("404.html"), 404


# ---------------------------------------------------------------- APIs
@app.route("/api/base64", methods=["POST"])
def api_base64():
    data = request.get_json(force=True, silent=True) or {}
    text = data.get("text", "")
    mode = data.get("mode", "encode")
    try:
        if mode == "decode":
            cleaned = "".join(text.split())
            # pad if needed
            cleaned += "=" * (-len(cleaned) % 4)
            out = base64.b64decode(cleaned).decode("utf-8", errors="strict")
        else:
            out = base64.b64encode(text.encode("utf-8")).decode("ascii")
        return jsonify({"ok": True, "result": out})
    except Exception as ex:
        return jsonify({"ok": False, "error": f"خطأ: {ex}"}), 400


@app.route("/api/json", methods=["POST"])
def api_json():
    data = request.get_json(force=True, silent=True) or {}
    text = data.get("text", "")
    indent = int(data.get("indent", 2) or 2)
    indent = max(0, min(indent, 8))
    try:
        obj = json.loads(text)
        pretty = json.dumps(obj, ensure_ascii=False, indent=indent, sort_keys=False)
        return jsonify({"ok": True, "result": pretty})
    except Exception as ex:
        return jsonify({"ok": False, "error": f"JSON غير صالح: {ex}"}), 400


@app.route("/api/hash", methods=["POST"])
def api_hash():
    data = request.get_json(force=True, silent=True) or {}
    text = (data.get("text") or "").encode("utf-8")
    return jsonify({
        "ok": True,
        "md5": hashlib.md5(text).hexdigest(),
        "sha1": hashlib.sha1(text).hexdigest(),
        "sha256": hashlib.sha256(text).hexdigest(),
        "sha512": hashlib.sha512(text).hexdigest(),
    })


@app.route("/api/uuid", methods=["POST"])
def api_uuid():
    data = request.get_json(force=True, silent=True) or {}
    try:
        count = int(data.get("count", 1) or 1)
    except Exception:
        count = 1
    count = max(1, min(count, 20))
    return jsonify({"ok": True, "result": [str(uuid.uuid4()) for _ in range(count)]})


@app.route("/api/password", methods=["POST"])
def api_password():
    data = request.get_json(force=True, silent=True) or {}
    try:
        length = int(data.get("length", 16) or 16)
    except Exception:
        length = 16
    length = max(4, min(length, 128))
    use_upper = bool(data.get("upper", True))
    use_lower = bool(data.get("lower", True))
    use_digits = bool(data.get("digits", True))
    use_symbols = bool(data.get("symbols", True))
    pool = ""
    if use_lower:
        pool += string.ascii_lowercase
    if use_upper:
        pool += string.ascii_uppercase
    if use_digits:
        pool += string.digits
    if use_symbols:
        pool += "!@#$%^&*()-_=+[]{};:,.<>?"
    if not pool:
        return jsonify({"ok": False, "error": "اختر مجموعة أحرف واحدة على الأقل"}), 400
    pwd = "".join(secrets.choice(pool) for _ in range(length))
    # strength estimate
    score = len(pool).bit_length() * length
    level = "ضعيفة" if score < 60 else ("متوسطة" if score < 100 else "قوية 🔒")
    return jsonify({"ok": True, "result": pwd, "strength": level})


@app.route("/api/qrcode", methods=["POST"])
def api_qrcode():
    data = request.get_json(force=True, silent=True) or {}
    text = data.get("text", "")
    if not text.strip():
        return jsonify({"ok": False, "error": "أدخل نصاً أو رابطاً أولاً"}), 400
    if not HAS_QRCODE:
        return jsonify({"ok": False, "error": "مكتبة qrcode غير مثبتة"}), 500
    qr = qrcode.QRCode(box_size=10, border=4)
    qr.add_data(text)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#00ff9d", back_color="#0a0a0a").convert("RGB")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode("ascii")
    return jsonify({"ok": True, "result": "data:image/png;base64," + b64})


@app.route("/api/shorten", methods=["POST"])
def api_shorten():
    data = request.get_json(force=True, silent=True) or {}
    long_url = (data.get("url") or "").strip()
    if not long_url:
        return jsonify({"ok": False, "error": "أدخل الرابط أولاً"}), 400
    if not re.match(r"^https?://", long_url, re.I):
        long_url = "https://" + long_url
    try:
        p = urlparse(long_url)
        assert p.netloc
    except Exception:
        return jsonify({"ok": False, "error": "رابط غير صالح"}), 400
    code = short_code()
    while code in URL_STORE:
        code = short_code()
    URL_STORE[code] = long_url
    short = request.host_url.rstrip("/") + "/s/" + code
    return jsonify({"ok": True, "result": short, "code": code})


@app.route("/api/ip", methods=["POST"])
def api_ip():
    data = request.get_json(force=True, silent=True) or {}
    ip_str = (data.get("ip") or "").strip()
    if not ip_str:
        # client ip
        ip_str = request.headers.get("X-Forwarded-For", request.remote_addr or "")
        ip_str = ip_str.split(",")[0].strip()
    try:
        ip = ipaddress.ip_address(ip_str)
    except Exception:
        return jsonify({"ok": False, "error": "عنوان IP غير صالح"}), 400
    info = {
        "ok": True,
        "ip": str(ip),
        "version": f"IPv{ip.version}",
        "is_private": ip.is_private,
        "is_global": ip.is_global,
        "is_multicast": ip.is_multicast,
        "is_loopback": ip.is_loopback,
        "is_reserved": ip.is_reserved,
        "reverse_dns": None,
    }
    try:
        socket.setdefaulttimeout(3)
        info["reverse_dns"] = socket.gethostbyaddr(str(ip))[0]
    except Exception:
        info["reverse_dns"] = "غير متوفر"
    # network hint
    try:
        if ip.version == 4:
            net = ipaddress.ip_network(str(ip) + "/24", strict=False)
            info["network_hint"] = str(net)
        else:
            net = ipaddress.ip_network(str(ip) + "/64", strict=False)
            info["network_hint"] = str(net)
    except Exception:
        info["network_hint"] = "—"
    return jsonify(info)


@app.route("/api/python-run", methods=["POST"])
def api_python_run():
    data = request.get_json(force=True, silent=True) or {}
    code = data.get("code", "")
    if not code.strip():
        return jsonify({"ok": False, "error": "أدخل الكود أولاً"}), 400
    if len(code) > 8000:
        return jsonify({"ok": False, "error": "الكود طويل جداً (الحد 8000 حرف)"}), 400
    for pat in BLOCKED_PATTERNS:
        if re.search(pat, code):
            return jsonify({
                "ok": False,
                "error": f"تم رفض الكود لأسباب أمنية (نمط محظور: {pat}). هذه النسخة التجريبية لا تسمح بالوصول للنظام أو الملفات."
            }), 400
    with tempfile.NamedTemporaryFile("w", suffix=".py", delete=False, encoding="utf-8") as f:
        f.write(code)
        path = f.name
    try:
        proc = subprocess.run(
            [sys.executable, "-I", "-u", path],
            capture_output=True, text=True, timeout=5,
            env={"PATH": os.environ.get("PATH", ""), "PYTHONNOUSERSITE": "1",
                 "PYTHONDONTWRITEBYTECODE": "1"},
        )
        out = (proc.stdout or "") + (proc.stderr or "")
        if len(out) > 4000:
            out = out[:4000] + "\n… (تم اقتطاع الإخراج)"
        return jsonify({"ok": True, "result": out or "(لا يوجد إخراج)",
                        "returncode": proc.returncode})
    except subprocess.TimeoutExpired:
        return jsonify({"ok": False, "error": "انتهت المهلة (5 ثوانٍ) — ربما حلقة لا نهائية؟"}), 400
    except Exception as ex:
        return jsonify({"ok": False, "error": f"خطأ في التنفيذ: {ex}"}), 500
    finally:
        try:
            os.unlink(path)
        except Exception:
            pass


@app.route("/health")
def health():
    return jsonify({"status": "ok", "app": "BlackScript", "owner": "@FFQPU"})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
