/* ============================================================
   FFQPU — Ticket System Logic
   Developer & Owner: FFQPU | Telegram @FFQPU | https://t.me/BFQDS
   ============================================================ */

// ====== ⚙️ الإعدادات — عدّل هنا فقط ======
const FORMSPREE_URL = "https://formspree.io/f/XXXXXXX"; // <-- ضع رابط Formspree الخاص بك هنا
const RATE_LIMIT_SECONDS = 60; // منع التكرار خلال 60 ثانية
const DEFAULT_ADMIN_PASSWORD = "FFQPU2026"; // كلمة مرور لوحة الإدارة (قابلة للتغيير من داخل اللوحة)
// ===========================================

const $ = (id) => document.getElementById(id);
const store = {
  getTickets() { try { return JSON.parse(localStorage.getItem("ludo_tickets") || "[]"); } catch { return []; } },
  saveTickets(t) { localStorage.setItem("ludo_tickets", JSON.stringify(t)); }
};

function generateTicketNumber() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
  return "TKT-2026-" + s;
}

function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
function validPhone(v) { return /^[+\d][\d\s-]{5,18}$/.test(v.trim()); }

/* ---------- Footer year (auto) ---------- */
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".js-year").forEach(el => el.textContent = new Date().getFullYear());

  /* ---------- Index page: form ---------- */
  const form = $("ticketForm");
  if (form) {
    form.addEventListener("submit", handleSubmit);
    const trackBtn = $("trackBtn");
    if (trackBtn) trackBtn.addEventListener("click", trackTicket);
  }

  /* ---------- Success page ---------- */
  if ($("successTicket")) initSuccessPage();

  /* ---------- Admin page ---------- */
  if ($("adminLoginBtn")) initAdmin();
});

