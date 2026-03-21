import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, Lightbulb, TrendingUp, RefreshCw, User, Zap, AlertTriangle, Cpu, Sparkles, Brain, Calendar, Clock, DollarSign, Target, BarChart2 } from "lucide-react";
import { aiApi } from "../api";
import useStore from "../store/useStore";

/* ── Typing dots ── */
function Dots() {
  return (
    <div className="flex items-center gap-1 py-0.5">
      {[0,1,2].map(i=>(
        <motion.span key={i} className="block w-2 h-2 rounded-full"
          style={{ backgroundColor:"var(--accent)" }}
          animate={{ scale:[1,1.6,1], opacity:[0.3,1,0.3] }}
          transition={{ duration:0.8, repeat:Infinity, delay:i*0.18 }}/>
      ))}
    </div>
  );
}

/* ── Markdown renderer ── */
function Markdown({ text }) {
  if (!text) return null;
  return (
    <div className="space-y-1 text-sm leading-relaxed">
      {text.split("\n").map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1.5"/>;
        if (line.startsWith("##")) return (
          <p key={i} className="font-black text-sm mt-3 mb-0.5" style={{ color:"var(--text-primary)", fontSize:14 }}>
            {line.replace(/^#+\s*/,"")}
          </p>
        );
        // Bold segments
        const parts = line.split(/(\*\*[^*]+\*\*)/g).map((p,j) =>
          p.startsWith("**") && p.endsWith("**")
            ? <strong key={j} style={{ color:"var(--text-primary)", fontWeight:800 }}>{p.slice(2,-2)}</strong>
            : <span key={j}>{p}</span>
        );
        // Numbered list
        if (/^\d+\./.test(line)) return (
          <div key={i} className="flex gap-2.5 items-start" style={{ color:"var(--text-secondary)" }}>
            <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black mt-0.5"
              style={{ background:"var(--accent-glow)", color:"var(--accent)", border:"1px solid rgba(99,102,241,0.3)" }}>
              {line.match(/^(\d+)\./)[1]}
            </span>
            <span>{parts.map((p,j)=>React.isValidElement(p)?p:<span key={j}>{typeof p==="string"?p.replace(/^\d+\.\s*/,""):p}</span>)}</span>
          </div>
        );
        // Bullet
        if (line.startsWith("• ") || line.startsWith("* ")) return (
          <div key={i} className="flex gap-2 items-start" style={{ color:"var(--text-secondary)" }}>
            <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
              style={{ background:"var(--accent)", boxShadow:"0 0 4px var(--accent-glow)" }}/>
            <span>{parts.map((p,j)=>React.isValidElement(p)?p:<span key={j}>{typeof p==="string"?p.replace(/^[•*]\s*/,""):p}</span>)}</span>
          </div>
        );
        return <p key={i} style={{ color:"var(--text-secondary)" }}>{parts}</p>;
      })}
    </div>
  );
}

/* ── Quick prompt buttons — each sends the EXACT keyword the backend matches ── */
const QUICK = [
  { label:"My tasks",      icon:Target,    q:"What tasks should I work on today?",         color:"#818cf8" },
  { label:"Productivity",  icon:Clock,     q:"How productive am I today? Show time stats", color:"#c4b5fd" },
  { label:"Spending",      icon:DollarSign,q:"Analyse my spending and expenses",            color:"#fcd34d" },
  { label:"Full overview", icon:BarChart2, q:"Give me my full overview and performance summary", color:"#67e8f9" },
  { label:"Tips for me",   icon:Brain,     q:"Give me personalised tips and habits to improve", color:"#f9a8d4" },
  { label:"Schedule",      icon:Calendar,  q:"What's on my schedule and upcoming deadlines?",   color:"#86efac" },
];

