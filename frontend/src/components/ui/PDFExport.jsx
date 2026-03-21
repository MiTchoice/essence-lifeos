import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, FileText, X, CheckCircle, Loader, BarChart2, Clock, DollarSign, CheckSquare } from "lucide-react";
import { dashboardApi, tasksApi, financeApi, timeApi } from "../../api";
import useStore from "../../store/useStore";

/* ── Light-mode PDF for maximum print readability ─────────────────────────── */
function buildHTML(user, dash, tasks, expenses, timeReport) {
  const today = new Date().toLocaleDateString("en-IN",{ weekday:"long", day:"numeric", month:"long", year:"numeric" });
  const kpis  = dash?.kpis || {};
  const fmtM  = m => m >= 60 ? `${Math.floor(m/60)}h ${m%60>0?m%60+"m":""}`.trim() : `${m||0}m`;

  const priColors = { urgent:"#dc2626", high:"#d97706", medium:"#2563eb", low:"#64748b" };
  const staColors = { completed:"#16a34a", incomplete:"#d97706", suspended:"#64748b" };

  const kpiCard = (label, value, color, icon) =>
    `<div class="kpi">
       <div class="kpi-icon" style="background:${color}15;color:${color}">${icon}</div>
       <div class="kpi-val" style="color:${color}">${value}</div>
       <div class="kpi-lbl">${label}</div>
     </div>`;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<title>ESSENCE — ${user?.name || "User"}'s Report</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Plus Jakarta Sans',sans-serif;background:#ffffff;color:#0f172a;padding:32px 40px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
/* Header */
.header{display:flex;align-items:center;justify-content:space-between;padding-bottom:20px;margin-bottom:28px;border-bottom:2px solid #e2e8f0}
.brand{display:flex;align-items:center;gap:12px}
.brand-icon{width:44px;height:44px;border-radius:14px;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0}
.brand-name{font-size:22px;font-weight:800;color:#0f172a}
.brand-tag{font-size:10px;font-weight:700;color:#6366f1;letter-spacing:3px;text-transform:uppercase}
.header-right{text-align:right}
.report-name{font-size:15px;font-weight:700;color:#0f172a}
.report-date{font-size:12px;color:#64748b;margin-top:2px}
.report-email{font-size:11px;color:#94a3b8}
/* Section */
.section{margin-bottom:24px}
.sec-title{font-size:11px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:2px;margin-bottom:12px;padding-bottom:6px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:8px}
.sec-title span{display:inline-block;width:3px;height:13px;background:linear-gradient(180deg,#6366f1,#8b5cf6);border-radius:2px}
/* KPI grid */
.kpi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.kpi{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px 16px;display:flex;flex-direction:column;gap:4px}
.kpi-icon{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px;margin-bottom:4px}
.kpi-val{font-size:24px;font-weight:800}
.kpi-lbl{font-size:10px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:1px}
/* Table */
table{width:100%;border-collapse:collapse;font-size:12px}
th{background:#f1f5f9;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:1px;font-size:10px;padding:8px 12px;text-align:left;border-bottom:2px solid #e2e8f0}
td{padding:9px 12px;border-bottom:1px solid #f1f5f9;color:#334155;vertical-align:middle}
tr:hover td{background:#fafafa}
.pill{display:inline-block;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;border:1px solid transparent}
/* Time boxes */
.time-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.time-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px 14px}
.time-box-title{font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px}
.time-row{display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid #f1f5f9;font-size:12px}
.time-row:last-child{border-bottom:none}
.time-row-lbl{color:#64748b}
.time-row-val{font-weight:700}
/* Footer */
.footer{margin-top:32px;padding-top:16px;border-top:2px solid #f1f5f9;display:flex;justify-content:space-between;align-items:flex-end}
.footer-brand{font-size:11px;color:#94a3b8;line-height:1.5}
.footer-stamp{font-size:10px;color:#cbd5e1;font-weight:700;letter-spacing:3px;text-transform:uppercase}
@media print{body{padding:20px 28px}}
</style>
</head>
<body>
<!-- Header -->
<div class="header">
  <div class="brand">
    <div class="brand-icon">⚡</div>
    <div>
      <div class="brand-name">ESSENCE</div>
      <div class="brand-tag">MyLifeMyChoice</div>
    </div>
  </div>
  <div class="header-right">
    <div class="report-name">${user?.name || "User"}'s Activity Report</div>
    <div class="report-date">${today}</div>
    <div class="report-email">${user?.email || ""}</div>
  </div>
</div>

<!-- KPIs -->
<div class="section">
  <div class="sec-title"><span></span>Performance Summary</div>
  <div class="kpi-grid">
    ${kpiCard("Total Tasks",      kpis.totalTasks||0,           "#6366f1","📋")}
    ${kpiCard("Done Today",       kpis.completedToday||0,       "#16a34a","✅")}
    ${kpiCard("Completion Rate",  `${kpis.taskCompletionRate||0}%`, "#0284c7","📈")}
    ${kpiCard("Productive Time",  fmtM(kpis.productiveMinutes||0), "#7c3aed","⏱️")}
    ${kpiCard("Today's Spending", `₹${kpis.todaySpending||0}`,  "#dc2626","💸")}
    ${kpiCard("Pending Tasks",    kpis.incompleteTasks||0,       "#d97706","⏳")}
  </div>
</div>

<!-- Time Report -->
${timeReport ? `
<div class="section">
  <div class="sec-title"><span></span>Time Tracking Report</div>
  <div class="time-grid">
    <div class="time-box">
      <div class="time-box-title">Today</div>
      <div class="time-row"><span class="time-row-lbl">🟢 Productive</span><span class="time-row-val" style="color:#16a34a">${fmtM(timeReport.today?.productive||0)}</span></div>
      <div class="time-row"><span class="time-row-lbl">🔴 Unproductive</span><span class="time-row-val" style="color:#dc2626">${fmtM(timeReport.today?.unproductive||0)}</span></div>
      <div class="time-row"><span class="time-row-lbl">⚪ Neutral</span><span class="time-row-val" style="color:#64748b">${fmtM(timeReport.today?.neutral||0)}</span></div>
      <div class="time-row"><span class="time-row-lbl" style="font-weight:700">Total</span><span class="time-row-val" style="color:#0f172a">${fmtM(timeReport.today?.total||0)}</span></div>
    </div>
    <div class="time-box">
      <div class="time-box-title">Yesterday</div>
      <div class="time-row"><span class="time-row-lbl">🟢 Productive</span><span class="time-row-val" style="color:#16a34a">${fmtM(timeReport.yesterday?.productive||0)}</span></div>
      <div class="time-row"><span class="time-row-lbl">🔴 Unproductive</span><span class="time-row-val" style="color:#dc2626">${fmtM(timeReport.yesterday?.unproductive||0)}</span></div>
      <div class="time-row"><span class="time-row-lbl">⚪ Neutral</span><span class="time-row-val" style="color:#64748b">${fmtM(timeReport.yesterday?.neutral||0)}</span></div>
      <div class="time-row"><span class="time-row-lbl" style="font-weight:700">Total</span><span class="time-row-val" style="color:#0f172a">${fmtM(timeReport.yesterday?.total||0)}</span></div>
    </div>
  </div>
</div>` : ""}

<!-- Tasks -->
${(tasks||[]).length > 0 ? `
<div class="section">
  <div class="sec-title"><span></span>Task List (${Math.min(tasks.length,25)} tasks)</div>
  <table>
    <thead><tr><th>#</th><th>Task</th><th>Priority</th><th>Status</th><th>Category</th><th>Due</th></tr></thead>
    <tbody>
      ${tasks.slice(0,25).map((t,i)=>`
      <tr>
        <td style="color:#94a3b8;width:32px">${i+1}</td>
        <td style="font-weight:600;color:#0f172a;${t.status==="completed"?"text-decoration:line-through;color:#94a3b8":""}">${t.title}</td>
        <td><span class="pill" style="background:${priColors[t.priority]||"#64748b"}15;color:${priColors[t.priority]||"#64748b"};border-color:${priColors[t.priority]||"#64748b"}30">${t.priority||"—"}</span></td>
        <td><span class="pill" style="background:${staColors[t.status]||"#64748b"}15;color:${staColors[t.status]||"#64748b"};border-color:${staColors[t.status]||"#64748b"}30">${t.status||"—"}</span></td>
        <td style="color:#64748b">${t.category||"—"}</td>
        <td style="color:#94a3b8">${t.dueDate?new Date(t.dueDate).toLocaleDateString("en-IN"):"—"}</td>
      </tr>`).join("")}
    </tbody>
  </table>
</div>` : ""}

<!-- Expenses -->
${(expenses||[]).length > 0 ? `
<div class="section">
  <div class="sec-title"><span></span>Expenses (${Math.min(expenses.length,25)} recent)</div>
  <table>
    <thead><tr><th>#</th><th>Description</th><th>Category</th><th>Date</th><th style="text-align:right">Amount</th></tr></thead>
    <tbody>
      ${expenses.slice(0,25).map((e,i)=>`
      <tr>
        <td style="color:#94a3b8;width:32px">${i+1}</td>
        <td style="font-weight:600;color:#0f172a">${e.description}</td>
        <td><span class="pill" style="background:#f1f5f9;color:#64748b;border-color:#e2e8f0">${e.category||"—"}</span></td>
        <td style="color:#94a3b8">${e.date||"—"}</td>
        <td style="text-align:right;font-weight:700;color:#dc2626">₹${(e.amount||0).toFixed(2)}</td>
      </tr>`).join("")}
      <tr style="background:#f1f5f9">
        <td colspan="4" style="text-align:right;font-weight:700;color:#0f172a;padding:10px 12px">Total</td>
        <td style="text-align:right;font-weight:800;color:#6366f1;font-size:14px">₹${expenses.slice(0,25).reduce((s,e)=>s+(e.amount||0),0).toFixed(2)}</td>
      </tr>
    </tbody>
  </table>
</div>` : ""}

<!-- Footer -->
<div class="footer">
  <div class="footer-brand">
    Generated by <strong style="color:#6366f1">ESSENCE · MyLifeMyChoice</strong><br/>
    NIT Hamirpur · Mitrasen Yadav · Ashish Garg · Anshul Thakur
  </div>
  <div class="footer-stamp">ESSENCE ⚡ Report</div>
</div>
</body>
</html>`;
}

/* ── Export button + modal ────────────────────────────────────────────────── */
export function PDFExportButton() {
  const { user } = useStore();
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const [dashRes, tasksRes, expRes, timeRes] = await Promise.all([
        dashboardApi.get(), tasksApi.getAll(), financeApi.getAll(), timeApi.dailyReport(),
      ]);
      const html = buildHTML(user, dashRes.data, tasksRes.data, expRes.data, timeRes.data);
      const win  = window.open("", "_blank", "width=960,height=720");
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => { win.print(); setDone(true); setTimeout(()=>{ setDone(false); setOpen(false); }, 2000); }, 900);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="btn-outline flex items-center gap-2 text-xs py-2 px-3">
        <Download className="w-3.5 h-3.5"/> <span className="hidden sm:inline">Export</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{ background:"rgba(0,0,0,0.65)", backdropFilter:"blur(8px)" }}
            onClick={e => e.target===e.currentTarget && setOpen(false)}>
            <motion.div initial={{ scale:0.92, y:20 }} animate={{ scale:1, y:0 }} exit={{ scale:0.92, y:20 }}
              transition={{ type:"spring", stiffness:420, damping:32 }}
              className="w-full max-w-md rounded-3xl overflow-hidden"
              style={{ background:"var(--bg-elevated)", border:"1px solid var(--border)", boxShadow:"0 32px 80px rgba(0,0,0,0.5)" }}>

              <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom:"1px solid var(--border)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                    style={{ background:"linear-gradient(135deg,#6366f1,#8b5cf6)", boxShadow:"0 0 16px rgba(99,102,241,0.4)" }}>
                    <FileText className="w-5 h-5 text-white"/>
                  </div>
                  <div>
                    <p className="font-black text-sm" style={{ color:"var(--text-primary)" }}>Export Activity Report</p>
                    <p className="text-xs" style={{ color:"var(--text-muted)" }}>Clean, print-ready PDF format</p>
                  </div>
                </div>
                <button onClick={() => setOpen(false)} className="btn-ghost p-1.5"><X className="w-4 h-4"/></button>
              </div>

              <div className="p-6 space-y-3">
                {[
                  [BarChart2,    "Performance KPIs",    "6 key productivity metrics",    "#6366f1"],
                  [CheckSquare, "Full Task List",       "All tasks with priority & status","#22c55e"],
                  [Clock,       "Time Tracking",        "Today vs yesterday breakdown",   "#8b5cf6"],
                  [DollarSign,  "Expense Report",       "Transactions & category totals", "#ef4444"],
                ].map(([Icon, title, desc, col]) => (
                  <div key={title} className="flex items-center gap-3 rounded-xl p-3 transition-colors"
                    style={{ background:"var(--bg-surface)", border:"1px solid var(--border)" }}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background:`${col}15` }}>
                      <Icon className="w-4 h-4" style={{ color:col }}/>
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color:"var(--text-primary)" }}>{title}</p>
                      <p className="text-xs" style={{ color:"var(--text-muted)" }}>{desc}</p>
                    </div>
                  </div>
                ))}

                <div className="rounded-xl p-3 mt-1" style={{ background:"rgba(99,102,241,0.08)", border:"1px solid rgba(99,102,241,0.2)" }}>
                  <p className="text-xs text-indigo-300">
                    💡 In the print dialog → choose <strong>"Save as PDF"</strong>. The report uses a clean white background for maximum readability.
                  </p>
                </div>

                <button onClick={generate} disabled={loading || done}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-white text-sm transition-all active:scale-[0.98] disabled:opacity-70 mt-1"
                  style={{ background:"linear-gradient(135deg,#6366f1,#4f46e5)", boxShadow:"0 4px 20px rgba(99,102,241,0.35)" }}>
                  {loading ? <><Loader className="w-4 h-4 animate-spin"/> Preparing…</>
                  : done    ? <><CheckCircle className="w-4 h-4 text-emerald-300"/> Report ready! Check your browser.</>
                  :           <><Download className="w-4 h-4"/> Download PDF Report</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default PDFExportButton;
