import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, Edit2, ArrowUp, ArrowDown, Shuffle,
  Check, Pause, X, Clock, Tag, ChevronDown,
  Bold, Italic, Underline, List,
  AlertCircle, Flame, Circle, CheckCircle2, Filter,
} from "lucide-react";
import { tasksApi } from "../api";
import useStore from "../store/useStore";

const PRI_CFG = {
  low:    { badge:"badge-low",    dot:"#94a3b8", icon:<Circle       className="w-3 h-3"/>, label:"Low",    color:"#94a3b8" },
  medium: { badge:"badge-medium", dot:"#60a5fa", icon:<Circle       className="w-3 h-3 text-blue-400"/>, label:"Medium", color:"#60a5fa" },
  high:   { badge:"badge-high",   dot:"#fb923c", icon:<AlertCircle  className="w-3 h-3 text-orange-400"/>, label:"High", color:"#fb923c" },
  urgent: { badge:"badge-urgent", dot:"#f87171", icon:<Flame        className="w-3 h-3 text-red-400"/>, label:"Urgent", color:"#f87171" },
};
const STA_CFG = {
  incomplete: { badge:"badge-incomplete", label:"Todo" },
  completed:  { badge:"badge-completed",  label:"Done" },
  suspended:  { badge:"badge-suspended",  label:"Paused" },
};
const EMPTY = { title:"", description:"", priority:"medium", category:"general", status:"incomplete", dueDate:"", scheduledDate:"", estimatedMinutes:30, tags:"" };

/* ── Rich Text Toolbar ── */
function RichToolbar({ textareaRef, value, onChange }) {
  const wrap = (before, after="") => {
    const el = textareaRef.current; if (!el) return;
    const s = el.selectionStart, e = el.selectionEnd;
    onChange(value.slice(0,s) + before + value.slice(s,e) + after + value.slice(e));
    setTimeout(() => { el.focus(); el.setSelectionRange(s+before.length, e+before.length); }, 0);
  };
  const tools = [
    { icon:<Bold className="w-3.5 h-3.5"/>,     title:"Bold",      fn:()=>wrap("**","**") },
    { icon:<Italic className="w-3.5 h-3.5"/>,    title:"Italic",    fn:()=>wrap("_","_") },
    { icon:<Underline className="w-3.5 h-3.5"/>, title:"Underline", fn:()=>wrap("<u>","</u>") },
    { icon:<span className="text-xs font-black">H</span>, title:"Heading", fn:()=>wrap("## ") },
    { icon:<List className="w-3.5 h-3.5"/>, title:"Bullet", fn:()=>{
      const el = textareaRef.current; if(!el) return;
      const s = value.lastIndexOf("\n", el.selectionStart-1)+1;
      onChange(value.slice(0,s)+"• "+value.slice(s));
    }},
    { icon:<span className="font-mono text-xs">{"`"}</span>, title:"Code", fn:()=>wrap("`","`") },
  ];
  return (
    <div className="flex items-center gap-0.5 px-2 py-1.5 rounded-t-xl"
      style={{ background:"var(--bg-elevated)", borderBottom:"1px solid var(--border)" }}>
      {tools.map((t,i) => (
        <button key={i} type="button" title={t.title} onClick={t.fn} className="rtb-btn">{t.icon}</button>
      ))}
    </div>
  );
}

