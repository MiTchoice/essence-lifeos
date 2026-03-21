import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { CheckCircle, Clock, DollarSign, TrendingUp, Target, Zap, Activity, BarChart2, ArrowUpRight, ArrowDownRight, Sparkles, Brain, Calendar, Award } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { dashboardApi, tasksApi, financeApi } from "../api";
import useStore from "../store/useStore";

const PIE_COLORS = ["#6c72ff","#23d18b","#ffb547","#ff5f7e","#a78bfa","#38bdf8","#f97316"];

const stagger = { hidden:{}, visible:{ transition:{ staggerChildren:0.06 } } };
const fadeUp  = { hidden:{ opacity:0, y:18 }, visible:{ opacity:1, y:0, transition:{ duration:0.38, ease:[0.22,1,0.36,1] } } };

const TT = ({ active, payload, label }) =>
  active && payload?.length ? (
    <div style={{ background:"var(--bg-elevated)", border:"1px solid var(--border-strong)", borderRadius:12,
      padding:"10px 14px", boxShadow:"0 12px 40px rgba(0,0,0,0.4)", fontSize:11 }}>
      {label && <p style={{ color:"var(--text-muted)", marginBottom:4, letterSpacing:"0.06em", textTransform:"uppercase", fontSize:10 }}>{label}</p>}
      {payload.map((p,i) => (
        <p key={i} style={{ color:p.color, fontWeight:700 }}>{p.name}: <span style={{ color:"var(--text-primary)" }}>{p.value}</span></p>
      ))}
    </div>
  ) : null;

/* ── KPI Card ── */
function KPI({ label, value, sub, icon, gradient, glow, trend }) {
  const Icon = icon;
  return (
    <motion.div variants={fadeUp}
      whileHover={{ y:-3, scale:1.015 }}
      transition={{ duration:0.16, ease:"easeOut" }}
      className="card stat-number"
      style={{ padding:18, position:"relative", overflow:"hidden", cursor:"default" }}>
      {/* Ambient top-right glow */}
      <div style={{ position:"absolute", top:-20, right:-20, width:80, height:80, borderRadius:"50%",
        background:`radial-gradient(circle, ${glow} 0%, transparent 70%)`, opacity:0.6, pointerEvents:"none" }}/>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
        <p className="label" style={{ marginBottom:0 }}>{label}</p>
        <motion.div whileHover={{ scale:1.15, rotate:10 }} transition={{ type:"spring", stiffness:400 }}
          style={{ width:34, height:34, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center",
            background:gradient, boxShadow:`0 0 16px ${glow}`, flexShrink:0 }}>
          <Icon style={{ width:16, height:16, color:"white" }}/>
        </motion.div>
      </div>
      <p className="num" style={{ fontSize:26, fontWeight:900, color:"var(--text-primary)", letterSpacing:"-0.03em", lineHeight:1 }}>
        {value}
      </p>
      <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:4 }}>
        {trend !== undefined && (
          <span style={{ display:"flex", alignItems:"center", gap:2, fontSize:11, fontWeight:700,
            color: trend >= 0 ? "var(--green)" : "var(--red)" }}>
            {trend >= 0 ? <ArrowUpRight style={{ width:12, height:12 }}/> : <ArrowDownRight style={{ width:12, height:12 }}/>}
          </span>
        )}
        {sub && <p style={{ fontSize:11, color:"var(--text-muted)" }}>{sub}</p>}
      </div>
    </motion.div>
  );
}

