"""Python Shield — تطبيق تشفير PY + مساعد AI + قسم مدفوع | @FFQPU"""
import hashlib
import os
import re
import time
from pathlib import Path
from flask import Flask, jsonify, request, send_from_directory, render_template_string

from encryptor import encrypt_code
from ai_helper import diagnose, build_tool_scaffold

APP_DIR = Path(__file__).parent
HOSTED_DIR = APP_DIR / "hosted"
HOSTED_DIR.mkdir(exist_ok=True)
LICENSE_FILE = APP_DIR / ".license"

app = Flask(__name__, static_folder="static", static_url_path="/static")
app.config["MAX_CONTENT_LENGTH"] = 2 * 1024 * 1024  # 2MB — سريع وقوي

PRICE_TEXT = "5 عملات آسياسيل"
DEVELOPER = "@FFQPU"


def is_activated() -> bool:
    try:
        if LICENSE_FILE.exists():
            data = LICENSE_FILE.read_text().strip()
            return data.startswith("ACTIVE:")
    except Exception:
        pass
    return False


def make_activation_code(receipt: str) -> str:
    h = hashlib.sha256(f"FFQPU:{receipt.strip()}:ASIACELL-5".encode()).hexdigest()[:8].upper()
    return f"FFQPU-{h}"


def verify_activation_code(code: str) -> bool:
    code = (code or "").strip().upper()
    if not re.fullmatch(r"FFQPU-[0-9A-F]{8}", code):
        return False
    return True  # يُطابق النمط؛ التفعيل النهائي عبر المطور @FFQPU


@app.get("/")
def index():
    return send_from_directory(str(APP_DIR), "index.html")


@app.post("/api/encrypt")
def api_encrypt():
    t0 = time.time()
    data = request.get_json(force=True, silent=True) or {}
    code = data.get("code", "")
    key = (data.get("key", "FFQPU") or "FFQPU")[:64]
    level = data.get("level", "strong")
    if level not in ("light", "medium", "strong"):
        level = "strong"
    try:
        out = encrypt_code(code, key, level)
    except SyntaxError as e:
        return jsonify(ok=False, error=f"الكود يحتوي خطأ نحوي (سطر {e.lineno}): {e.msg} — أصلحه عبر تبويب مساعد AI أولاً."), 400
    except ValueError as e:
        return jsonify(ok=False, error=str(e)), 400
    ms = int((time.time() - t0) * 1000)
    return jsonify(ok=True, encrypted=out, ms=ms,
                   stats={"in": len(code), "out": len(out),
                          "ratio": round(len(out) / max(1, len(code)), 2)})


@app.post("/api/diagnose")
def api_diagnose():
    data = request.get_json(force=True, silent=True) or {}
    res = diagnose(data.get("code", ""), data.get("error", ""))
    return jsonify(ok=True, **res)


@app.post("/api/activate")
def api_activate():
    data = request.get_json(force=True, silent=True) or {}
    code = (data.get("code", "") or "").strip().upper()
    receipt = (data.get("receipt", "") or "").strip()
    # طريقة 1: كود تفعيل مباشر
    if verify_activation_code(code):
        LICENSE_FILE.write_text(f"ACTIVE:{code}")
        return jsonify(ok=True, msg="✅ تم تفعيل القسم المدفوع بنجاح! أهلاً بك.")
    # طريقة 2: رقم إيصال تحويل آسياسيل → نولّد كوداً وينتظر تأكيد المطور
    if receipt and len(receipt) >= 4:
        gen = make_activation_code(receipt)
        return jsonify(ok=False, pending=True,
                       msg=f"تم استلام الإيصال. كودك المبدئي: {gen} — أرسله مع لقطة التحويل إلى المطور {DEVELOPER} للتفعيل النهائي.",
                       code=gen)
    return jsonify(ok=False, msg="❌ كود غير صالح. حوّل 5 عملات آسياسيل ثم أدخل رقم الإيصال أو تواصل مع @FFQPU."), 400


@app.get("/api/status")
def api_status():
    return jsonify(active=is_activated(), price=PRICE_TEXT, dev=DEVELOPER)


@app.post("/api/build-tool")
def api_build_tool():
    if not is_activated():
        return jsonify(ok=False, error=f"🔒 هذه الميزة مدفوعة ({PRICE_TEXT}). فعّل اشتراكك أولاً أو تواصل مع {DEVELOPER}."), 403
    data = request.get_json(force=True, silent=True) or {}
    desc = data.get("description", "")
    if not desc.strip():
        return jsonify(ok=False, error="اكتب وصف الأداة أولاً."), 400
    code = build_tool_scaffold(desc)
    # تشفير تلقائي اختياري
    if data.get("encrypt"):
        code = encrypt_code(code, data.get("key", "FFQPU"), "medium")
    return jsonify(ok=True, tool=code)


@app.post("/api/host")
def api_host():
    """استضافة مجانية داخل التطبيق (للمشتركين): حفظ الملف وتوليد رابط تحميل."""
    if not is_activated():
        return jsonify(ok=False, error=f"🔒 الاستضافة المجانية للمشتركين فقط ({PRICE_TEXT})."), 403
    data = request.get_json(force=True, silent=True) or {}
    name = re.sub(r"[^a-zA-Z0-9_\-]", "_", (data.get("filename", "tool") or "tool"))[:40] or "tool"
    code = data.get("code", "")
    if not code.strip():
        return jsonify(ok=False, error="لا يوجد كود للاستضافة."), 400
    fname = f"{name}_{int(time.time())}.py"
    (HOSTED_DIR / fname).write_text(code, encoding="utf-8")
    files = sorted([p.name for p in HOSTED_DIR.glob("*.py")])[-20:]
    return jsonify(ok=True, file=fname, url=f"/hosted/{fname}", files=files)


@app.get("/hosted/<path:fname>")
def hosted_file(fname):
    return send_from_directory(str(HOSTED_DIR), fname, as_attachment=True)


@app.get("/api/files")
def api_files():
    files = sorted([p.name for p in HOSTED_DIR.glob("*.py")])[-20:]
    return jsonify(files=files)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"🛡️ Python Shield يعمل على http://127.0.0.1:{port} | {DEVELOPER}")
    app.run(host="0.0.0.0", port=port, debug=False)
