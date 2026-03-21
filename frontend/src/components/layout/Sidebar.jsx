import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, CheckSquare, Calendar, Timer, Wallet, Bot, Zap, ChevronLeft, GraduationCap, Sparkles } from "lucide-react";
import useStore from "../../store/useStore";

const LINKS = [
  { to:"/dashboard", icon:LayoutDashboard, label:"Dashboard",     color:"#7c8aff", glow:"rgba(124,138,255,0.3)" },
  { to:"/tasks",     icon:CheckSquare,     label:"Tasks",         color:"#23d18b", glow:"rgba(35,209,139,0.3)"  },
  { to:"/calendar",  icon:Calendar,        label:"Calendar",      color:"#38bdf8", glow:"rgba(56,189,248,0.3)"  },
  { to:"/time",      icon:Timer,           label:"Time Tracking", color:"#a78bfa", glow:"rgba(167,139,250,0.3)" },
  { to:"/finance",   icon:Wallet,          label:"Finance",       color:"#ffb547", glow:"rgba(255,181,71,0.3)"  },
  { to:"/ai",        icon:Bot,             label:"AI Assistant",  color:"#ff85a1", glow:"rgba(255,133,161,0.3)" },
];

const TEAM = [
  { name:"Mitrasen Yadav", init:"MY", color:"#6c72ff" },
  { name:"Ashish Garg",    init:"AG", color:"#23d18b" },
  { name:"Anshul Thakur",  init:"AT", color:"#a78bfa" },
];

export default function Sidebar() {
  const tasks    = useStore(s => s.tasks);
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const incomplete = tasks.filter(t => t.status === "incomplete").length;

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 248 }}
      transition={{ duration:0.22, ease:[0.4,0,0.2,1] }}
      className="relative flex-shrink-0 flex flex-col"
      style={{
        background:"var(--bg-surface)",
        borderRight:"1px solid var(--border)",
        overflow:"hidden",
        zIndex:50,
      }}>

      {/* Logo */}
      <div style={{ height:64, display:"flex", alignItems:"center", gap:12, padding:"0 14px", flexShrink:0, borderBottom:"1px solid var(--border)" }}>
        <motion.div
          whileHover={{ scale:1.08, rotate:5 }}
          transition={{ type:"spring", stiffness:400, damping:20 }}
          style={{ width:34, height:34, borderRadius:11, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
            background:"linear-gradient(135deg,var(--accent),#8b5cf6)", boxShadow:"0 0 18px var(--accent-glow)" }}>
          <Zap style={{ width:16, height:16, color:"white" }}/>
        </motion.div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-8 }}
              transition={{ duration:0.18 }} style={{ minWidth:0 }}>
              <p style={{ fontWeight:900, fontSize:15, letterSpacing:"-0.02em", lineHeight:1.1, color:"var(--text-primary)" }}>
                ESSENCE
              </p>
              <p style={{ fontSize:8.5, fontWeight:800, letterSpacing:"0.2em", textTransform:"uppercase",
                background:"linear-gradient(90deg,var(--accent),var(--green))", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
                MyLifeMyChoice
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav style={{ flex:1, padding:"8px 8px", display:"flex", flexDirection:"column", gap:2, overflowY:"auto", overflowX:"hidden" }}>
        {LINKS.map(({ to, icon:Icon, label, color, glow }) => {
          const isActive = location.pathname === to;
          return (
            <NavLink key={to} to={to} title={collapsed ? label : undefined}
              style={{ textDecoration:"none" }}>
              <motion.div
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  display:"flex", alignItems:"center", gap:10,
                  padding:"9px 10px", borderRadius:12,
                  background: isActive ? `${color}14` : "transparent",
                  border: `1px solid ${isActive ? color+"28" : "transparent"}`,
                  cursor:"pointer", position:"relative",
                  transition:"background 0.15s ease, border-color 0.15s ease",
                }}
                onMouseEnter={e=>{ if(!isActive) e.currentTarget.style.background="var(--bg-hover)"; }}
                onMouseLeave={e=>{ e.currentTarget.style.background=isActive?`${color}14`:"transparent"; }}>

                {/* Left bar indicator */}
                {isActive && (
                  <motion.div layoutId="nav-bar"
                    style={{ position:"absolute", left:0, top:"20%", bottom:"20%", width:3, borderRadius:"0 3px 3px 0",
                      background:color, boxShadow:`0 0 8px ${glow}` }}
                    transition={{ type:"spring", stiffness:420, damping:30 }}/>
                )}

                <div style={{ width:28, height:28, borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
                  background: isActive ? `${color}20` : "transparent",
                  transition:"background 0.15s ease" }}>
                  <Icon style={{ width:15, height:15, color: isActive ? color : "var(--text-muted)", flexShrink:0 }}/>
                </div>

                <AnimatePresence>
                  {!collapsed && (
                    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                      style={{ display:"flex", alignItems:"center", flex:1, gap:6, minWidth:0 }}>
                      <span style={{ fontSize:13, fontWeight:isActive?700:500, color: isActive ? color : "var(--text-secondary)",
                        flex:1, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                        {label}
                      </span>
                      {to==="/tasks" && incomplete>0 && (
                        <motion.span initial={{ scale:0 }} animate={{ scale:1 }} transition={{ type:"spring", stiffness:500 }}
                          style={{ fontSize:10, fontWeight:900, padding:"1px 6px", borderRadius:20, flexShrink:0,
                            background:`${color}20`, color, border:`1px solid ${color}35` }}>
                          {incomplete}
                        </motion.span>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </NavLink>
          );
        })}
      </nav>

      {/* Team credits */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ padding:"8px 10px", borderTop:"1px solid var(--border)" }}>
            <div style={{ borderRadius:13, padding:"10px 12px", background:"rgba(108,114,255,0.05)", border:"1px solid var(--border)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
                <GraduationCap style={{ width:11, height:11, color:"var(--accent)" }}/>
                <span style={{ fontSize:9, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.18em", color:"var(--text-muted)" }}>
                  NIT Hamirpur
                </span>
              </div>
              {TEAM.map(m => (
                <div key={m.name} style={{ display:"flex", alignItems:"center", gap:7, marginBottom:4 }}>
                  <div style={{ width:18, height:18, borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
                    background:`${m.color}18`, border:`1px solid ${m.color}35` }}>
                    <span style={{ fontSize:8, fontWeight:900, color:m.color }}>{m.init}</span>
                  </div>
                  <span style={{ fontSize:11, color:"var(--text-muted)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {m.name}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapse toggle */}
      <motion.button
        onClick={() => setCollapsed(!collapsed)}
        whileHover={{ scale:1.12 }} whileTap={{ scale:0.9 }}
        style={{ position:"absolute", top:16, right:-12, width:24, height:24, borderRadius:"50%",
          display:"flex", alignItems:"center", justifyContent:"center",
          background:"var(--bg-elevated)", border:"1px solid var(--border)",
          boxShadow:"0 2px 10px rgba(0,0,0,0.3)", cursor:"pointer", zIndex:60 }}>
        <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration:0.2 }}>
          <ChevronLeft style={{ width:12, height:12, color:"var(--text-muted)" }}/>
        </motion.div>
      </motion.button>
    </motion.aside>
  );
}
