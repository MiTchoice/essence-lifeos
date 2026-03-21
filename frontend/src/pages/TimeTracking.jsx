import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Play, Square, Plus, Trash2, X, Clock, RotateCcw, Zap } from "lucide-react";
import { timeApi } from "../api";
import useStore from "../store/useStore";

const CAT_DOT   = { productive:"#22c55e", unproductive:"#f87171", neutral:"#94a3b8" };
const CAT_BG    = { productive:"rgba(34,197,94,0.08)",  unproductive:"rgba(248,113,113,0.08)",  neutral:"rgba(148,163,184,0.08)" };
const CAT_BORDER= { productive:"rgba(34,197,94,0.25)",  unproductive:"rgba(248,113,113,0.25)",  neutral:"rgba(148,163,184,0.2)" };
const CAT_COLOR = { productive:"#86efac", unproductive:"#fca5a5", neutral:"#94a3b8" };

const fmtSecs = s => `${String(Math.floor(s/3600)).padStart(2,"0")}:${String(Math.floor((s%3600)/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
const fmtM    = m => m >= 60 ? `${Math.floor(m/60)}h ${m%60>0?m%60+"m":""}`.trim() : `${m||0}m`;

const STAT_CARDS = [
  { key:"productive",   label:"Productive",   color:"#22c55e" },
  { key:"unproductive", label:"Unproductive", color:"#f87171" },
  { key:"neutral",      label:"Neutral",      color:"#94a3b8" },
  { key:"total",        label:"Total",        color:"var(--accent-light)" },
];

const TT = ({ active, payload }) =>
  active && payload?.length ? (
    <div style={{ background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:10, padding:"10px 12px", fontSize:11, boxShadow:"0 8px 24px rgba(0,0,0,0.3)" }}>
      {payload.map((p,i) => <p key={i} style={{ color:p.color, fontWeight:700 }}>{p.name}: {fmtM(p.value)}</p>)}
    </div>
  ) : null;

export default function TimeTracking() {
  const { activeTimer, setActiveTimer, addToast } = useStore();
  const [entries,    setEntries]    = useState([]);
  const [report,     setReport]     = useState(null);
  const [elapsed,    setElapsed]    = useState(0);
  const [showManual, setShowManual] = useState(false);
  const [tf, setTf] = useState({ taskTitle:"", category:"productive" });
  const [mf, setMf] = useState({ taskTitle:"", category:"productive", date:new Date().toISOString().split("T")[0], durationMinutes:30 });
  const iv = useRef(null);

  const load = () => {
    const today = new Date().toISOString().split("T")[0];
    timeApi.getAll({ date:today }).then(r => setEntries(r.data)).catch(()=>{});
    timeApi.dailyReport().then(r => setReport(r.data)).catch(()=>{});
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    clearInterval(iv.current);
    if (activeTimer) {
      const tick = () => setElapsed(Math.floor((Date.now() - new Date(activeTimer.startTime)) / 1000));
      tick();
      iv.current = setInterval(tick, 1000);
    } else {
      setElapsed(0);
    }
    return () => clearInterval(iv.current);
  }, [activeTimer]);

  const startTimer = async () => {
    if (!tf.taskTitle.trim()) { addToast("Enter a task name", "warning"); return; }
    try {
      const r = await timeApi.start({ taskTitle: tf.taskTitle, category: tf.category });
      setActiveTimer(r.data);
      addToast("Timer started! ▶️");
      load();
    } catch { addToast("Failed to start", "error"); }
  };

  const stopTimer = async () => {
    if (!activeTimer) return;
    await timeApi.stop(activeTimer._id);
    setActiveTimer(null);
    addToast("Timer stopped ✅");
    load();
  };

  // ── FIX: Restart timer from an existing entry ─────────────────────────────
  const restartFromEntry = async (entry) => {
    // If there's an active timer, stop it first
    if (activeTimer) {
      await timeApi.stop(activeTimer._id);
      setActiveTimer(null);
    }
    // Pre-fill the form with entry data
    setTf({ taskTitle: entry.taskTitle, category: entry.category });
    // Start a new timer with same task info
    try {
      const r = await timeApi.start({ taskTitle: entry.taskTitle, category: entry.category });
      setActiveTimer(r.data);
      addToast(`Restarted: ${entry.taskTitle} ▶️`);
      load();
      // Scroll to top so user sees the timer
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch { addToast("Failed to restart", "error"); }
  };

  const addManual = async (e) => {
    e.preventDefault();
    const mins  = parseInt(mf.durationMinutes) || 1;
    const now   = new Date();
    const start = new Date(now.getTime() - mins * 60000);
    await timeApi.create({ ...mf, startTime: start.toISOString(), endTime: now.toISOString(), durationMinutes: mins });
    setShowManual(false);
    setMf({ taskTitle:"", category:"productive", date: new Date().toISOString().split("T")[0], durationMinutes: 30 });
    addToast("Entry added!");
    load();
  };

  const today = report?.today     || { productive:0, unproductive:0, neutral:0, total:0 };
  const yest  = report?.yesterday || { productive:0, unproductive:0, neutral:0, total:0 };
  const pct   = v => today.total > 0 ? Math.round(v / today.total * 100) : 0;

  const chartData = [
    { name:"Productive",   today: today.productive,   yesterday: yest.productive },
    { name:"Unproductive", today: today.unproductive, yesterday: yest.unproductive },
    { name:"Neutral",      today: today.neutral,      yesterday: yest.neutral },
  ];

  return (
    <div className="space-y-5 max-w-5xl">

      {/* Header */}
      <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Time Tracking</h1>
          <p className="text-sm mt-0.5" style={{ color:"var(--text-muted)" }}>Track your focus and measure what matters</p>
        </div>
        <button onClick={() => setShowManual(true)} className="btn-outline">
          <Plus className="w-4 h-4"/> Manual Entry
        </button>
      </motion.div>

      {/* Live Timer Card */}
      <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.05 }}
        className="card p-6 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 pointer-events-none"
          style={{ background:"radial-gradient(circle, var(--accent) 0%, transparent 70%)", transform:"translate(30%,-30%)" }}/>

        <div className="flex items-center gap-2 mb-5 relative">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background:"rgba(99,102,241,0.15)", border:"1px solid rgba(99,102,241,0.3)" }}>
            <Clock className="w-4 h-4" style={{ color:"var(--accent)" }}/>
          </div>
          <p className="section-title">Live Timer</p>
          {activeTimer && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ml-auto"
              style={{ background:"rgba(34,197,94,0.12)", border:"1px solid rgba(34,197,94,0.3)", color:"#86efac" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block"/>
              LIVE
            </span>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-3 items-end relative">
          <div className="flex-1">
            <label className="label">What are you working on?</label>
            <input className="input" placeholder="e.g. Studying algorithms, Building ESSENCE…"
              value={tf.taskTitle}
              onChange={e => setTf({...tf, taskTitle: e.target.value})}
              disabled={!!activeTimer}
              onKeyDown={e => e.key === "Enter" && !activeTimer && startTimer()}/>
          </div>
          <div style={{ width:170 }}>
            <label className="label">Category</label>
            <select className="input" value={tf.category}
              onChange={e => setTf({...tf, category: e.target.value})}
              disabled={!!activeTimer}>
              <option value="productive">🟢 Productive</option>
              <option value="unproductive">🔴 Unproductive</option>
              <option value="neutral">⚪ Neutral</option>
            </select>
          </div>
          {!activeTimer
            ? <button onClick={startTimer} className="btn-primary" style={{ whiteSpace:"nowrap" }}>
                <Play className="w-4 h-4"/> Start Timer
              </button>
            : <button onClick={stopTimer} className="btn-danger" style={{ whiteSpace:"nowrap" }}>
                <Square className="w-4 h-4"/> Stop Timer
              </button>
          }
        </div>

        <AnimatePresence>
          {activeTimer && (
            <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }}
              className="mt-6 text-center">
              <div className="inline-flex flex-col items-center rounded-2xl px-12 py-6"
                style={{
                  background:"linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.08))",
                  border:"1px solid rgba(99,102,241,0.25)",
                  boxShadow:"0 0 40px rgba(99,102,241,0.12)",
                }}>
                <div className="font-mono font-black tabular-nums"
                  style={{ fontSize:52, lineHeight:1, color:"var(--accent)", letterSpacing:"-0.02em",
                    textShadow:"0 0 30px rgba(99,102,241,0.5)" }}>
                  {fmtSecs(elapsed)}
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <div className="w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: CAT_DOT[activeTimer.category] }}/>
                  <p className="text-sm" style={{ color:"var(--text-secondary)" }}>
                    Tracking: <strong style={{ color:"var(--text-primary)" }}>{activeTimer.taskTitle}</strong>
                  </p>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: CAT_BG[activeTimer.category], color: CAT_COLOR[activeTimer.category] }}>
                    {activeTimer.category}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ key, label, color }, i) => {
          const val = today[key] || 0;
          return (
            <motion.div key={key} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1+i*0.05 }}
              whileHover={{ y:-2, scale:1.02 }} transition2={{ duration:0.15 }}
              className="card p-4" style={{ borderColor: `${color}25` }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color:"var(--text-muted)" }}>{label}</p>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color, boxShadow:`0 0 8px ${color}` }}/>
              </div>
              <p className="text-2xl font-black tabular-nums" style={{ color }}>{fmtM(val)}</p>
              {key !== "total" && today.total > 0 && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs mb-1" style={{ color:"var(--text-muted)" }}>
                    <span>{pct(val)}% of day</span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background:"var(--bg-hover)" }}>
                    <motion.div initial={{ width:0 }} animate={{ width:`${pct(val)}%` }}
                      transition={{ duration:1, ease:"easeOut", delay:0.3 }}
                      className="h-full rounded-full" style={{ backgroundColor: color }}/>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.2 }} className="card p-5">
          <p className="section-title mb-4">Today vs Yesterday</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barGap={4}>
              <XAxis dataKey="name" tick={{ fontSize:10, fill:"var(--text-muted)" }} tickLine={false} axisLine={false}/>
              <YAxis tick={{ fontSize:10, fill:"var(--text-muted)" }} tickLine={false} axisLine={false} tickFormatter={fmtM}/>
              <Tooltip content={<TT/>}/>
              <Bar dataKey="today"     name="Today"     fill="var(--accent)" radius={[4,4,0,0]} maxBarSize={28}/>
              <Bar dataKey="yesterday" name="Yesterday" fill="rgba(99,102,241,0.25)" radius={[4,4,0,0]} maxBarSize={28}/>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity:0, x:10 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.25 }} className="card p-5 flex flex-col gap-4">
          <p className="section-title">Today's Breakdown</p>
          {[
            { label:"Productive",   val:today.productive,   color:"#22c55e" },
            { label:"Unproductive", val:today.unproductive, color:"#f87171" },
            { label:"Neutral",      val:today.neutral,      color:"#94a3b8" },
          ].map(({ label, val, color }) => (
            <div key={label}>
              <div className="flex justify-between text-sm mb-1.5">
                <span style={{ color:"var(--text-primary)", fontWeight:600 }}>{label}</span>
                <span style={{ color:"var(--text-secondary)" }} className="tabular-nums font-mono">{fmtM(val)}</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background:"var(--bg-hover)" }}>
                <motion.div initial={{ width:0 }} animate={{ width:`${pct(val)}%` }}
                  transition={{ duration:0.9, ease:"easeOut", delay:0.4 }}
                  className="h-full rounded-full" style={{ backgroundColor: color, boxShadow:`0 0 6px ${color}60` }}/>
              </div>
            </div>
          ))}
          <div className="pt-3 mt-auto" style={{ borderTop:"1px solid var(--border)" }}>
            <div className="flex justify-between text-sm">
              <span style={{ color:"var(--text-muted)" }}>Yesterday total</span>
              <span style={{ color:"var(--text-secondary)", fontWeight:700 }} className="tabular-nums">{fmtM(yest.total)}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Today's Entries */}
      <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
        className="card overflow-hidden">
        <div className="p-5 flex items-center justify-between" style={{ borderBottom:"1px solid var(--border)" }}>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" style={{ color:"var(--accent)" }}/>
            <p className="section-title">Today's Entries</p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background:"var(--bg-hover)", color:"var(--text-muted)" }}>
            {entries.length} {entries.length === 1 ? "entry" : "entries"}
          </span>
        </div>

        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background:"var(--bg-hover)", border:"1px solid var(--border)" }}>
              <Clock className="w-6 h-6" style={{ color:"var(--text-muted)", opacity:0.5 }}/>
            </div>
            <p className="font-semibold" style={{ color:"var(--text-secondary)" }}>No entries today</p>
            <p className="text-sm" style={{ color:"var(--text-muted)" }}>Start the timer or add a manual entry to begin tracking</p>
            <button onClick={startTimer} className="btn-primary mt-1" disabled={!!activeTimer || !tf.taskTitle}>
              <Play className="w-3.5 h-3.5"/> Start Tracking
            </button>
          </div>
        ) : (
          <AnimatePresence>
            {entries.map((e, i) => (
              <motion.div key={e._id}
                initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-10 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3 px-5 py-3.5 group"
                style={{ borderBottom: i < entries.length-1 ? "1px solid var(--border)" : "none" }}
                onMouseEnter={ev => ev.currentTarget.style.background = "var(--bg-elevated)"}
                onMouseLeave={ev => ev.currentTarget.style.background = "transparent"}>

                {/* Category dot */}
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: CAT_DOT[e.category] || "#94a3b8", boxShadow:`0 0 6px ${CAT_DOT[e.category]}60` }}/>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color:"var(--text-primary)" }}>
                    {e.taskTitle}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color:"var(--text-muted)" }}>
                    <span className="capitalize">{e.category}</span>
                    {e.startTime && ` · ${new Date(e.startTime).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}`}
                  </p>
                </div>

                {/* Duration */}
                <span className="text-sm font-black tabular-nums font-mono"
                  style={{ color: CAT_COLOR[e.category] || "var(--text-primary)" }}>
                  {fmtM(e.durationMinutes)}
                </span>

                {/* Actions — visible on hover */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-150">
                  {/* RESTART button — the main fix */}
                  <motion.button
                    whileHover={{ scale:1.1 }} whileTap={{ scale:0.9 }}
                    onClick={() => restartFromEntry(e)}
                    title={`Restart: ${e.taskTitle}`}
                    className="btn-ghost p-2 rounded-xl"
                    style={{ color:"var(--accent)" }}
                    onMouseEnter={ev => ev.currentTarget.style.background = "rgba(99,102,241,0.12)"}
                    onMouseLeave={ev => ev.currentTarget.style.background = "transparent"}>
                    <RotateCcw className="w-3.5 h-3.5"/>
                  </motion.button>

                  {/* Delete */}
                  <motion.button
                    whileHover={{ scale:1.1 }} whileTap={{ scale:0.9 }}
                    onClick={() => { timeApi.remove(e._id).then(load); addToast("Entry deleted", "error"); }}
                    title="Delete entry"
                    className="btn-ghost p-2 rounded-xl"
                    style={{ color:"var(--text-muted)" }}
                    onMouseEnter={ev => { ev.currentTarget.style.background = "rgba(239,68,68,0.1)"; ev.currentTarget.style.color = "#f87171"; }}
                    onMouseLeave={ev => { ev.currentTarget.style.background = "transparent"; ev.currentTarget.style.color = "var(--text-muted)"; }}>
                    <Trash2 className="w-3.5 h-3.5"/>
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </motion.div>

      {/* Manual Entry Modal */}
      <AnimatePresence>
        {showManual && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{ background:"rgba(0,0,0,0.7)", backdropFilter:"blur(10px)" }}
            onClick={e => e.target === e.currentTarget && setShowManual(false)}>
            <motion.div initial={{ scale:0.9, y:20, opacity:0 }} animate={{ scale:1, y:0, opacity:1 }}
              exit={{ scale:0.9, y:20, opacity:0 }} transition={{ type:"spring", stiffness:420, damping:32 }}
              className="w-full max-w-md rounded-2xl overflow-hidden"
              style={{ background:"var(--bg-elevated)", border:"1px solid var(--border)", boxShadow:"0 32px 80px rgba(0,0,0,0.5)" }}>
              <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom:"1px solid var(--border)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background:"rgba(99,102,241,0.12)", border:"1px solid rgba(99,102,241,0.3)" }}>
                    <Clock className="w-4 h-4" style={{ color:"var(--accent)" }}/>
                  </div>
                  <p className="font-bold text-sm" style={{ color:"var(--text-primary)" }}>Manual Time Entry</p>
                </div>
                <button onClick={() => setShowManual(false)} className="btn-ghost p-1.5 rounded-xl">
                  <X className="w-4 h-4"/>
                </button>
              </div>
              <form onSubmit={addManual} className="p-6 space-y-4">
                <div>
                  <label className="label">Task Name *</label>
                  <input className="input" required placeholder="What did you work on?"
                    value={mf.taskTitle} onChange={e => setMf({...mf, taskTitle: e.target.value})}/>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Category</label>
                    <select className="input" value={mf.category} onChange={e => setMf({...mf, category: e.target.value})}>
                      <option value="productive">🟢 Productive</option>
                      <option value="unproductive">🔴 Unproductive</option>
                      <option value="neutral">⚪ Neutral</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Duration (minutes)</label>
                    <input type="number" className="input" required min={1} max={720}
                      value={mf.durationMinutes} onChange={e => setMf({...mf, durationMinutes: e.target.value})}/>
                  </div>
                </div>
                <div>
                  <label className="label">Date</label>
                  <input type="date" className="input" value={mf.date} onChange={e => setMf({...mf, date: e.target.value})}/>
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="submit" className="btn-primary flex-1 justify-center">Add Entry</button>
                  <button type="button" onClick={() => setShowManual(false)} className="btn-outline flex-1 justify-center">Cancel</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