/* ── Progress ring ── */
function RingChart({ value, max, color, label }) {
  const pct  = max>0 ? Math.min(100, Math.round(value/max*100)) : 0;
  const r    = 32, circ = 2*Math.PI*r;
  const dash = circ*(1-pct/100);
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
      <div style={{ position:"relative", width:80, height:80 }}>
        <svg width="80" height="80" viewBox="0 0 80 80" style={{ transform:"rotate(-90deg)" }}>
          <circle cx="40" cy="40" r={r} fill="none" stroke="var(--bg-hover)" strokeWidth="7"/>
          <motion.circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="7"
            strokeLinecap="round" strokeDasharray={circ}
            initial={{ strokeDashoffset:circ }}
            animate={{ strokeDashoffset:dash }}
            transition={{ duration:1.2, ease:"easeOut", delay:0.3 }}
            style={{ filter:`drop-shadow(0 0 6px ${color}60)` }}/>
        </svg>
        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <span className="num" style={{ fontSize:16, fontWeight:900, color:"var(--text-primary)" }}>{pct}%</span>
        </div>
      </div>
      <p style={{ fontSize:11, color:"var(--text-muted)", fontWeight:600, textAlign:"center" }}>{label}</p>
    </div>
  );
}

/* ── Empty state ── */
function EmptyDashboard() {
  const navigate = useNavigate();
  const { user } = useStore();
  const steps = [
    { emoji:"✅", label:"Add your first task",    desc:"Prioritise your goals",          path:"/tasks",   btn:"Open Tasks",  grad:"linear-gradient(135deg,#6c72ff,#8b5cf6)" },
    { emoji:"⏱️", label:"Start tracking time",    desc:"Measure productive hours",       path:"/time",    btn:"Start Timer", grad:"linear-gradient(135deg,#a78bfa,#38bdf8)" },
    { emoji:"💰", label:"Log your spending",      desc:"Track daily expenses",           path:"/finance", btn:"Add Expense", grad:"linear-gradient(135deg,#23d18b,#38bdf8)" },
  ];
  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-8 max-w-2xl mx-auto pt-6">
      <motion.div variants={fadeUp} style={{ textAlign:"center" }}>
        <motion.div animate={{ float:["0px","−8px","0px"] }} transition={{ duration:3, repeat:Infinity, ease:"easeInOut" }}
          style={{ width:72, height:72, borderRadius:22, margin:"0 auto 16px", display:"flex", alignItems:"center", justifyContent:"center",
            background:"linear-gradient(135deg,var(--accent),#8b5cf6)", boxShadow:"0 0 40px var(--accent-glow)" }}>
          <Sparkles style={{ width:30, height:30, color:"white" }}/>
        </motion.div>
        <h1 style={{ fontSize:28, fontWeight:900, letterSpacing:"-0.025em", color:"var(--text-primary)" }}>
          Welcome, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p style={{ marginTop:8, fontSize:14, color:"var(--text-muted)" }}>
          Your dashboard is live. Add data to unlock full analytics.
        </p>
      </motion.div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
        {steps.map((s,i) => (
          <motion.div key={i} variants={fadeUp} whileHover={{ y:-5, scale:1.02 }}
            className="card-hover" style={{ padding:20, cursor:"pointer" }}
            onClick={() => navigate(s.path)}>
            <div style={{ fontSize:32, marginBottom:10 }}>{s.emoji}</div>
            <p style={{ fontWeight:800, fontSize:13, color:"var(--text-primary)", marginBottom:4 }}>{s.label}</p>
            <p style={{ fontSize:11, color:"var(--text-muted)", marginBottom:14 }}>{s.desc}</p>
            <button style={{ background:s.grad, color:"white", border:"none", borderRadius:9,
              padding:"7px 14px", fontSize:12, fontWeight:700, cursor:"pointer",
              boxShadow:"0 4px 14px rgba(0,0,0,0.25)", transition:"all 0.13s ease" }}>
              {s.btn} →
            </button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* ── Skeleton ── */
function SkeletonDash() {
  return (
    <div className="space-y-5">
      <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:12 }}>
        {Array(6).fill(0).map((_,i) => (
          <div key={i} className="card" style={{ padding:18 }}>
            <div className="skeleton" style={{ height:10, width:"60%", marginBottom:12 }}/>
            <div className="skeleton" style={{ height:26, width:"70%" }}/>
          </div>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"3fr 2fr", gap:14 }}>
        <div className="card" style={{ padding:20 }}>
          <div className="skeleton" style={{ height:12, width:140, marginBottom:16 }}/>
          <div className="skeleton" style={{ height:180, borderRadius:12 }}/>
        </div>
        <div className="card" style={{ padding:20 }}>
          <div className="skeleton" style={{ height:12, width:100, marginBottom:16 }}/>
          <div className="skeleton" style={{ height:180, borderRadius:12 }}/>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data,    setData]    = useState(null);
  const [stats,   setStats]   = useState(null);
  const [budget,  setBudget]  = useState(null);
  const [loading, setLoading] = useState(true);
  const { user }              = useStore();

  useEffect(() => {
    Promise.all([
      dashboardApi.get(),
      tasksApi.stats().catch(() => null),
      financeApi.budgetMonthly().catch(() => null),
    ]).then(([d, s, b]) => {
      setData(d.data); setStats(s?.data); setBudget(b?.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <SkeletonDash/>;

  const kpis    = data?.kpis || {};
  const hasData = kpis.totalTasks > 0 || kpis.productiveMinutes > 0 || kpis.todaySpending > 0;
  if (!hasData) return <EmptyDashboard/>;

  const h = new Date().getHours();
  const greeting = h<5?"Late Night":h<12?"Morning":h<17?"Afternoon":"Evening";
  const greetEmoji = h<5?"🌙":h<12?"☀️":h<17?"⚡":"🌆";

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-5">

      {/* Header */}
      <motion.div variants={fadeUp} style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", flexWrap:"wrap", gap:8 }}>
        <div>
          <p style={{ fontSize:13, color:"var(--text-muted)", fontWeight:600 }}>
            Good {greeting} {greetEmoji}
          </p>
          <h1 style={{ fontSize:32, fontWeight:900, letterSpacing:"-0.035em", color:"var(--text-primary)", lineHeight:1.1 }}>
            {user?.name?.split(" ")[0]}
          </h1>
        </div>
        {stats && (
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {[
              { label:"Overdue", val:stats.overdue, color:"var(--red)", bg:"rgba(255,95,126,0.1)" },
              { label:"Due Today", val:stats.dueToday, color:"var(--amber)", bg:"rgba(255,181,71,0.1)" },
              { label:"Done Today", val:stats.completedToday, color:"var(--green)", bg:"rgba(35,209,139,0.1)" },
            ].filter(x=>x.val>0).map(x=>(
              <div key={x.label} style={{ padding:"5px 12px", borderRadius:20, background:x.bg,
                border:`1px solid ${x.color}30`, display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ fontSize:12, fontWeight:900, color:x.color }}>{x.val}</span>
                <span style={{ fontSize:11, color:"var(--text-muted)" }}>{x.label}</span>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <KPI icon={Target}      label="Total Tasks"  value={kpis.totalTasks||0}               gradient="linear-gradient(135deg,#6c72ff,#8b5cf6)" glow="rgba(108,114,255,0.4)" sub="all time" />
          <KPI icon={CheckCircle} label="Done Today"   value={kpis.completedToday||0}            gradient="linear-gradient(135deg,#23d18b,#10b981)" glow="rgba(35,209,139,0.4)"  sub="completed" />
          <KPI icon={Zap}         label="Pending"      value={kpis.incompleteTasks||0}           gradient="linear-gradient(135deg,#ffb547,#f59e0b)" glow="rgba(255,181,71,0.4)"  sub="to do" />
          <KPI icon={Clock}       label="Productive"   value={`${kpis.productiveMinutes||0}m`}   gradient="linear-gradient(135deg,#a78bfa,#6c72ff)" glow="rgba(167,139,250,0.4)" sub="today" />
          <KPI icon={DollarSign}  label="Spent Today"  value={`₹${kpis.todaySpending||0}`}      gradient="linear-gradient(135deg,#ff5f7e,#e0365a)" glow="rgba(255,95,126,0.4)"  sub="expenses" />
          <KPI icon={TrendingUp}  label="Completion"   value={`${kpis.taskCompletionRate||0}%`}  gradient="linear-gradient(135deg,#38bdf8,#0284c7)" glow="rgba(56,189,248,0.4)"  sub="rate" />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <motion.div variants={fadeUp} className="card lg:col-span-3" style={{ padding:20 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
            <div>
              <p className="section-title">Time Tracking</p>
              <p style={{ fontSize:11, color:"var(--text-muted)", marginTop:2 }}>30-day productive vs unproductive</p>
            </div>
            <BarChart2 style={{ width:16, height:16, color:"var(--text-muted)" }}/>
          </div>
          <ResponsiveContainer width="100%" height={185}>
            <BarChart data={data?.timeChart||[]} barGap={2} barCategoryGap="25%">
              <XAxis dataKey="date" tick={{ fontSize:9, fill:"var(--text-muted)", fontFamily:"inherit" }} tickLine={false} axisLine={false} interval={6}/>
              <YAxis tick={{ fontSize:9, fill:"var(--text-muted)", fontFamily:"inherit" }} tickLine={false} axisLine={false}/>
              <Tooltip content={<TT/>}/>
              <Bar dataKey="productive"   name="Productive"   fill="var(--accent)" radius={[3,3,0,0]} maxBarSize={9}/>
              <Bar dataKey="unproductive" name="Unproductive" fill="var(--red)"    radius={[3,3,0,0]} maxBarSize={9}/>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div variants={fadeUp} className="card lg:col-span-2" style={{ padding:20 }}>
          <p className="section-title" style={{ marginBottom:4 }}>Task Status</p>
          <p style={{ fontSize:11, color:"var(--text-muted)", marginBottom:16 }}>Breakdown of all tasks</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={data?.taskStatus||[]} cx="50%" cy="50%" innerRadius={44} outerRadius={68}
                dataKey="value" paddingAngle={3}
                label={({ name, value }) => value > 0 ? `${name.slice(0,4)} ${value}` : ""}
                labelLine={false}>
                {(data?.taskStatus||[]).map((_,i) => <Cell key={i} fill={PIE_COLORS[i]}/>)}
              </Pie>
              <Tooltip formatter={(v,n) => [v, n]}
                contentStyle={{ background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:10, fontSize:11 }}/>
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Charts row 2 + Rings */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <motion.div variants={fadeUp} className="card lg:col-span-3" style={{ padding:20 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
            <div>
              <p className="section-title">Daily Spending</p>
              <p style={{ fontSize:11, color:"var(--text-muted)", marginTop:2 }}>30-day expense trend</p>
            </div>
            <DollarSign style={{ width:16, height:16, color:"var(--text-muted)" }}/>
          </div>
          <ResponsiveContainer width="100%" height={185}>
            <AreaChart data={data?.expenseChart||[]}>
              <defs>
                <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="var(--green)" stopOpacity={0.35}/>
                  <stop offset="100%" stopColor="var(--green)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize:9, fill:"var(--text-muted)", fontFamily:"inherit" }} tickLine={false} axisLine={false} interval={6}/>
              <YAxis tick={{ fontSize:9, fill:"var(--text-muted)", fontFamily:"inherit" }} tickLine={false} axisLine={false}/>
              <Tooltip content={<TT/>}/>
              <Area dataKey="amount" name="₹ Spent" stroke="var(--green)" strokeWidth={2.5}
                fill="url(#spendGrad)" dot={false} activeDot={{ r:5, fill:"var(--green)", stroke:"var(--bg-elevated)", strokeWidth:2 }}/>
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div variants={fadeUp} className="card lg:col-span-2" style={{ padding:20 }}>
          <p className="section-title" style={{ marginBottom:4 }}>Performance Rings</p>
          <p style={{ fontSize:11, color:"var(--text-muted)", marginBottom:20 }}>Key ratios at a glance</p>
          <div style={{ display:"flex", justifyContent:"space-around", alignItems:"center" }}>
            <RingChart value={kpis.taskCompletionRate||0} max={100} color="var(--accent)" label="Task Rate"/>
            <RingChart value={kpis.completedToday||0} max={Math.max(1,kpis.totalTasks||1)} color="var(--green)" label="Done Today"/>
            <RingChart value={kpis.productiveMinutes||0} max={Math.max(1,120)} color="var(--purple)" label="Productivity"/>
          </div>
          {budget && (
            <div style={{ marginTop:16, paddingTop:14, borderTop:"1px solid var(--border)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                <span style={{ fontSize:11, color:"var(--text-muted)" }}>Monthly spend</span>
                <span className="num" style={{ fontSize:12, fontWeight:700, color:"var(--text-primary)" }}>
                  ₹{Math.round(budget.totalSpent)}
                </span>
              </div>
              <div className="progress-bar">
                <motion.div className="progress-fill"
                  style={{ background:"linear-gradient(90deg,var(--green),var(--cyan))", width:0 }}
                  animate={{ width:`${Math.min(100, Math.round(budget.totalSpent/(budget.projectedMonthly||1)*100))}%` }}
                  transition={{ duration:1, ease:"easeOut", delay:0.5 }}/>
              </div>
              <p style={{ fontSize:10, color:"var(--text-muted)", marginTop:4 }}>
                ₹{budget.dailyAvg}/day avg · ₹{budget.projectedMonthly} projected
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Finance pie + Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <motion.div variants={fadeUp} className="card lg:col-span-2" style={{ padding:20 }}>
          <p className="section-title" style={{ marginBottom:4 }}>Spending Categories</p>
          <p style={{ fontSize:11, color:"var(--text-muted)", marginBottom:12 }}>Where your money goes</p>
          {(data?.expensePie||[]).length === 0 ? (
            <div style={{ height:140, display:"flex", alignItems:"center", justifyContent:"center",
              color:"var(--text-muted)", fontSize:13 }}>No expenses yet</div>
          ) : <>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={data.expensePie} cx="50%" cy="50%" innerRadius={35} outerRadius={62} dataKey="value" paddingAngle={3}>
                  {data.expensePie.map((_,i) => <Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
                </Pie>
                <Tooltip formatter={v=>`₹${v}`}
                  contentStyle={{ background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:10, fontSize:11 }}/>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display:"flex", flexWrap:"wrap", gap:"4px 12px", marginTop:8 }}>
              {data.expensePie.slice(0,4).map((item,i) => (
                <div key={item.name} style={{ display:"flex", alignItems:"center", gap:5 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", backgroundColor:PIE_COLORS[i%PIE_COLORS.length] }}/>
                  <span style={{ fontSize:10, color:"var(--text-muted)" }}>{item.name} <strong style={{ color:"var(--text-secondary)" }}>₹{item.value}</strong></span>
                </div>
              ))}
            </div>
          </>}
        </motion.div>

        <motion.div variants={fadeUp} className="card lg:col-span-3" style={{ padding:20 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
            <div style={{ width:28, height:28, borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center",
              background:"rgba(108,114,255,0.14)", border:"1px solid rgba(108,114,255,0.25)" }}>
              <Activity style={{ width:14, height:14, color:"var(--accent)" }}/>
            </div>
            <div>
              <p className="section-title">Productivity Heatmap</p>
              <p style={{ fontSize:10, color:"var(--text-muted)" }}>90-day activity grid</p>
            </div>
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:3 }}>
            {(data?.heatmap||[]).map((d,i) => {
              const opac = [0.06,0.2,0.45,0.72,1][Math.min(d.count,4)];
              return (
                <motion.div key={i} whileHover={{ scale:1.4 }} transition={{ duration:0.1 }}
                  title={`${d.date}: ${d.count*25}min`}
                  style={{ width:11, height:11, borderRadius:3, cursor:"default",
                    backgroundColor:`rgba(108,114,255,${opac})`,
                    boxShadow: d.count>=4 ? "0 0 4px rgba(108,114,255,0.6)" : "none" }}/>
              );
            })}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:10 }}>
            <span style={{ fontSize:10, color:"var(--text-muted)" }}>Less</span>
            {[0.06,0.2,0.45,0.72,1].map((o,i)=>(
              <div key={i} style={{ width:11, height:11, borderRadius:3, backgroundColor:`rgba(108,114,255,${o})` }}/>
            ))}
            <span style={{ fontSize:10, color:"var(--text-muted)" }}>More</span>
          </div>
        </motion.div>
      </div>

    </motion.div>
  );
}
