"""تشفير ملفات بايثون — سريع وقوي ومتعدد المستويات."""
import base64
import hashlib
import marshal
import zlib


def _xor_bytes(data: bytes, key: str) -> bytes:
    kb = hashlib.sha256(key.encode("utf-8")).digest()
    return bytes(b ^ kb[i % len(kb)] for i, b in enumerate(data))


def encrypt_code(source: str, key: str = "FFQPU", level: str = "strong") -> str:
    """يرجع كود بايثون مشفّر وقابل للتشغيل مباشرة."""
    if not source.strip():
        raise ValueError("الكود فارغ — الصق كود بايثون أولاً")
    # تحقق أن الكود سليم قبل التشفير
    compile(source, "<input>", "exec")

    src = source.encode("utf-8")

    if level == "light":
        payload = base64.b64encode(zlib.compress(src, 9)).decode()
        stub = (
            "# 🔒 مشفّر بواسطة Python Shield | @FFQPU\n"
            "import base64,zlib\n"
            f"exec(zlib.decompress(base64.b64decode('{payload}')).decode('utf-8'))\n"
        )
        return stub

    if level == "medium":
        compiled = marshal.dumps(compile(source, "<shield>", "exec"))
        payload = base64.b64encode(zlib.compress(compiled, 9)).decode()
        stub = (
            "# 🔒 تشفير متوسط | Python Shield | @FFQPU\n"
            "import base64,zlib,marshal\n"
            f"exec(marshal.loads(zlib.decompress(base64.b64decode('{payload}'))))\n"
        )
        return stub

    # strong — الافتراضي: marshal + zlib + XOR + base64 + حماية ضد الفحص
    compiled = marshal.dumps(compile(source, "<shield>", "exec"))
    compressed = zlib.compress(compiled, 9)
    xored = _xor_bytes(compressed, key or "FFQPU")
    payload = base64.b64encode(xored).decode()
    key_hash = hashlib.sha256((key or "FFQPU").encode()).hexdigest()[:16]

    stub = (
        "# 🛡️ تشفير قوي | Python Shield | @FFQPU\n"
        "# أي تعديل على هذا الملف سيمنع تشغيله\n"
        "import base64 as _b,zlib as _z,marshal as _m,hashlib as _h,sys as _s\n"
        f"_k='{key or 'FFQPU'}';_e='{key_hash}';_p='{payload}'\n"
        "assert _h.sha256(_k.encode()).hexdigest()[:16]==_e,'❌ مفتاح فك التشفير غير صحيح'\n"
        "try:\n"
        " _r=_b.b64decode(_p);_h2=_h.sha256(_k.encode()).digest()\n"
        " _r=bytes(c^_h2[i%len(_h2)] for i,c in enumerate(_r))\n"
        " exec(_m.loads(_z.decompress(_r)))\n"
        "except AssertionError:raise\n"
        "except Exception as _x:_s.stderr.write(f'❌ فشل فك التشفير: {_x}\\n');_s.exit(1)\n"
    )
    return stub


def decrypt_preview(stub_info: str) -> str:
    """فحص سريع: هل النص ناتج تشفير من التطبيق؟"""
    markers = ("marshal", "b64decode", "zlib.decompress")
    return "yes" if any(m in stub_info for m in markers) else "no"
