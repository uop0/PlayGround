/* ═══════ BlackScript | @FFQPU — script.js ═══════ */
(function () {
  "use strict";

  /* ── Loading screen ── */
  window.addEventListener("load", () => {
    setTimeout(() => document.getElementById("loader")?.classList.add("hide"), 700);
  });
  // fallback if load already fired / slow assets
  setTimeout(() => document.getElementById("loader")?.classList.add("hide"), 3500);

  /* ── Theme (dark default, light optional) ── */
  const root = document.documentElement;
  const saved = localStorage.getItem("bs-theme");
  if (saved) root.setAttribute("data-theme", saved);
  const icon = document.getElementById("theme-icon");
  const paintIcon = () => {
    if (!icon) return;
    icon.className = root.getAttribute("data-theme") === "light"
      ? "fa-solid fa-moon" : "fa-solid fa-sun";
  };
  paintIcon();
  document.getElementById("theme-btn")?.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    root.setAttribute("data-theme", next);
    localStorage.setItem("bs-theme", next);
    paintIcon();
    toast(next === "light" ? "☀️ الوضع النهاري" : "🌙 الوضع الليلي", "ok");
  });

  /* ── Custom neon cursor ── */
  const dot = document.getElementById("cursor-dot");
  const ring = document.getElementById("cursor-ring");
  let rx = -100, ry = -100, tx = -100, ty = -100;
  window.addEventListener("mousemove", (e) => {
    tx = e.clientX; ty = e.clientY;
    if (dot) { dot.style.left = tx + "px"; dot.style.top = ty + "px"; }
  });
  (function loop() {
    rx += (tx - rx) * 0.18; ry += (ty - ry) * 0.18;
    if (ring) { ring.style.left = rx + "px"; ring.style.top = ry + "px"; }
    requestAnimationFrame(loop);
  })();

  /* ── Hero parallax light ── */
  const hero = document.getElementById("hero");
  if (hero) {
    hero.addEventListener("mousemove", (e) => {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      hero.querySelectorAll(".hero-glow").forEach((g, i) => {
        const f = (i + 1) * 26;
        g.style.transform = `translate(${x * f}px, ${y * f}px)`;
      });
    });
  }

  /* ── Live search on home grid ── */
  const search = document.getElementById("tool-search");
  if (search) {
    search.addEventListener("input", () => {
      const q = search.value.trim().toLowerCase();
      let visible = 0;
      document.querySelectorAll("#tools-grid .tool-card").forEach((c) => {
        const hay = (c.dataset.search || "").toLowerCase();
        const show = !q || hay.includes(q);
        c.style.display = show ? "" : "none";
        if (show) visible++;
      });
      document.getElementById("tool-count").textContent = visible;
      document.getElementById("no-result")?.classList.toggle("hidden", visible !== 0);
    });
  }
})();

/* ── Toast ── */
let toastTimer;
function toast(msg, type = "ok") {
  const el = document.getElementById("toast");
  if (!el) { alert(msg); return; }
  el.textContent = msg;
  el.className = "toast show " + type;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
}

/* ── API helper ── */
async function api(url, payload) {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {}),
    });
    return await res.json();
  } catch (e) {
    return { ok: false, error: "تعذّر الاتصال بالسيرفر" };
  }
}

/* ── Copy helpers (toast + auto copy) ── */
async function copyRaw(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    const ta = document.createElement("textarea");
    ta.value = text; document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch (_) {}
    ta.remove();
    return ok;
  }
}
async function autoCopy(text) {
  if (!text) return;
  const ok = await copyRaw(text);
  toast(ok ? "تم النسخ تلقائياً ✓" : "النتيجة جاهزة — انسخها يدوياً", ok ? "ok" : "warn");
}
async function copyText(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const v = ("value" in el) ? el.value : el.textContent;
  if (!v || !v.trim() || v.trim() === "…" ) return toast("لا يوجد شيء لنسخه ⚠️", "warn");
  (await copyRaw(v)) ? toast("تم النسخ ✓", "ok") : toast("فشل النسخ", "error");
}
async function copyEl(id) {
  const el = document.getElementById(id);
  if (!el) return;
  (await copyRaw(el.textContent.trim())) ? toast("تم النسخ ✓", "ok") : toast("فشل النسخ", "error");
}
function clearAll(ids) {
  (ids || []).forEach((id) => {
    const el = document.getElementById(id);
    if (el) { if ("value" in el) el.value = ""; else el.textContent = "…"; }
  });
  toast("تم المسح 🧹", "ok");
}
function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
