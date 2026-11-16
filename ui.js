const fmtCurrency = (val) =>
  '₹' + Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (val) => (val ? new Date(val).toISOString().slice(0, 10) : '—');

const badge = (text) => {
  const t = String(text || '').toLowerCase();
  let cls = 'pill-neutral';
  if (['paid', 'approved', 'resolved', 'good', 'new', 'present', 'active'].includes(t)) cls = 'pill-mint';
  else if (['pending', 'in progress', 'late', 'half-day', 'on leave', 'under maintenance'].includes(t)) cls = 'pill-amber';
  else if (['rejected', 'absent', 'failed', 'needs repair', 'open'].includes(t)) cls = 'pill-rose';
  return `<span class="pill ${cls}"><span class="pill-dot"></span>${text}</span>`;
};

const baseStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap');

  :root {
    --bg-main: #f4faf6;
    --surface: #ffffff;
    --surface-soft: #f9fdfb;
    --border: #d9ede1;
    --border-hover: #9ae6b4;
    --mint-50: #ecfdf5;
    --mint-100: #d1fae5;
    --mint-200: #a7f3d0;
    --mint-500: #10b981;
    --mint-600: #059669;
    --mint-700: #047857;
    --teal-50: #f0fdfa;
    --sky-50: #f0f9ff;
    --ink: #0f172a;
    --ink-2: #334155;
    --muted: #64748b;
    --shadow-xs: 0 1px 2px rgba(15, 23, 42, 0.03);
    --shadow-sm: 0 4px 16px -2px rgba(16, 185, 129, 0.08), 0 2px 6px -1px rgba(15, 23, 42, 0.03);
    --shadow-md: 0 14px 32px -4px rgba(16, 185, 129, 0.14), 0 4px 12px -2px rgba(15, 23, 42, 0.04);
    --shadow-lg: 0 24px 48px -12px rgba(15, 23, 42, 0.12);
  }

  * { box-sizing: border-box; }

  body {
    margin: 0;
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    background-color: var(--bg-main);
    background-image:
      radial-gradient(at 0% 0%, rgba(167, 243, 208, 0.35) 0px, transparent 42%),
      radial-gradient(at 100% 0%, rgba(186, 230, 253, 0.30) 0px, transparent 40%),
      radial-gradient(at 50% 100%, rgba(209, 250, 229, 0.35) 0px, transparent 50%);
    color: var(--ink);
    min-height: 100vh;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }

  /* Light Frosted Navigation Bar */
  .topbar {
    position: sticky; top: 0; z-index: 60;
    background: rgba(255, 255, 255, 0.86);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-bottom: 1px solid var(--border);
    padding: 12px 32px;
    display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px;
  }
  .brand { display: flex; align-items: center; gap: 12px; }
  .brand-logo {
    width: 38px; height: 38px; border-radius: 12px;
    background: linear-gradient(135deg, #6ee7b7 0%, #10b981 100%);
    display: grid; place-items: center; color: #fff;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.32);
  }
  .brand-title { font-weight: 800; font-size: 1.05rem; letter-spacing: -0.02em; color: var(--ink); line-height: 1.15; }
  .brand-sub { font-size: 0.72rem; font-weight: 600; color: var(--mint-700); letter-spacing: 0.02em; }

  .nav-right { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
  .db-status {
    display: inline-flex; align-items: center; gap: 7px;
    background: var(--mint-50); border: 1px solid var(--mint-200);
    padding: 5px 12px; border-radius: 999px; font-size: 0.76rem; font-weight: 600; color: var(--mint-700);
    font-family: 'JetBrains Mono', monospace;
  }
  .pulse-dot {
    width: 7px; height: 7px; border-radius: 50%; background: #10b981;
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
    animation: pulseRing 2s infinite;
  }
  @keyframes pulseRing {
    0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.6); }
    70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
    100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
  }
  .user-chip {
    background: #ffffff; border: 1px solid var(--border);
    padding: 6px 14px; border-radius: 999px; font-size: 0.82rem; font-weight: 600; color: var(--ink-2);
    box-shadow: var(--shadow-xs);
  }
  .btn-logout {
    background: #fff1f2; color: #be123c; border: 1px solid #fecdd3;
    padding: 6px 14px; border-radius: 999px; text-decoration: none; font-size: 0.82rem; font-weight: 700;
    transition: all 0.2s ease;
  }
  .btn-logout:hover { background: #ffe4e6; transform: translateY(-1px); }

  .container { max-width: 1360px; margin: 0 auto; padding: 28px 24px 72px; }

  /* Hero Banner Card */
  .hero-banner {
    background: linear-gradient(120deg, #ffffff 0%, #f0fdf4 65%, #e6fffa 100%);
    border: 1px solid var(--border);
    border-radius: 22px;
    padding: 24px 28px;
    margin-bottom: 24px;
    display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 20px;
    box-shadow: var(--shadow-sm);
    animation: fadeUp 0.4s ease-out;
  }
  .hero-eyebrow {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 0.74rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;
    color: var(--mint-700); background: var(--mint-100); padding: 4px 10px; border-radius: 999px; margin-bottom: 8px;
  }
  .hero-banner h1 { margin: 0; font-size: clamp(1.4rem, 2.5vw, 1.85rem); font-weight: 800; letter-spacing: -0.025em; color: var(--ink); }
  .hero-banner p { margin: 4px 0 0; color: var(--muted); font-size: 0.92rem; max-width: 620px; }
  .action-bar { display: flex; flex-wrap: wrap; gap: 10px; }

  /* Alert Banner */
  .alert {
    padding: 14px 18px; border-radius: 14px; margin-bottom: 22px; font-weight: 600; font-size: 0.9rem;
    background: var(--mint-50); color: var(--mint-700); border: 1px solid var(--mint-200);
    box-shadow: var(--shadow-sm); animation: fadeUp 0.3s ease-out;
  }
  .alert.err { background: #fff1f2; color: #be123c; border-color: #fecdd3; }

  /* Bento KPI Cards (Redesigned with Icons, Badges & Hover Lift) */
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 18px;
    margin-bottom: 28px;
  }
  .kpi-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 22px;
    box-shadow: var(--shadow-sm);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
    overflow: hidden;
    transition: transform 0.25s cubic-bezier(.22,1,.36,1), box-shadow 0.25s ease, border-color 0.25s ease;
    animation: fadeUp 0.45s ease-out both;
  }
  .kpi-card:nth-child(1) { background: linear-gradient(160deg, #ffffff 40%, #f0fdf4 100%); animation-delay: 0.04s; }
  .kpi-card:nth-child(2) { background: linear-gradient(160deg, #ffffff 40%, #f0fdfa 100%); animation-delay: 0.10s; }
  .kpi-card:nth-child(3) { background: linear-gradient(160deg, #ffffff 40%, #f0f9ff 100%); animation-delay: 0.16s; }
  .kpi-card:nth-child(4) { background: linear-gradient(160deg, #ffffff 40%, #fefce8 100%); animation-delay: 0.22s; }
  .kpi-card:hover {
    transform: translateY(-5px);
    box-shadow: var(--shadow-md);
    border-color: var(--border-hover);
  }
  .kpi-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 14px; }
  .kpi-icon {
    width: 42px; height: 42px; border-radius: 12px;
    display: grid; place-items: center;
    background: var(--mint-100); color: var(--mint-700);
    flex-shrink: 0;
  }
  .kpi-card:nth-child(2) .kpi-icon { background: #ccfbf1; color: #0f766e; }
  .kpi-card:nth-child(3) .kpi-icon { background: #e0f2fe; color: #0369a1; }
  .kpi-card:nth-child(4) .kpi-icon { background: #fef3c7; color: #b45309; }
  .kpi-tag {
    font-size: 0.72rem; font-weight: 700; padding: 3px 9px; border-radius: 999px;
    background: #ffffff; border: 1px solid var(--border); color: var(--mint-700);
  }
  .kpi-label { font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); }
  .kpi-value { font-size: 1.8rem; font-weight: 800; color: var(--ink); letter-spacing: -0.03em; margin: 4px 0; }
  .kpi-sub { font-size: 0.82rem; color: var(--muted); display: flex; align-items: center; gap: 6px; }

  /* Segmented Navigation Tabs */
  .tabs-bar {
    display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px;
    margin-bottom: 22px;
  }
  .tabs {
    display: inline-flex; flex-wrap: wrap; gap: 6px;
    background: #ffffff; padding: 6px; border-radius: 14px; border: 1px solid var(--border);
    box-shadow: var(--shadow-xs);
  }
  .tab-btn {
    background: transparent; color: var(--muted); border: none;
    padding: 9px 18px; border-radius: 10px; font-size: 0.85rem; font-weight: 700; cursor: pointer;
    transition: all 0.2s ease;
  }
  .tab-btn:hover { background: var(--mint-50); color: var(--mint-700); }
  .tab-btn.active {
    background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
    color: #ffffff; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.28);
  }

  /* Section Containers */
  .card {
    background: rgba(255, 255, 255, 0.92);
    border: 1px solid var(--border);
    border-radius: 22px;
    padding: 24px;
    margin-bottom: 24px;
    box-shadow: var(--shadow-sm);
    animation: fadeUp 0.5s ease-out both;
  }
  .card-header {
    display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 14px; margin-bottom: 16px;
  }
  .card-header h2 { margin: 0; font-size: 1.12rem; font-weight: 800; color: var(--ink); letter-spacing: -0.015em; }
  .card-header code {
    font-family: 'JetBrains Mono', monospace; font-size: 0.78rem;
    background: var(--mint-50); color: var(--mint-700); padding: 3px 8px; border-radius: 6px; border: 1px solid var(--mint-200);
  }
  .form-inline { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }

  input, select, textarea {
    padding: 10px 14px; border: 1px solid var(--border); border-radius: 11px;
    font-size: 0.875rem; background: var(--surface-soft); color: var(--ink); font-family: inherit;
    transition: all 0.2s ease;
  }
  input:focus, select:focus, textarea:focus {
    outline: none; border-color: var(--mint-500); background: #ffffff;
    box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.14);
  }

  /* Buttons */
  .btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 7px;
    background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
    color: #ffffff; border: none; padding: 10px 18px;
    border-radius: 12px; font-size: 0.86rem; font-weight: 700; cursor: pointer; text-decoration: none;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.24);
    transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease;
  }
  .btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(16, 185, 129, 0.34); filter: brightness(1.03); }
  .btn-outline {
    background: #ffffff; color: var(--mint-700); border: 1px solid var(--border-hover);
    box-shadow: var(--shadow-xs);
  }
  .btn-outline:hover { background: var(--mint-50); box-shadow: var(--shadow-sm); }
  .btn-sm { padding: 6px 13px; font-size: 0.79rem; border-radius: 9px; }

  /* Elevated Card-Row Data Tables */
  .table-wrap { width: 100%; overflow-x: auto; padding: 2px; }
  table {
    width: 100%; border-collapse: separate; border-spacing: 0 10px;
    font-size: 0.875rem; white-space: nowrap;
  }
  thead th {
    background: transparent; font-weight: 700; color: var(--muted);
    font-size: 0.73rem; text-transform: uppercase; letter-spacing: 0.06em;
    padding: 4px 16px 6px; border: none; text-align: left;
  }
  tbody tr {
    background: #ffffff;
    box-shadow: 0 2px 6px rgba(15, 23, 42, 0.035);
    transition: transform 0.2s cubic-bezier(.22,1,.36,1), box-shadow 0.2s ease, background 0.2s ease;
  }
  tbody tr:hover {
    transform: translateY(-2px);
    background: #f8fefb;
    box-shadow: 0 10px 22px rgba(16, 185, 129, 0.12);
  }
  tbody td {
    padding: 14px 16px;
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
  }
  tbody td:first-child {
    border-left: 1px solid var(--border);
    border-top-left-radius: 14px;
    border-bottom-left-radius: 14px;
  }
  tbody td:last-child {
    border-right: 1px solid var(--border);
    border-top-right-radius: 14px;
    border-bottom-right-radius: 14px;
  }

  /* Employee Avatar Cell */
  .emp-cell { display: inline-flex; align-items: center; gap: 10px; }
  .avatar {
    width: 32px; height: 32px; border-radius: 10px;
    background: linear-gradient(135deg, #d1fae5, #a7f3d0);
    color: #065f46; font-weight: 800; font-size: 0.76rem;
    display: grid; place-items: center; flex-shrink: 0;
  }

  /* Status Pills */
  .pill { display: inline-flex; align-items: center; gap: 6px; padding: 4px 11px; border-radius: 999px; font-size: 0.75rem; font-weight: 700; }
  .pill-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
  .pill-mint { background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; }
  .pill-amber { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
  .pill-rose { background: #ffe4e6; color: #9f1239; border: 1px solid #fecdd3; }
  .pill-neutral { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }

  .section-panel.hidden { display: none; }

  /* Frosted Light Modal */
  .modal-backdrop {
    display: none; position: fixed; inset: 0;
    background: rgba(240, 253, 244, 0.72);
    backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
    z-index: 100; place-items: center; padding: 16px;
  }
  .modal-backdrop.open { display: grid; }
  .modal-box {
    background: #ffffff; border: 1px solid var(--border-hover); border-radius: 22px;
    width: 100%; max-width: 490px; padding: 28px; box-shadow: var(--shadow-lg);
    animation: popScale 0.22s cubic-bezier(.22,1,.36,1);
  }
  .modal-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; }
  .modal-head h3 { margin: 0; color: var(--ink); font-size: 1.18rem; font-weight: 800; }
  .close-x {
    background: var(--mint-50); color: var(--mint-700); border: 1px solid var(--border);
    width: 34px; height: 34px; border-radius: 50%; font-size: 1.15rem; cursor: pointer;
  }
  .close-x:hover { background: var(--mint-100); }
  .form-grid { display: grid; gap: 14px; }
  .form-grid label { display: grid; gap: 5px; font-size: 0.82rem; font-weight: 700; color: var(--ink-2); }
  .form-grid input, .form-grid select, .form-grid textarea { width: 100%; }

  /* Payslip Receipt Preview */
  .slip-box {
    background: var(--surface-soft); border: 1px dashed var(--border-hover); border-radius: 14px;
    padding: 16px; display: grid; gap: 10px; font-size: 0.88rem;
  }
  .slip-row { display: flex; justify-content: space-between; padding-bottom: 6px; border-bottom: 1px solid var(--border); }
  .slip-row:last-child { border-bottom: none; font-weight: 800; font-size: 1.05rem; color: var(--mint-700); padding-top: 4px; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes popScale {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }

  @media (max-width: 640px) {
    .topbar { padding: 12px 16px; }
    .container { padding: 18px 12px 48px; }
    .hero-banner, .card { padding: 18px; border-radius: 18px; }
    .action-bar, .action-bar .btn { width: 100%; }
  }
`;

const pageShell = (title, user, rawBody, msg = '', isError = false) => {
  // Enhance rawBody dynamically: upgrade page-header to hero-banner, inject SVG icons into KPI cards, and add initials avatars
  const icons = [
    `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>`,
    `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`
  ];
  const tags = ['Live DB', 'Automated', 'Triggered', 'Real-time'];
  let idx = 0;

  let enhancedBody = rawBody
    .replace('class="page-header"', 'class="hero-banner"')
    .replace(/<div class="kpi-card"><div class="kpi-label">(.*?)<\/div><div class="kpi-value">(.*?)<\/div><div class="kpi-sub">(.*?)<\/div><\/div>/g, (_, lbl, val, sub) => {
      const i = idx++;
      return `<div class="kpi-card">
        <div class="kpi-top">
          <div class="kpi-icon">${icons[i % icons.length]}</div>
          <span class="kpi-tag">${tags[i % tags.length]}</span>
        </div>
        <div>
          <div class="kpi-label">${lbl}</div>
          <div class="kpi-value">${val}</div>
          <div class="kpi-sub">${sub}</div>
        </div>
      </div>`;
    })
    .replace(/<td><strong>((?:Dr\.|Prof\.|[A-Z])[a-zA-Z.\s]+)<\/strong><\/td>/g, (_, name) => {
      const clean = name.replace(/^(Dr\.|Prof\.)\s*/i, '').trim();
      const initials = clean.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
      return `<td><span class="emp-cell"><span class="avatar">${initials}</span><strong>${name}</strong></span></td>`;
    });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} | Smart Campus Lab & Payroll</title>
  <style>${baseStyles}</style>
</head>
<body>
  <header class="topbar">
    <div class="brand">
      <div class="brand-logo">
        <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
      </div>
      <div>
        <div class="brand-title">Smart Campus Suite</div>
        <div class="brand-sub">Lab Operations &amp; Payroll Engine</div>
      </div>
    </div>
    <div class="nav-right">
      <span class="db-status"><span class="pulse-dot"></span>MySQL 8.0 · ${user.role === 'admin' ? 'hr_admin_role' : 'employee_role'}</span>
      <span class="user-chip">${user.name}</span>
      <a href="/logout" class="btn-logout">Sign Out</a>
    </div>
  </header>

  <main class="container">
    ${msg ? `<div class="alert ${isError ? 'err' : ''}">${msg}</div>` : ''}
    ${enhancedBody}
  </main>

  <!-- Interactive Payslip Detail Modal (Triggered by clicking any Payroll row) -->
  <div id="modalSlipPreview" class="modal-backdrop" onclick="if(event.target===this) closeModal('modalSlipPreview')">
    <div class="modal-box">
      <div class="modal-head">
        <h3>Official Monthly Payslip</h3>
        <button class="close-x" onclick="closeModal('modalSlipPreview')">&times;</button>
      </div>
      <div id="slipDetails" class="slip-box"></div>
      <div style="margin-top:16px;display:flex;gap:10px;justify-content:flex-end;">
        <button class="btn btn-outline btn-sm" onclick="window.print()">Print Payslip</button>
        <button class="btn btn-sm" onclick="closeModal('modalSlipPreview')">Done</button>
      </div>
    </div>
  </div>

  <script>
    function showTab(tabId, btn) {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      if (btn) btn.classList.add('active');
      document.querySelectorAll('.section-panel').forEach(p => {
        p.classList.toggle('hidden', tabId !== 'all' && p.dataset.tab !== tabId);
      });
    }
    function filterTable(inputId, tableId) {
      const q = document.getElementById(inputId).value.toLowerCase();
      document.querySelectorAll('#' + tableId + ' tbody tr').forEach(r => {
        r.style.display = r.innerText.toLowerCase().includes(q) ? '' : 'none';
      });
    }
    function openModal(id) { document.getElementById(id).classList.add('open'); }
    function closeModal(id) { document.getElementById(id).classList.remove('open'); }

    // Make payroll rows clickable to inspect full payslip card
    document.addEventListener('DOMContentLoaded', () => {
      const payrollTable = document.getElementById('tblPayroll');
      if (payrollTable) {
        payrollTable.querySelectorAll('tbody tr').forEach(row => {
          row.style.cursor = 'pointer';
          row.title = 'Click to view formatted payslip receipt';
          row.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') return;
            const cells = row.querySelectorAll('td');
            if (cells.length >= 10) {
              document.getElementById('slipDetails').innerHTML =
                '<div class="slip-row"><span>Slip Reference</span><strong>' + cells[0].innerText + '</strong></div>' +
                '<div class="slip-row"><span>Employee</span><strong>' + cells[1].innerText + '</strong></div>' +
                '<div class="slip-row"><span>Department</span><span>' + cells[2].innerText + '</span></div>' +
                '<div class="slip-row"><span>Paid / LOP Days</span><span>' + cells[3].innerText + ' Paid · ' + cells[4].innerText + ' LOP</span></div>' +
                '<div class="slip-row"><span>Gross Earnings</span><span>' + cells[5].innerText + '</span></div>' +
                '<div class="slip-row"><span>Income Tax (Slab)</span><span>-' + cells[6].innerText + '</span></div>' +
                '<div class="slip-row"><span>Other Deductions</span><span>-' + cells[7].innerText + '</span></div>' +
                '<div class="slip-row"><span>Net Disbursal</span><span>' + cells[8].innerText + '</span></div>';
              openModal('modalSlipPreview');
            }
          });
        });
      }
    });
  </script>
</body>
</html>`;
};

const authShell = (msg = '', isError = false) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Sign In | Smart Campus Lab & Payroll</title>
  <style>
    ${baseStyles}
    .split-auth {
      min-height: 100vh;
      display: grid;
      grid-template-columns: 1.1fr 0.9fr;
      align-items: center;
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
      gap: 40px;
    }
    .showcase {
      padding: 24px;
      animation: fadeUp 0.45s ease-out;
    }
    .showcase h1 {
      font-size: clamp(1.9rem, 3.4vw, 2.65rem);
      font-weight: 800;
      letter-spacing: -0.03em;
      line-height: 1.15;
      margin: 14px 0;
      color: var(--ink);
    }
    .showcase h1 span { color: var(--mint-600); }
    .showcase p { font-size: 1rem; color: var(--muted); max-width: 500px; margin-bottom: 26px; }
    .feature-pills { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; max-width: 520px; }
    .feat-item {
      background: rgba(255,255,255,0.85); border: 1px solid var(--border);
      padding: 14px 16px; border-radius: 16px; box-shadow: var(--shadow-xs);
    }
    .feat-item strong { display: block; font-size: 0.88rem; color: var(--ink); margin-bottom: 2px; }
    .feat-item span { font-size: 0.78rem; color: var(--muted); }

    .auth-card {
      width: 100%; max-width: 450px; justify-self: center;
      background: rgba(255,255,255,0.96);
      border: 1px solid var(--border-hover); border-radius: 24px; padding: 32px;
      box-shadow: var(--shadow-lg); animation: popScale 0.35s ease-out;
    }
    .auth-switch {
      display: grid; grid-template-columns: 1fr 1fr; background: var(--mint-50);
      padding: 5px; border-radius: 12px; margin-bottom: 22px; border: 1px solid var(--border);
    }
    .auth-switch button {
      border: none; background: transparent; padding: 9px; border-radius: 9px;
      font-weight: 700; font-size: 0.85rem; color: var(--mint-700); cursor: pointer; transition: 0.2s;
    }
    .auth-switch button.active {
      background: #ffffff; color: var(--ink); box-shadow: var(--shadow-xs);
    }
    .demo-box { margin-top: 20px; padding-top: 18px; border-top: 1px dashed var(--border-hover); }
    .demo-box p { margin: 0 0 10px; font-size: 0.78rem; font-weight: 700; color: var(--mint-700); text-transform: uppercase; letter-spacing: 0.04em; }
    .demo-btns { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

    @media (max-width: 900px) {
      .split-auth { grid-template-columns: 1fr; gap: 20px; }
      .showcase { text-align: center; padding: 8px; }
      .showcase p { margin-inline: auto; }
      .feature-pills { margin-inline: auto; text-align: left; }
    }
  </style>
</head>
<body>
  <div class="split-auth">
    <div class="showcase">
      <div class="hero-eyebrow">Enterprise Relational Architecture · 3NF</div>
      <h1>Smart Campus <span>Lab &amp; Payroll</span> Automation</h1>
      <p>A unified academic resource scheduling and automated HR payroll platform powered by MySQL 8.0 triggers, stored procedures, and role-based access control.</p>
      <div class="feature-pills">
        <div class="feat-item"><strong>Overlap-Proof Labs</strong><span>BEFORE INSERT triggers prevent double bookings</span></div>
        <div class="feat-item"><strong>Automated Payroll</strong><span>Prorated LOP &amp; progressive tax slab engine</span></div>
        <div class="feat-item"><strong>Atomic Leaves</strong><span>ACID transactions with automatic rollback</span></div>
        <div class="feat-item"><strong>MySQL RBAC Security</strong><span>Row-isolated self-service database views</span></div>
      </div>
    </div>

    <div class="auth-card">
      ${msg ? `<div class="alert ${isError ? 'err' : ''}">${msg}</div>` : ''}

      <div class="auth-switch">
        <button id="btnShowLogin" class="active" onclick="switchAuth('login')">Role Sign In</button>
        <button id="btnShowSignup" onclick="switchAuth('signup')">Employee Sign Up</button>
      </div>

      <form id="loginForm" class="form-grid" method="POST" action="/login">
        <label>Portal Role
          <select name="role" id="loginRole" required>
            <option value="admin">HR / Admin Command Center</option>
            <option value="employee">Employee / Faculty Self-Service</option>
          </select>
        </label>
        <label>Campus Email
          <input type="email" name="email" id="loginEmail" placeholder="suresh.menon@campus.edu" required />
        </label>
        <label>Password
          <input type="password" name="password" id="loginPass" placeholder="••••••••" required />
        </label>
        <button type="submit" class="btn" style="width:100%;margin-top:6px;">Launch Workspace &rarr;</button>

        <div class="demo-box">
          <p>1-Click Portfolio Demo Access</p>
          <div class="demo-btns">
            <button type="button" class="btn btn-outline btn-sm" onclick="fillDemo('admin','suresh.menon@campus.edu','Admin@2026!')">HR Admin Portal</button>
            <button type="button" class="btn btn-outline btn-sm" onclick="fillDemo('employee','rohan.verma@campus.edu','Emp@2026!')">Employee Portal</button>
          </div>
        </div>
      </form>

      <form id="signupForm" class="form-grid" method="POST" action="/signup" style="display:none;">
        <label>Full Name <input type="text" name="name" placeholder="Dr. Ritika Sharma" required /></label>
        <label>Campus Email <input type="email" name="email" placeholder="ritika.sharma@campus.edu" required /></label>
        <label>Phone Number <input type="text" name="phone" placeholder="9810010099" required /></label>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <label>Role Type
            <select name="role_type" required>
              <option value="Faculty">Faculty</option>
              <option value="Technician">Technician</option>
              <option value="Staff">Staff</option>
              <option value="Admin">Admin</option>
            </select>
          </label>
          <label>Department
            <select name="dept_id" required>
              <option value="1">Computer Science &amp; AI</option>
              <option value="2">Electronics &amp; IoT</option>
              <option value="3">Campus Administration</option>
            </select>
          </label>
        </div>
        <label>Designation <input type="text" name="designation" placeholder="Assistant Professor" required /></label>
        <label>Create Password <input type="password" name="password" placeholder="Min 6 characters" required /></label>
        <button type="submit" class="btn" style="width:100%;margin-top:6px;">Create Account &amp; Enter</button>
      </form>
    </div>
  </div>
  <script>
    function switchAuth(mode) {
      document.getElementById('loginForm').style.display = mode === 'login' ? 'grid' : 'none';
      document.getElementById('signupForm').style.display = mode === 'signup' ? 'grid' : 'none';
      document.getElementById('btnShowLogin').classList.toggle('active', mode === 'login');
      document.getElementById('btnShowSignup').classList.toggle('active', mode === 'signup');
    }
    function fillDemo(role, email, pass) {
      document.getElementById('loginRole').value = role;
      document.getElementById('loginEmail').value = email;
      document.getElementById('loginPass').value = pass;
      document.getElementById('loginForm').submit();
    }
  </script>
</body>
</html>`;

module.exports = { fmtCurrency, fmtDate, badge, pageShell, authShell };