export default function AIAssistant() {
  const { tasks, user } = useStore();
  const h = new Date().getHours();
  const greet = h<12?"morning":h<17?"afternoon":"evening";

  const [messages, setMessages] = useState([{
    role:"assistant",
    content:`Good ${greet}, **${user?.name?.split(" ")[0]||"there"}**! 👋\n\nI'm ESSENCE AI — I read your **live data** (tasks, time logs, expenses, calendar) to give you real answers.\n\nPick a quick topic below or ask me anything:`,
  }]);
  const [q,       setQ]       = useState("");
  const [sending, setSending] = useState(false);
  const [sugg,    setSugg]    = useState(null); const [loadS, setLoadS] = useState(false);
  const [pred,    setPred]    = useState(null); const [loadP, setLoadP] = useState(false);
  const endRef = useRef(null);
  const inRef  = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  const loadSugg = () => { setLoadS(true); aiApi.suggestions().then(r=>setSugg(r.data)).catch(()=>{}).finally(()=>setLoadS(false)); };
  const loadPred = () => { setLoadP(true); aiApi.predictions().then(r=>setPred(r.data)).catch(()=>{}).finally(()=>setLoadP(false)); };
  useEffect(() => { loadSugg(); loadPred(); }, []);

  const send = async (txt) => {
    const text = (txt||q).trim(); if (!text||sending) return;
    setMessages(m=>[...m,{ role:"user", content:text }]);
    setQ(""); setSending(true);
    try {
      const r = await aiApi.ask(text, {
        incompleteTasks: tasks.filter(t=>t.status==="incomplete").length,
        urgentTasks:     tasks.filter(t=>t.priority==="urgent"&&t.status==="incomplete").length,
      });
      setMessages(m=>[...m,{ role:"assistant", content:r.data?.answer||"I couldn't process that. Please try again." }]);
    } catch(err) {
      const errMsg = err?.error || err?.message || "Unknown error";
      const isNetwork = errMsg.includes("Network") || errMsg.includes("timeout") || errMsg.includes("ECONNREFUSED");
      setMessages(m=>[...m,{ role:"assistant", content:
        isNetwork
          ? "⚠️ **Cannot reach backend.** Make sure the backend is running:\n\n1. Open `START_BACKEND.bat`\n2. Wait for ✅ MongoDB Atlas connected\n3. Then try again"
          : `⚠️ **Error:** ${errMsg}\n\nIf this persists, restart the backend.`
      }]);
    } finally { setSending(false); inRef.current?.focus(); }
  };

  return (
    <div className="space-y-5 max-w-5xl">

      {/* Header */}
      <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">AI Assistant</h1>
          <p className="text-sm mt-0.5" style={{ color:"var(--text-muted)" }}>
            Reads your live data · Personalised for {user?.name?.split(" ")[0]}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
          style={{ background:"rgba(99,102,241,0.1)", border:"1px solid rgba(99,102,241,0.25)" }}>
          <Cpu className="w-3.5 h-3.5" style={{ color:"var(--accent)" }}/>
          <span className="text-xs font-bold" style={{ color:"var(--accent)" }}>Live Data AI</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-1"/>
        </div>
      </motion.div>

      {/* Suggestions + Predictions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Smart Suggestions */}
        <motion.div initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.05 }} className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background:"rgba(245,158,11,0.12)", border:"1px solid rgba(245,158,11,0.25)" }}>
                <Lightbulb className="w-4 h-4 text-amber-400"/>
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color:"var(--text-primary)" }}>Smart Recommendations</p>
                <p className="text-xs" style={{ color:"var(--text-muted)" }}>Based on your live data</p>
              </div>
            </div>
            <motion.button onClick={loadSugg} className="btn-ghost p-2" whileTap={{ scale:0.9 }}>
              <RefreshCw className={`w-3.5 h-3.5 ${loadS?"animate-spin":""}`}/>
            </motion.button>
          </div>

          {loadS ? (
            <div className="space-y-2">
              {[88,72,80,65].map((w,i)=><div key={i} className="skeleton h-10 rounded-xl" style={{ width:`${w}%` }}/>)}
            </div>
          ) : !sugg ? (
            <div className="text-center py-6">
              <Sparkles className="w-6 h-6 mx-auto mb-2 opacity-30" style={{ color:"var(--text-muted)" }}/>
              <p className="text-sm" style={{ color:"var(--text-muted)" }}>Click refresh to load your personalised tips</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {(sugg.suggestions||[]).map((s,i)=>(
                <motion.div key={i} initial={{ opacity:0, x:-6 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.06 }}
                  className="flex gap-2.5 p-3 rounded-xl"
                  style={{ background:"var(--bg-elevated)", border:"1px solid var(--border)" }}>
                  <span className="w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-black"
                    style={{ background:"rgba(99,102,241,0.15)", color:"var(--accent)" }}>{i+1}</span>
                  <p className="text-xs leading-relaxed" style={{ color:"var(--text-secondary)" }}>{s}</p>
                </motion.div>
              ))}
              {(sugg.habits||[]).length>0 && (
                <div className="pt-3 mt-1" style={{ borderTop:"1px solid var(--border)" }}>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-2.5" style={{ color:"var(--text-muted)" }}>
                    Habits to Build
                  </p>
                  {sugg.habits.map((h,i)=>(
                    <div key={i} className="flex gap-2 text-xs mb-2" style={{ color:"var(--text-secondary)" }}>
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5"/>
                      <span className="leading-relaxed">{h}</span>
                    </div>
                  ))}
                </div>
              )}
              {sugg.meta && (
                <div className="flex gap-2 flex-wrap pt-2">
                  {Object.entries(sugg.meta).map(([k,v])=>(
                    <span key={k} className="text-[10px] px-2.5 py-1 rounded-full font-semibold"
                      style={{ background:"rgba(99,102,241,0.1)", color:"var(--text-secondary)", border:"1px solid rgba(99,102,241,0.2)" }}>
                      {k.replace(/([A-Z])/g," $1").trim()}: {v}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Tomorrow's Forecast */}
        <motion.div initial={{ opacity:0, x:10 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.08 }} className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background:"rgba(99,102,241,0.1)", border:"1px solid rgba(99,102,241,0.25)" }}>
                <TrendingUp className="w-4 h-4" style={{ color:"var(--accent)" }}/>
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color:"var(--text-primary)" }}>Tomorrow's Forecast</p>
                <p className="text-xs" style={{ color:"var(--text-muted)" }}>7-day pattern prediction</p>
              </div>
            </div>
            <motion.button onClick={loadPred} className="btn-ghost p-2" whileTap={{ scale:0.9 }}>
              <RefreshCw className={`w-3.5 h-3.5 ${loadP?"animate-spin":""}`}/>
            </motion.button>
          </div>

          {loadP ? (
            <div className="space-y-3">
              {[1,2,3].map(i=><div key={i} className="skeleton h-14 rounded-xl"/>)}
            </div>
          ) : !pred ? (
            <div className="text-center py-6">
              <TrendingUp className="w-6 h-6 mx-auto mb-2 opacity-30" style={{ color:"var(--text-muted)" }}/>
              <p className="text-sm" style={{ color:"var(--text-muted)" }}>Click refresh to see predictions</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pred.predictedTimeUsage && (
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label:"Productive",   val:`${pred.predictedTimeUsage.productive}m`, bg:"rgba(34,197,94,0.08)",  border:"rgba(34,197,94,0.25)",  color:"#86efac" },
                    { label:"Unproductive", val:`${pred.predictedTimeUsage.unproductive}m`, bg:"rgba(239,68,68,0.08)", border:"rgba(239,68,68,0.25)", color:"#fca5a5" },
                  ].map(c=>(
                    <div key={c.label} className="p-3 rounded-xl" style={{ background:c.bg, border:`1px solid ${c.border}` }}>
                      <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color:c.color }}>{c.label}</p>
                      <p className="text-xl font-black tabular-nums mt-0.5" style={{ color:c.color }}>{c.val}</p>
                    </div>
                  ))}
                </div>
              )}
              {pred.predictedSpending !== undefined && (
                <div className="p-3 rounded-xl" style={{ background:"rgba(99,102,241,0.08)", border:"1px solid rgba(99,102,241,0.25)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color:"var(--accent)" }}>Predicted Spending</p>
                  <p className="text-xl font-black tabular-nums mt-0.5" style={{ color:"var(--text-primary)" }}>₹{pred.predictedSpending}</p>
                </div>
              )}
              {(pred.insights||[]).map((ins,i)=>(
                <div key={i} className="flex gap-2 text-xs" style={{ color:"var(--text-secondary)" }}>
                  <Zap className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color:"var(--accent)" }}/>
                  <span className="leading-relaxed">{ins}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Chat window */}
      <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.12 }}
        className="card overflow-hidden flex flex-col" style={{ height:520 }}>

        {/* Chat header */}
        <div className="flex items-center gap-3 px-5 py-4 flex-shrink-0" style={{ borderBottom:"1px solid var(--border)" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 relative"
            style={{ background:"linear-gradient(135deg,var(--accent),#8b5cf6)", boxShadow:"0 0 18px var(--accent-glow)" }}>
            <Bot className="w-5 h-5 text-white"/>
            {/* Online indicator */}
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2"
              style={{ borderColor:"var(--bg-card)" }}/>
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm" style={{ color:"var(--text-primary)" }}>ESSENCE AI Chat</p>
            <p className="text-xs" style={{ color:"var(--text-muted)" }}>
              Personalised for {user?.name?.split(" ")[0]} · Reads your live MongoDB data
            </p>
          </div>
          <div className="px-2.5 py-1 rounded-full text-[10px] font-black flex items-center gap-1.5"
            style={{ background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.25)", color:"#86efac" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
            LIVE
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0">
          <AnimatePresence initial={false}>
            {messages.map((m,i)=>(
              <motion.div key={i} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                transition={{ duration:0.2 }}
                className={`flex gap-2.5 ${m.role==="user"?"flex-row-reverse":""}`}>
                {/* Avatar */}
                <div className="w-7 h-7 rounded-xl flex-shrink-0 flex items-center justify-center"
                  style={m.role==="user"
                    ? { background:"linear-gradient(135deg,var(--accent),#8b5cf6)" }
                    : { background:"rgba(99,102,241,0.12)", border:"1px solid rgba(99,102,241,0.25)" }}>
                  {m.role==="user"
                    ? <User className="w-3.5 h-3.5 text-white"/>
                    : <Bot className="w-3.5 h-3.5" style={{ color:"var(--accent)" }}/>}
                </div>
                {/* Bubble */}
                <div className={`max-w-[78%] rounded-2xl px-4 py-3 ${m.role==="user"?"rounded-tr-sm":"rounded-tl-sm"}`}
                  style={m.role==="user"
                    ? { background:"linear-gradient(135deg,var(--accent),#4f46e5)", boxShadow:"0 4px 16px var(--accent-glow)" }
                    : { background:"var(--bg-elevated)", border:"1px solid var(--border)" }}>
                  {m.role==="assistant"
                    ? <Markdown text={m.content}/>
                    : <p className="text-sm text-white font-medium">{m.content}</p>}
                </div>
              </motion.div>
            ))}
            {sending && (
              <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} className="flex gap-2.5">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                  style={{ background:"rgba(99,102,241,0.12)", border:"1px solid rgba(99,102,241,0.25)" }}>
                  <Bot className="w-3.5 h-3.5" style={{ color:"var(--accent)" }}/>
                </div>
                <div className="rounded-2xl rounded-tl-sm px-4 py-3"
                  style={{ background:"var(--bg-elevated)", border:"1px solid var(--border)" }}>
                  <Dots/>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={endRef}/>
        </div>

        {/* Quick prompt buttons */}
        <div className="px-4 py-3 flex gap-2 overflow-x-auto flex-shrink-0"
          style={{ borderTop:"1px solid var(--border)", scrollbarWidth:"none" }}>
          {QUICK.map(({ label, icon:Icon, q:qTxt, color }) => (
            <motion.button key={label} onClick={() => send(qTxt)} disabled={sending}
              whileHover={{ scale:1.04, y:-1 }} whileTap={{ scale:0.95 }}
              className="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all disabled:opacity-40"
              style={{
                background:`${color}12`,
                border:`1px solid ${color}30`,
                color: color,
              }}>
              <Icon className="w-3.5 h-3.5"/>
              {label}
            </motion.button>
          ))}
        </div>

        {/* Input bar */}
        <div className="px-4 pb-4 flex gap-2.5 flex-shrink-0" style={{ paddingTop:10, borderTop:"1px solid var(--border)" }}>
          <input ref={inRef} className="input flex-1"
            placeholder="Ask about your tasks, time, spending, habits…"
            value={q} onChange={e=>setQ(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()}
            disabled={sending}
            style={{ borderRadius:14 }}/>
          <motion.button onClick={()=>send()} disabled={sending||!q.trim()}
            className="btn-primary px-4 disabled:opacity-40"
            whileHover={{ scale:1.05 }} whileTap={{ scale:0.93 }}>
            <Send className="w-4 h-4"/>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