async function handleSubmit(e) {
  e.preventDefault();
  const okBox = $("formSuccess"), errBox = $("formError"), btn = $("submitBtn");

  const showError = (msg) => {
    errBox.innerHTML = "⚠️ " + msg;
    errBox.classList.add("show");
    okBox.classList.remove("show");
    errBox.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  // 7) Rate limit
  const last = parseInt(localStorage.getItem("last_submit") || "0", 10);
  const now = Date.now();
  if (now - last < RATE_LIMIT_SECONDS * 1000) {
    const wait = Math.ceil((RATE_LIMIT_SECONDS * 1000 - (now - last)) / 1000);
    showError(`عذراً، لقد أرسلت طلباً مؤخراً. يرجى الانتظار ${wait} ثانية قبل إرسال طلب جديد.`);
    return;
  }

  // 6) Validation
  const v = (id) => ($(id) ? $(id).value.trim() : "");
  const game = v("game"), accountId = v("accountId"), oldPhone = v("oldPhone"),
        newPhone = v("newPhone"), reason = v("reason"), contactEmail = v("contactEmail");

  if (!game) return showError("يرجى اختيار اللعبة.");
  if (!accountId) return showError("يرجى إدخال معرّف الحساب (ID).");
  if (!oldPhone) return showError("يرجى إدخال الرقم القديم المفقود.");
  if (!newPhone) return showError("يرجى إدخال الرقم الجديد المطلوب.");
  if (!validPhone(oldPhone)) return showError("صيغة الرقم القديم غير صحيحة.");
  if (!validPhone(newPhone)) return showError("صيغة الرقم الجديد غير صحيحة.");
  if (oldPhone.replace(/\D/g, "") === newPhone.replace(/\D/g, "")) return showError("الرقم الجديد يجب أن يكون مختلفاً عن الرقم القديم.");
  if (!reason) return showError("يرجى اختيار سبب عدم توفر الرقم القديم.");
  if (!contactEmail) return showError("يرجى إدخال بريد التواصل.");
  if (!validEmail(contactEmail)) return showError("صيغة بريد التواصل غير صحيحة.");
  const accEmail = v("accountEmail"), newEmail = v("newEmail");
  if (accEmail && !validEmail(accEmail)) return showError("صيغة البريد المرتبط بالحساب غير صحيحة.");
  if (newEmail && !validEmail(newEmail)) return showError("صيغة البريد الجديد غير صحيحة.");
  if (!$("consent").checked) return showError("يجب الموافقة على الإقرار: أتعهد أن الحساب لي وأن البيانات صحيحة.");

  // 1) Generate ticket
  const ticketNo = generateTicketNumber();

  const proofs = [...document.querySelectorAll('input[name="proof"]:checked')].map(c => c.parentElement.textContent.trim());

  const gameText = $("game").options[$("game").selectedIndex].text;
  const reasonText = $("reason").options[$("reason").selectedIndex].text;
  const data = {
    ticket: ticketNo,
    game: gameText,
    accountId, accountName: v("accountName"), accountEmail: accEmail,
    oldPhone, newPhone, newEmail, reason: reasonText,
    contactEmail, contactPhone: v("contactPhone"), details: v("details"),
    proofs: proofs.join("، ") || "—",
    date: new Date().toLocaleString("ar-EG"),
    isoDate: new Date().toISOString(),
    status: "new"
  };

  // Button loading state
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = "جاري الإرسال... ⏳";
  errBox.classList.remove("show");

  try {
    // 2) Send to Formspree (editable link) — skip network if placeholder not replaced
    if (!FORMSPREE_URL.includes("XXXXXXX")) {
      const res = await fetch(FORMSPREE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ ...data, _subject: "تذكرة جديدة " + ticketNo })
      });
      if (!res.ok) throw new Error("formspree");
    }

    // 5) Local copy
    const all = store.getTickets();
    all.unshift(data);
    store.saveTickets(all);
    localStorage.setItem("last_submit", Date.now().toString());
    localStorage.setItem("last_ticket", ticketNo);

    // 3) Success box
    okBox.innerHTML = `✅ <strong>تم استلام طلبك بنجاح!</strong><br>رقم التذكرة الخاص بك:<br><span class="ticket-num">${ticketNo}</span><br>احتفظ بهذا الرقم لمتابعة طلبك. جاري تحويلك لصفحة التأكيد...`;
    okBox.classList.add("show");
    // 8) Smooth scroll
    okBox.scrollIntoView({ behavior: "smooth", block: "center" });
    form.reset();
    document.querySelectorAll("#reason,#accountName,#accountEmail,#oldPhone,#newPhone,#newEmail,#contactEmail,#contactPhone,#details").forEach(el => el.value = "");
    document.querySelectorAll('input[name="proof"]').forEach(c => c.checked = false);
    const consentBox = $("consent"); if (consentBox) consentBox.checked = false;
    setTimeout(() => { window.location.href = "success.html?ticket=" + encodeURIComponent(ticketNo); }, 2500);
  } catch (err) {
    // 4) Arabic error box
    showError("حدث خطأ أثناء إرسال الطلب. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى، أو التواصل معنا عبر تيليجرام @FFQPU.");
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

/* ---------- Track ticket (from localStorage) ---------- */
function trackTicket() {
  const input = $("trackInput").value.trim().toUpperCase();
  const out = $("trackResult");
  if (!input) { out.innerHTML = "يرجى إدخال رقم التذكرة."; return; }
  const found = store.getTickets().find(t => t.ticket.toUpperCase() === input);
  if (!found) {
    out.innerHTML = `❌ لم يتم العثور على التذكرة <b class="ticket-num" style="font-size:14px">${input}</b> على هذا الجهاز. (التذاكر محفوظة محلياً على الجهاز الذي أُرسلت منه)`;
    return;
  }
  const statusAr = { new: "🆕 جديدة", "in-progress": "⏳ قيد المعالجة", completed: "✅ مكتملة" }[found.status] || found.status;
  out.innerHTML = `<table><tr><th>التذكرة</th><th>اللعبة</th><th>الحالة</th><th>التاريخ</th></tr>
    <tr><td><span class="ltr">${found.ticket}</span></td><td>${found.game}</td><td>${statusAr}</td><td>${found.date}</td></tr></table>`;
}

/* ---------- Success page ---------- */
function initSuccessPage() {
  const params = new URLSearchParams(location.search);
  const t = params.get("ticket") || localStorage.getItem("last_ticket") || "TKT-2026-XXXXXX";
  $("successTicket").textContent = t;
}

/* ---------- Admin panel ---------- */
function getAdminPass() { return localStorage.getItem("admin_pass") || DEFAULT_ADMIN_PASSWORD; }

function initAdmin() {
  $("adminLoginBtn").addEventListener("click", () => {
    if ($("adminPass").value === getAdminPass()) {
      $("loginBox").style.display = "none";
      $("dashboard").style.display = "block";
      renderAdmin();
    } else {
      $("loginError").style.display = "block";
    }
  });
  $("filterStatus").addEventListener("change", renderAdmin);
  $("exportBtn").addEventListener("click", exportCSV);
  $("changePassBtn").addEventListener("click", () => {
    const np = prompt("أدخل كلمة المرور الجديدة:");
    if (np && np.trim().length >= 4) {
      localStorage.setItem("admin_pass", np.trim());
      alert("تم تغيير كلمة المرور بنجاح ✅");
    } else if (np !== null) alert("كلمة المرور قصيرة جداً.");
  });
  $("logoutBtn").addEventListener("click", () => {
    $("dashboard").style.display = "none";
    $("loginBox").style.display = "block";
    $("adminPass").value = "";
  });
}

function renderAdmin() {
  const tickets = store.getTickets();
  const f = $("filterStatus").value;
  const list = f === "all" ? tickets : tickets.filter(t => t.status === f);

  const total = tickets.length;
  const news = tickets.filter(t => t.status === "new").length;
  const comp = tickets.filter(t => t.status === "completed").length;
  $("statTotal").textContent = total;
  $("statNew").textContent = news;
  $("statDone").textContent = comp;

  const tbody = $("ticketsBody");
  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#888;padding:24px">لا توجد تذاكر ${f === "all" ? "بعد" : "بهذه الحالة"}.</td></tr>`;
    return;
  }
  tbody.innerHTML = list.map((t) => {
    const idx = tickets.indexOf(t);
    return `<tr>
      <td><span class="ltr" style="color:var(--gold);font-weight:700">${t.ticket}</span></td>
      <td>${t.game || "—"}</td>
      <td><span class="ltr">${t.accountId || "—"}</span></td>
      <td><span class="ltr">${t.oldPhone || "—"}</span></td>
      <td><span class="ltr">${t.newPhone || "—"}</span></td>
      <td><select class="status-select" onchange="setStatus(${idx},this.value)">
        <option value="new" ${t.status === "new" ? "selected" : ""}>🆕 جديدة</option>
        <option value="in-progress" ${t.status === "in-progress" ? "selected" : ""}>⏳ قيد المعالجة</option>
        <option value="completed" ${t.status === "completed" ? "selected" : ""}>✅ مكتملة</option>
      </select></td>
      <td style="white-space:nowrap">${t.date || "—"}<br><button class="del-btn" onclick="delTicket(${idx})">حذف</button></td>
    </tr>`;
  }).join("");
}

function setStatus(idx, status) {
  const tickets = store.getTickets();
  if (tickets[idx]) { tickets[idx].status = status; store.saveTickets(tickets); renderAdmin(); }
}

function delTicket(idx) {
  if (!confirm("حذف هذه التذكرة نهائياً؟")) return;
  const tickets = store.getTickets();
  tickets.splice(idx, 1);
  store.saveTickets(tickets);
  renderAdmin();
}

function exportCSV() {
  const tickets = store.getTickets();
  if (!tickets.length) { alert("لا توجد بيانات للتصدير."); return; }
  const rows = [["Ticket", "Game", "AccountID", "OldPhone", "NewPhone", "Status", "Date", "ContactEmail"]];
  tickets.forEach(t => rows.push([t.ticket, t.game, t.accountId, t.oldPhone, t.newPhone, t.status, t.date, t.contactEmail]));
  const csv = "\uFEFF" + rows.map(r => r.map(c => `"${String(c || "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "tickets-2026.csv";
  a.click();
}