/* ── Markdown lite renderer ── */
function RenderDesc({ text }) {
  if (!text) return null;
  return (
    <div className="text-xs leading-relaxed space-y-0.5" style={{ color:"var(--text-muted)" }}>
      {text.split("\n").map((line, i) => {
        if (line === "---") return <hr key={i} style={{ borderColor:"var(--border)" }}/>;
        const html = line
          .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
          .replace(/_(.*?)_/g, "<em>$1</em>")
          .replace(/<u>(.*?)<\/u>/g,'<span style="text-decoration:underline">$1</span>')
          .replace(/`(.*?)`/g,'<code style="background:rgba(99,102,241,0.15);color:#a5b4fc;padding:1px 4px;border-radius:4px;font-family:monospace">$1</code>')
          .replace(/^## (.+)/,'<span style="color:var(--text-primary);font-weight:700;font-size:13px">$1</span>')
          .replace(/^• (.+)/,'&nbsp;&nbsp;• $1');
        return <p key={i} dangerouslySetInnerHTML={{ __html: html || "&nbsp;" }}/>;
      })}
    </div>
  );
}

/* ── Task Modal ── */
function TaskModal({ init, onSave, onClose }) {
  const [f, setF] = useState(init || EMPTY);
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState("");
  const taRef = useRef(null);
  const s = (k,v) => setF(p=>({...p,[k]:v}));

  const submit = async (e) => {
    e.preventDefault();
    if (!f.title.trim()) { setErr("Title is required"); return; }
    setSaving(true); setErr("");
    try {
      await onSave({ ...f, estimatedMinutes:parseInt(f.estimatedMinutes)||30,
        tags: f.tags ? f.tags.split(",").map(t=>t.trim()).filter(Boolean) : [],
        dueDate: f.dueDate || null, scheduledDate: f.scheduledDate || null });
    } catch(ex) { setErr(ex?.error || "Failed to save"); }
    finally { setSaving(false); }
  };

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background:"rgba(0,0,0,0.72)", backdropFilter:"blur(12px)" }}
      onClick={e => e.target===e.currentTarget && onClose()}>
      <motion.div initial={{ scale:0.92, opacity:0, y:24 }} animate={{ scale:1, opacity:1, y:0 }}
        exit={{ scale:0.92, opacity:0, y:24 }} transition={{ type:"spring", stiffness:420, damping:32 }}
        className="w-full max-w-lg max-h-[92vh] overflow-y-auto"
        style={{ background:"var(--bg-elevated)", border:"1px solid var(--border-strong)", borderRadius:22, boxShadow:"0 32px 80px rgba(0,0,0,0.55)" }}>

        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom:"1px solid var(--border)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background:"rgba(34,197,94,0.12)", border:"1px solid rgba(34,197,94,0.28)" }}>
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" style={{ width:18, height:18 }}/>
            </div>
            <p className="font-bold text-sm" style={{ color:"var(--text-primary)" }}>{init?"Edit Task":"New Task"}</p>
          </div>
          <button onClick={onClose} className="btn-ghost p-2 rounded-xl" style={{ borderRadius:10 }}>
            <X className="w-4 h-4"/>
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          {err && (
            <motion.div initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }}
              className="rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2"
              style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.25)", color:"#fca5a5" }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0"/>{err}
            </motion.div>
          )}

          <div>
            <label className="label">Title *</label>
            <input className="input text-base font-semibold" placeholder="What needs to be done?" autoFocus
              value={f.title} onChange={e=>s("title",e.target.value)}/>
          </div>

          <div>
            <label className="label">Description</label>
            <div style={{ borderRadius:12, overflow:"hidden", border:"1px solid var(--border)" }}>
              <RichToolbar textareaRef={taRef} value={f.description} onChange={v=>s("description",v)}/>
              <textarea ref={taRef} rows={4} placeholder="Details, notes, context…"
                className="w-full px-4 py-3 text-sm resize-none focus:outline-none font-mono leading-relaxed"
                style={{ background:"var(--bg-elevated)", color:"var(--text-primary)" }}
                value={f.description} onChange={e=>s("description",e.target.value)}/>
            </div>
          </div>

          {/* Priority selector */}
          <div>
            <label className="label">Priority</label>
            <div className="grid grid-cols-4 gap-2">
              {["low","medium","high","urgent"].map(p => {
                const isActive = f.priority === p;
                const col = PRI_CFG[p].color;
                return (
                  <button key={p} type="button" onClick={()=>s("priority",p)}
                    className="py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 justify-center"
                    style={{
                      background: isActive ? `${col}18` : "var(--bg-elevated)",
                      border: `2px solid ${isActive ? col : "var(--border)"}`,
                      color: isActive ? col : "var(--text-secondary)",
                      boxShadow: isActive ? `0 0 12px ${col}30` : "none",
                    }}>
                    {PRI_CFG[p].icon}{PRI_CFG[p].label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Status</label>
              <select className="input" value={f.status} onChange={e=>s("status",e.target.value)}>
                {["incomplete","completed","suspended"].map(st=><option key={st} value={st}>{st.charAt(0).toUpperCase()+st.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Est. Minutes</label>
              <input type="number" className="input" min={1} max={480} value={f.estimatedMinutes} onChange={e=>s("estimatedMinutes",e.target.value)}/>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Due Date</label><input type="date" className="input" value={f.dueDate} onChange={e=>s("dueDate",e.target.value)}/></div>
            <div><label className="label">Scheduled</label><input type="date" className="input" value={f.scheduledDate} onChange={e=>s("scheduledDate",e.target.value)}/></div>
          </div>

          <div><label className="label">Category</label><input className="input" placeholder="work, health, study…" value={f.category} onChange={e=>s("category",e.target.value)}/></div>
          <div><label className="label">Tags <span className="normal-case font-normal text-[10px]" style={{ color:"var(--text-muted)" }}>(comma separated)</span></label>
            <input className="input" placeholder="design, urgent, review…" value={f.tags} onChange={e=>s("tags",e.target.value)}/></div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : (init?"Update Task":"Create Task")}
            </button>
            <button type="button" onClick={onClose} className="btn-outline flex-1">Cancel</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

/* ── Task Card ── */
function TaskCard({ task, onEdit, onUpdated, onDeleted }) {
  const { addToast } = useStore();
  const [exp, setExp] = useState(false);

  const patch  = async (data) => { const r = await tasksApi.update(task._id,data); onUpdated(r.data); };
  const del    = async () => { if(!confirm("Delete this task?")) return; await tasksApi.remove(task._id); onDeleted(task._id); addToast("Task deleted","error"); };
  const toggle = () => patch({ status: task.status==="completed" ? "incomplete" : "completed" });
  const pri    = PRI_CFG[task.priority] || PRI_CFG.medium;
  const sta    = STA_CFG[task.status]   || STA_CFG.incomplete;
  const overdue= task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "completed";
  const done   = task.status === "completed";

  return (
    <motion.div layout initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, x:-20, height:0 }}
      transition={{ duration:0.22, ease:[0.22,1,0.36,1] }}
      className="card-hover group flex items-start gap-3 p-4"
      style={{ paddingLeft:16 }}>

      {/* Priority accent stripe */}
      <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full transition-all"
        style={{ background: done ? "var(--border)" : pri.dot, opacity: done ? 0.3 : 0.7 }}/>

      {/* Checkbox */}
      <motion.button onClick={toggle} whileTap={{ scale:0.85 }}
        className="mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200"
        style={{
          borderColor: done ? "#22c55e" : "var(--border-strong)",
          background:  done ? "#22c55e" : "transparent",
        }}
        whileHover={{ borderColor: done ? "#22c55e" : "var(--accent)", background: done ? "#22c55e" : "var(--accent-glow)" }}>
        {done && <Check className="w-3 h-3 text-white" strokeWidth={3}/>}
      </motion.button>

      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap">
          <span className="text-sm font-semibold leading-snug"
            style={{ color: done ? "var(--text-muted)" : "var(--text-primary)", textDecoration: done ? "line-through" : "none" }}>
            {task.title}
          </span>
          <span className={`badge ${pri.badge}`}>{pri.icon} {pri.label}</span>
          <span className={`badge ${sta.badge}`}>{sta.label}</span>
        </div>

        <div className="flex flex-wrap gap-3 mt-1.5 text-[11px]" style={{ color:"var(--text-muted)" }}>
          {task.category && (
            <span className="flex items-center gap-1"><Tag className="w-3 h-3"/>{task.category}</span>
          )}
          {task.dueDate && (
            <span className={`flex items-center gap-1 font-medium ${overdue ? "text-red-400" : ""}`}>
              <Clock className="w-3 h-3"/>Due {new Date(task.dueDate).toLocaleDateString("en-IN")}{overdue && " ⚠️"}
            </span>
          )}
          {task.estimatedMinutes > 0 && <span>~{task.estimatedMinutes}m</span>}
          {task.tags?.slice(0,3).map(t => (
            <span key={t} className="tag-pill">#{t}</span>
          ))}
        </div>

        <AnimatePresence>
          {exp && task.description && (
            <motion.div initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }} exit={{ height:0, opacity:0 }}
              className="mt-2.5 pt-2.5 overflow-hidden" style={{ borderTop:"1px solid var(--border)" }}>
              <RenderDesc text={task.description}/>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-150 flex-shrink-0">
        {[
          { icon:<ArrowUp className="w-3.5 h-3.5"/>,   title:"Prepone",  fn:()=>tasksApi.prepone(task._id).then(r=>onUpdated(r.data)),   hoverColor:"rgba(96,165,250,0.15)", textColor:"#60a5fa" },
          { icon:<ArrowDown className="w-3.5 h-3.5"/>,  title:"Postpone", fn:()=>tasksApi.postpone(task._id).then(r=>onUpdated(r.data)),  hoverColor:"rgba(251,146,60,0.15)", textColor:"#fb923c" },
          { icon:<Pause className="w-3.5 h-3.5"/>,      title:"Pause",    fn:()=>patch({status:"suspended"}),                              hoverColor:"rgba(251,191,36,0.15)", textColor:"#fbbf24" },
          { icon:<Edit2 className="w-3.5 h-3.5"/>,      title:"Edit",     fn:onEdit,                                                       hoverColor:"var(--accent-glow)",   textColor:"var(--accent-light)" },
          { icon:<Trash2 className="w-3.5 h-3.5"/>,     title:"Delete",   fn:del,                                                          hoverColor:"rgba(239,68,68,0.15)",  textColor:"#f87171" },
        ].map((a,i) => (
          <motion.button key={i} title={a.title} onClick={a.fn} whileTap={{ scale:0.85 }}
            className="p-1.5 rounded-lg transition-all duration-100"
            style={{ color:"var(--text-muted)" }}
            onMouseEnter={e=>{ e.currentTarget.style.background=a.hoverColor; e.currentTarget.style.color=a.textColor; }}
            onMouseLeave={e=>{ e.currentTarget.style.background="transparent"; e.currentTarget.style.color="var(--text-muted)"; }}>
            {a.icon}
          </motion.button>
        ))}
      </div>

      {task.description && (
        <motion.button onClick={() => setExp(!exp)} whileTap={{ scale:0.85 }}
          className="p-1 rounded-lg flex-shrink-0 transition-colors"
          style={{ color:"var(--text-muted)" }}>
          <motion.div animate={{ rotate:exp?180:0 }} transition={{ duration:0.2 }}>
            <ChevronDown className="w-3.5 h-3.5"/>
          </motion.div>
        </motion.button>
      )}
    </motion.div>
  );
}

const FILTER_CONFIG = {
  all:        { label:"All",    color:"var(--accent)" },
  incomplete: { label:"Todo",   color:"#fbbf24" },
  completed:  { label:"Done",   color:"#22c55e" },
  suspended:  { label:"Paused", color:"#94a3b8" },
};

export default function Tasks() {
  const { tasks, setTasks, addTask, updateTask, removeTask, addToast } = useStore();
  const [filter,    setFilter]    = useState("all");
  const [sort,      setSort]      = useState("order");
  const [showModal, setShowModal] = useState(false);
  const [editTask,  setEditTask]  = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [shuffling, setShuffling] = useState(false);

  useEffect(() => {
    tasksApi.getAll()
      .then(r  => { setTasks(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const FILTERS = ["all","incomplete","completed","suspended"];
  const counts  = FILTERS.reduce((acc,f) => { acc[f] = f==="all" ? tasks.length : tasks.filter(t=>t.status===f).length; return acc; }, {});

  const filtered = tasks
    .filter(t => filter==="all" || t.status===filter)
    .sort((a,b) => {
      if (sort==="priority") { const m={urgent:4,high:3,medium:2,low:1}; return (m[b.priority]||0)-(m[a.priority]||0); }
      if (sort==="dueDate")  { if(!a.dueDate) return 1; if(!b.dueDate) return -1; return new Date(a.dueDate)-new Date(b.dueDate); }
      return (a.order||0)-(b.order||0);
    });

  const handleCreate  = async (d) => { const r = await tasksApi.create(d); addTask(r.data); setShowModal(false); addToast("Task created ✅"); };
  const handleUpdate  = async (d) => { const r = await tasksApi.update(editTask._id,d); updateTask(editTask._id,r.data); setEditTask(null); addToast("Task updated"); };
  const handleShuffle = async () => {
    setShuffling(true);
    try { const r = await tasksApi.shuffle(); setTasks(r.data); addToast("AI shuffled your tasks 🔀"); }
    finally { setShuffling(false); }
  };

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="text-sm mt-0.5" style={{ color:"var(--text-muted)" }}>
            <span style={{ color:"var(--amber)", fontWeight:700 }}>{counts.incomplete}</span> pending &nbsp;·&nbsp;
            <span style={{ color:"var(--green)", fontWeight:700 }}>{counts.completed}</span> completed
          </p>
        </div>
        <div className="flex gap-2">
          <motion.button onClick={handleShuffle} disabled={shuffling} className="btn-outline"
            whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}>
            {shuffling ? <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor:"var(--accent)" }}/> : <Shuffle className="w-4 h-4"/>}
            AI Shuffle
          </motion.button>
          <motion.button onClick={() => { setEditTask(null); setShowModal(true); }} className="btn-primary"
            whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}>
            <Plus className="w-4 h-4"/> New Task
          </motion.button>
        </div>
      </motion.div>

      {/* Filter bar */}
      <motion.div initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.06 }}
        className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1.5 flex-wrap p-1 rounded-2xl" style={{ background:"var(--bg-elevated)", border:"1px solid var(--border)" }}>
          {FILTERS.map(f => {
            const isActive = filter === f;
            const cfg = FILTER_CONFIG[f];
            return (
              <motion.button key={f} onClick={() => setFilter(f)} whileTap={{ scale:0.95 }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 flex items-center gap-1.5 relative"
                style={{
                  background: isActive ? `${cfg.color}18` : "transparent",
                  color: isActive ? cfg.color : "var(--text-muted)",
                  border: isActive ? `1px solid ${cfg.color}35` : "1px solid transparent",
                }}>
                {f.charAt(0).toUpperCase()+f.slice(1)}
                <span className="min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-black"
                  style={{ background: isActive ? `${cfg.color}25` : "var(--bg-hover)", color: isActive ? cfg.color : "var(--text-muted)" }}>
                  {counts[f]}
                </span>
              </motion.button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5" style={{ color:"var(--text-muted)" }}/>
          <select value={sort} onChange={e=>setSort(e.target.value)} className="input w-auto text-xs py-1.5 px-3">
            <option value="order">AI Order</option>
            <option value="priority">Priority</option>
            <option value="dueDate">Due Date</option>
          </select>
        </div>
      </motion.div>

      {/* Task list */}
      {loading ? (
        <div className="space-y-2">
          {Array(4).fill(0).map((_,i) => (
            <div key={i} className="card p-4 flex items-center gap-3">
              <div className="skeleton w-5 h-5 rounded-full flex-shrink-0"/>
              <div className="flex-1 space-y-2"><div className="skeleton h-3.5 rounded" style={{ width:`${60+i*8}%` }}/><div className="skeleton h-2.5 rounded w-32"/></div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background:"var(--bg-elevated)", border:"1px solid var(--border)" }}>
            <CheckCircle2 className="w-7 h-7" style={{ color:"var(--text-muted)", opacity:0.5 }}/>
          </div>
          <p className="font-bold text-sm" style={{ color:"var(--text-secondary)" }}>
            {filter==="all" ? "No tasks yet" : `No ${filter} tasks`}
          </p>
          <p className="text-sm mt-1" style={{ color:"var(--text-muted)" }}>
            {filter==="all" ? "Create your first task to get started" : "Try a different filter"}
          </p>
          {filter==="all" && (
            <button onClick={() => setShowModal(true)} className="btn-primary mx-auto mt-4">
              <Plus className="w-4 h-4"/> Create Task
            </button>
          )}
        </motion.div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {filtered.map(task => (
              <TaskCard key={task._id} task={task}
                onEdit={() => setEditTask(task)}
                onUpdated={data => updateTask(task._id, data)}
                onDeleted={id  => removeTask(id)}/>
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {(showModal || editTask) && (
          <TaskModal
            init={editTask ? { ...editTask, dueDate:editTask.dueDate?.split("T")[0]||"", scheduledDate:editTask.scheduledDate?.split("T")[0]||"", tags:editTask.tags?.join(", ")||"" } : null}
            onSave={editTask ? handleUpdate : handleCreate}
            onClose={() => { setShowModal(false); setEditTask(null); }}/>
        )}
      </AnimatePresence>
    </div>
  );
}
