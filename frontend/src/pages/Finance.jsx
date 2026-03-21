import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Plus, Trash2, Edit2, TrendingUp, TrendingDown, DollarSign, X, Filter } from "lucide-react";
import { financeApi } from "../api";
import useStore from "../store/useStore";

const CATS = ["food","transport","entertainment","health","shopping","utilities","education","other"];
const CAT_COLORS = { food:"#f97316",transport:"#06b6d4",entertainment:"#8b5cf6",health:"#10b981",shopping:"#f59e0b",utilities:"#6366f1",education:"#3b82f6",other:"#9ca3af" };
const CAT_ICONS  = { food:"🍔",transport:"🚌",entertainment:"🎬",health:"💊",shopping:"🛍️",utilities:"💡",education:"📚",other:"📦" };

function ExpenseModal({ init, onSave, onClose }) {
  const [f, setF] = useState(init || { amount:"", description:"", category:"food", date:new Date().toISOString().split("T")[0], tags:"" });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await onSave({ ...f, amount:parseFloat(f.amount), tags:f.tags?f.tags.split(",").map(t=>t.trim()).filter(Boolean):[] });
    } finally { setSaving(false); }
  };

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background:"rgba(0,0,0,0.65)", backdropFilter:"blur(8px)" }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <motion.div initial={{ scale:0.92,opacity:0,y:20 }} animate={{ scale:1,opacity:1,y:0 }}
        exit={{ scale:0.92,opacity:0,y:20 }} transition={{ type:"spring",stiffness:400,damping:30 }}
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background:"var(--bg-elevated)", border:"1px solid var(--border)", boxShadow:"0 24px 64px rgba(0,0,0,0.5)" }}>

        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom:"1px solid var(--border)" }}>
          <p className="font-bold text-sm" style={{ color:"var(--text-primary)" }}>{init?"Edit":"Add"} Expense</p>
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-4 h-4"/></button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label className="label">Amount (₹) *</label>
            <input type="number" step="0.01" min="0" className="input text-lg font-semibold"
              placeholder="0.00" required value={f.amount} onChange={e=>setF({...f,amount:e.target.value})}/>
          </div>
          <div>
            <label className="label">Description *</label>
            <input className="input" placeholder="What did you spend on?" required
              value={f.description} onChange={e=>setF({...f,description:e.target.value})}/>
          </div>
          <div>
            <label className="label">Category</label>
            <div className="grid grid-cols-4 gap-2">
              {CATS.map(cat => {
                const isActive = f.category === cat;
                const col = CAT_COLORS[cat] || "#9ca3af";
                return (
                  <button key={cat} type="button" onClick={()=>setF({...f,category:cat})}
                    className="p-2 rounded-xl text-xs font-medium flex flex-col items-center gap-1 transition-all"
                    style={{
                      background: isActive ? `${col}18` : "var(--bg-elevated)",
                      border: isActive ? `2px solid ${col}60` : "2px solid var(--border)",
                      color: isActive ? col : "var(--text-muted)",
                    }}>
                    <span>{CAT_ICONS[cat]}</span>
                    <span className="capitalize">{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Date</label>
              <input type="date" className="input" value={f.date} onChange={e=>setF({...f,date:e.target.value})}/>
            </div>
            <div>
              <label className="label">Tags</label>
              <input className="input" placeholder="lunch, work…" value={f.tags} onChange={e=>setF({...f,tags:e.target.value})}/>
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : (init?"Update":"Add Expense")}
            </button>
            <button type="button" onClick={onClose} className="btn-outline flex-1 justify-center">Cancel</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function Finance() {
  const { addToast } = useStore();
  const [expenses, setExpenses] = useState([]);
  const [comparison, setComp]   = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editExp, setEditExp]   = useState(null);
  const [filterCat, setFilter]  = useState("all");

  const [budget, setBudget] = useState(null);
  const load = () => {
    financeApi.getAll().then(r=>setExpenses(r.data)).catch(()=>{});
    financeApi.comparison().then(r=>setComp(r.data)).catch(()=>{});
    financeApi.budgetMonthly().then(r=>setBudget(r.data)).catch(()=>{});
  };
  useEffect(() => { load(); }, []);

  const handleCreate = async (d) => { await financeApi.create(d); setShowForm(false); addToast("Expense added! ✅"); load(); };
  const handleUpdate = async (d) => { await financeApi.update(editExp._id,d); setEditExp(null); addToast("Updated!"); load(); };
  const handleDelete = async (id) => {
    if (!confirm("Delete this expense?")) return;
    await financeApi.remove(id); addToast("Deleted","error"); load();
  };

  const filtered = filterCat==="all" ? expenses : expenses.filter(e=>e.category===filterCat);
  const byCat    = expenses.reduce((acc,e)=>{ acc[e.category]=(acc[e.category]||0)+e.amount; return acc; },{});
  const pieData  = Object.entries(byCat).map(([name,value])=>({ name:name.charAt(0).toUpperCase()+name.slice(1), value:Math.round(value), rawName:name }));
  const last14   = Array.from({length:14},(_,i)=>{ const d=new Date(Date.now()-(13-i)*86400000); return d.toISOString().split("T")[0]; });
  const trendData= last14.map(date=>({ date:date.slice(5), amount:expenses.filter(e=>e.date===date).reduce((s,e)=>s+e.amount,0) }));
  const total    = expenses.reduce((s,e)=>s+e.amount,0);

  const TT = ({ active, payload }) => active&&payload?.length ? (
    <div style={{ background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:10, padding:"10px 12px", fontSize:12 }}>
      {payload.map((p,i)=><p key={i} style={{ color:p.color, fontWeight:700 }}>{p.name}: ₹{p.value}</p>)}
    </div>
  ) : null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Finance Tracker</h1>
          <p className="text-sm mt-0.5" style={{ color:"var(--text-muted)" }}>Your personal spending analytics</p>
        </div>
        <button onClick={()=>{setEditExp(null);setShowForm(true);}} className="btn-primary">
          <Plus className="w-4 h-4"/> Add Expense
        </button>
      </div>

      {comparison && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label:"Today",      value:`₹${comparison.today.total.toFixed(2)}`,     sub:`${comparison.today.count} transactions`,     col:"var(--text-primary)" },
            { label:"Yesterday",  value:`₹${comparison.yesterday.total.toFixed(2)}`, sub:`${comparison.yesterday.count} transactions`,  col:"var(--text-primary)" },
            { label:"Difference", value:`₹${Math.abs(comparison.difference).toFixed(2)}`, sub: comparison.difference>0?"Spent more":"Spent less", col: comparison.difference>0?"#f87171":"#86efac", trend: comparison.difference },
          ].map(({ label, value, sub, col, trend }) => (
            <motion.div key={label} whileHover={{ y:-2 }} className="card p-5">
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color:"var(--text-muted)" }}>{label}</p>
              <div className="flex items-center gap-2">
                {trend !== undefined && (trend > 0
                  ? <TrendingUp className="w-5 h-5 flex-shrink-0" style={{ color:"#f87171" }}/>
                  : <TrendingDown className="w-5 h-5 flex-shrink-0" style={{ color:"#86efac" }}/>
                )}
                <p className="text-2xl font-black tabular-nums" style={{ color:col }}>{value}</p>
              </div>
              <p className="text-xs mt-1" style={{ color:"var(--text-muted)" }}>{sub}</p>
            </motion.div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <p className="section-title mb-4">Spending by Category</p>
          {pieData.length===0 ? (
            <div className="h-48 flex items-center justify-center text-sm" style={{ color:"var(--text-muted)" }}>
              No expense data yet — add your first expense!
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={2}>
                    {pieData.map((_,i)=><Cell key={i} fill={CAT_COLORS[_.rawName]||"#9ca3af"}/>)}
                  </Pie>
                  <Tooltip content={<TT/>}/>
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                {pieData.map(item=>(
                  <div key={item.rawName} className="flex items-center gap-1.5 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor:CAT_COLORS[item.rawName] }}/>
                    <span className="truncate" style={{ color:"var(--text-secondary)" }}>{item.name}</span>
                    <span className="font-bold ml-auto" style={{ color:"var(--text-primary)" }}>₹{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="card p-5">
          <p className="section-title mb-4">14-Day Spending Trend</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData}>
              <XAxis dataKey="date" tick={{ fontSize:10, fill:"var(--text-muted)" }} tickLine={false} axisLine={false} interval={2}/>
              <YAxis tick={{ fontSize:10, fill:"var(--text-muted)" }} tickLine={false} axisLine={false} tickFormatter={v=>`₹${v}`}/>
              <Tooltip content={<TT/>}/>
              <Line dataKey="amount" name="Spent" stroke="#22c55e" strokeWidth={2.5} dot={false} activeDot={{ r:4 }}/>
            </LineChart>
          </ResponsiveContainer>
          <p className="text-xs mt-2 text-right" style={{ color:"var(--text-muted)" }}>
            All-time: <strong style={{ color:"var(--text-primary)" }}>₹{total.toFixed(2)}</strong>
          </p>
        </div>
      </div>


      {/* Monthly Budget Overview */}
      {budget && (
        <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} className="card p-5">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div>
              <p className="section-title">Monthly Budget — {budget.month}</p>
              <p className="text-xs mt-0.5" style={{ color:"var(--text-muted)" }}>
                {new Date().toLocaleDateString("en-IN",{month:"long"})} spending overview
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            {[
              { label:"Spent This Month", value:`₹${Math.round(budget.totalSpent)}`, color:"var(--accent)" },
              { label:"Daily Average",    value:`₹${budget.dailyAvg}`,               color:"var(--green)" },
              { label:"Projected Total",  value:`₹${budget.projectedMonthly}`,        color:"var(--amber)" },
            ].map(({ label, value, color }) => (
              <div key={label} className="p-3 rounded-xl" style={{ background:"var(--bg-elevated)", border:"1px solid var(--border)" }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color:"var(--text-muted)" }}>{label}</p>
                <p className="num text-xl font-black" style={{ color }}>{value}</p>
              </div>
            ))}
          </div>
          {/* Category bars */}
          {Object.entries(budget.byCat||{}).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([cat,amt]) => {
            const pct = budget.totalSpent>0 ? Math.round(amt/budget.totalSpent*100) : 0;
            return (
              <div key={cat} className="mb-2.5">
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color:"var(--text-secondary)", fontWeight:600, textTransform:"capitalize" }}>{cat}</span>
                  <span className="num font-bold" style={{ color:"var(--text-primary)" }}>₹{Math.round(amt)} <span style={{ color:"var(--text-muted)" }}>({pct}%)</span></span>
                </div>
                <div className="progress-bar">
                  <motion.div className="progress-fill" initial={{ width:0 }} animate={{ width:`${pct}%` }}
                    transition={{ duration:0.8, ease:"easeOut" }}
                    style={{ background:"linear-gradient(90deg,var(--accent),var(--purple))" }}/>
                </div>
              </div>
            );
          })}
        </motion.div>
      )}

      <div className="card overflow-hidden">
        <div className="p-5 flex items-center justify-between flex-wrap gap-3" style={{ borderBottom:"1px solid var(--border)" }}>
          <p className="section-title">All Expenses ({filtered.length})</p>
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5" style={{ color:"var(--text-muted)" }}/>
            <select className="input w-auto text-xs py-1.5 px-3" value={filterCat} onChange={e=>setFilter(e.target.value)}>
              <option value="all">All Categories</option>
              {CATS.map(c=><option key={c} value={c}>{CAT_ICONS[c]} {c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
            </select>
          </div>
        </div>

        {filtered.length===0 ? (
          <div className="text-center py-12">
            <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-20" style={{ color:"var(--text-muted)" }}/>
            <p className="text-sm" style={{ color:"var(--text-muted)" }}>No expenses yet — add your first one!</p>
          </div>
        ) : (
          <div style={{ borderTop:"1px solid var(--border)" }}>
            <AnimatePresence>
              {filtered.map(exp=>(
                <motion.div key={exp._id} initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0,height:0 }}
                  className="flex items-center gap-3 px-5 py-3.5 group transition-colors"
                  style={{ borderBottom:"1px solid var(--border)" }}
                  onMouseEnter={e=>e.currentTarget.style.background="var(--bg-elevated)"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                    style={{ background:`${CAT_COLORS[exp.category]||"#9ca3af"}18` }}>
                    {CAT_ICONS[exp.category]||"📦"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color:"var(--text-primary)" }}>{exp.description}</p>
                    <p className="text-xs mt-0.5 capitalize" style={{ color:"var(--text-muted)" }}>{exp.category} · {exp.date}</p>
                  </div>
                  <span className="font-bold text-sm tabular-nums" style={{ color:CAT_COLORS[exp.category]||"#9ca3af" }}>
                    ₹{exp.amount.toFixed(2)}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={()=>setEditExp(exp)} className="btn-ghost p-1.5 hover:text-indigo-400"><Edit2 className="w-3.5 h-3.5"/></button>
                    <button onClick={()=>handleDelete(exp._id)} className="btn-ghost p-1.5 hover:text-red-400"><Trash2 className="w-3.5 h-3.5"/></button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AnimatePresence>
        {(showForm||editExp) && (
          <ExpenseModal
            init={editExp?{...editExp,tags:editExp.tags?.join(", ")||""}:null}
            onSave={editExp?handleUpdate:handleCreate}
            onClose={()=>{setShowForm(false);setEditExp(null);}}/>
        )}
      </AnimatePresence>
    </div>
  );
}
