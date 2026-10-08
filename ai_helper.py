"""مساعد AI لتشخيص أخطاء بايثون — يعمل محلياً بدون إنترنت (سريع وقوي)."""
import ast
import re
import traceback


RULES = [
    (r"NameError: name '(\w+)' is not defined",
     "الخطأ: استخدام متغير أو دالة غير معرّفة ({g1}).",
     "الحل: تأكد من تعريف «{g1}» قبل استخدامها، أو استيراد المكتبة الخاصة بها. مثال: `import {g1}` أو `{g1} = ...`."),
    (r"ModuleNotFoundError: No module named '([\w_]+)'",
     "الخطأ: مكتبة «{g1}» غير مثبتة.",
     "الحل: ثبّتها عبر: `pip install {g1}` ثم أعد التشغيل."),
    (r"IndentationError|unexpected indent|expected an indented block",
     "الخطأ: مشكلة في المسافات البادئة (Indentation).",
     "الحل: وحّد المسافات (4 مسافات لكل مستوى)، واحذف المسافات الزائدة، وتأكد أن كل `:` يتبعها سطر مزاح للداخل."),
    (r"SyntaxError",
     "الخطأ: خطأ في بناء الجملة (SyntaxError).",
     "الحل: راجع الأقواس والفواصل والنقطتين `:`. أكثر الأسباب: قوس غير مغلق، أو نسيان `:` بعد if/for/def."),
    (r"TypeError",
     "الخطأ: نوع بيانات غير متوافق (TypeError).",
     "الحل: اطبع الأنواع بـ `print(type(x))` وتأكد من التحويل: `int(x)` أو `str(x)` قبل العملية."),
    (r"IndexError",
     "الخطأ: تجاوز حدود القائمة (IndexError).",
     "الحل: تأكد أن الفهرس أصغر من `len(list)`. استخدم `if i < len(lst):` للحماية."),
    (r"KeyError: (.+)",
     "الخطأ: مفتاح غير موجود في القاموس ({g1}).",
     "الحل: استخدم `dict.get({g1})` بدل `dict[{g1}]`، أو تحقق بـ `if {g1} in dict:`."),
    (r"ZeroDivisionError",
     "الخطأ: قسمة على صفر.",
     "الحل: أضف شرطاً: `if b != 0:` قبل القسمة."),
    (r"AttributeError",
     "الخطأ: خاصية أو دالة غير موجودة في الكائن (AttributeError).",
     "الحل: اطبع `dir(obj)` لرؤية الخصائص المتاحة، وتأكد من اسم الدالة والإصدار."),
    (r"ImportError|Import Error",
     "الخطأ: مشكلة استيراد.",
     "الحل: تأكد من اسم المكتبة، وحدّثها: `pip install -U <lib>`."),
    (r"FileNotFoundError",
     "الخطأ: ملف غير موجود.",
     "الحل: تأكد من المسار، واستخدم مساراً مطلقاً أو `os.path.exists(path)` للتحقق."),
    (r"UnicodeDecodeError|codec",
     "الخطأ: مشكلة ترميز النصوص.",
     "الحل: افتح الملف بـ `open(f, encoding='utf-8')`."),
]


def diagnose(code: str, error_text: str = "") -> dict:
    """يحلل الكود + رسالة الخطأ ويرجع تشخيصاً عربياً."""
    findings = []
    fixed_hint = ""

    # 1) فحص نحوي مباشر
    syntax_ok = True
    try:
        tree = ast.parse(code or "")
        # فحوص إضافية: متغيرات مستخدمة وغير معرّفة (تقريبي)
    except SyntaxError as e:
        syntax_ok = False
        findings.append({
            "title": f"خطأ نحوي في السطر {e.lineno}: {e.msg}",
            "detail": f"النص المشكل: `{e.text.strip() if e.text else ''}`",
            "fix": "راجع السطر المذكور: أغلق الأقواس، أضف `:` بعد الجمل الشرطية، ووحّد المسافات البادئة."
        })

    # 2) مطابقة رسالة الخطأ مع القواعد
    err = error_text or ""
    for pattern, title_t, fix_t in RULES:
        m = re.search(pattern, err, re.IGNORECASE)
        if m:
            g1 = m.group(1) if m.lastindex else ""
            findings.append({
                "title": title_t.format(g1=g1),
                "detail": f"رسالة النظام: `{err.strip()[:300]}`",
                "fix": fix_t.format(g1=g1)
            })
            break

    # 3) فحوص ذكية شائعة حتى بدون رسالة خطأ
    if code:
        if "\t" in code and "    " in code:
            findings.append({
                "title": "خلط بين Tab والمسافات",
                "detail": "الكود يحتوي على Tab ومسافات معاً — وهذا يسبب IndentationError.",
                "fix": "استبدل كل Tab بأربع مسافات من محررك."
            })
        if re.search(r"print\s+[^(]", code):
            findings.append({
                "title": "احتمال كود Python 2",
                "detail": "وجدت `print` بدون أقواس.",
                "fix": "في Python 3 استخدم `print(...)` بأقواس."
            })
        m_imp = re.search(r"import\s+([\w_]+)", code)
        # تنبيه عام للأداء والقوة
        if len(code) > 20000:
            findings.append({
                "title": "ملف كبير — نصيحة أداء",
                "detail": "الملف يتجاوز 20KB.",
                "fix": "قسّم الكود إلى ملفات، وشفّر كل ملف على حدة بمستوى متوسط لتسريع الإقلاع."
            })

    if not findings:
        if syntax_ok:
            findings.append({
                "title": "لا توجد أخطاء واضحة ✅",
                "detail": "التحليل النحوي سليم ولم تصل رسالة خطأ.",
                "fix": "إذا ظهر خطأ عند التشغيل، الصق رسالة الخطأ (Traceback) كاملة هنا وسأشخّصها بدقة. جرّب أيضاً تشغيل: `python -m py_compile file.py`"
            })
        fixed_hint = ""

    # توليد كود مُقترح الإصلاح لأبسط الحالات
    suggestion = ""
    if not syntax_ok:
        suggestion = "# أصلح السطر المشار إليه أعلاه ثم أعد فحص الكود هنا."

    return {
        "ok": syntax_ok and not any("خطأ" in f["title"] and "لا توجد" not in f["title"] for f in findings[:1]),
        "findings": findings,
        "tip": "💡 نصيحة سايبر: شفّر نسخة احتياطية قبل أي تعديل، واحتفظ بالمفتاح في مكان آمن.",
        "suggestion": suggestion,
    }


def build_tool_scaffold(description: str, kind: str = "general") -> str:
    """مولّد الأدوات المدفوعة: يبني هيكل أداة بايثون جاهزة من وصف عربي."""
    desc = (description or "أداة جديدة").strip()[:500]
    code = f'''"""{desc}
تم التوليد بواسطة Python Shield (القسم المدفوع) | @FFQPU
"""
import argparse, sys, time

BANNER = r"""
 ██████╗ ██╗   ██╗████████╗██╗  ██╗ ██████╗ ███╗   ██╗
 ██╔══██╗╚██╗ ██╔╝╚══██╔══╝██║  ██║██╔═══██╗████╗  ██║
 ██████╔╝ ╚████╔╝    ██║   ███████║██║   ██║██╔██╗ ██║
 ██╔═══╝   ╚██╔╝     ██║   ██╔══██║██║   ██║██║╚██╗██║
 ██║        ██║      ██║   ██║  ██║╚██████╔╝██║ ╚████║
 ╚═╝        ╚═╝      ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝
 Shield v1.0 | @FFQPU
"""

def main():
    p = argparse.ArgumentParser(description="{desc}")
    p.add_argument("--run", action="store_true", help="تشغيل الأداة")
    p.add_argument("--fast", action="store_true", help="وضع سريع")
    a = p.parse_args()
    print(BANNER)
    print("🛡️ الوصف:", "{desc}")
    t0 = time.time()
    # TODO: ضع منطق أداتك هنا
    print("✅ الأداة جاهزة — عدّل دالة main() لإضافة مزاياك المدفوعة.")
    print(f"⚡ زمن التجهيز: {{time.time()-t0:.3f}}s")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit("\\n⛔ تم الإيقاف.")
'''
    return code
