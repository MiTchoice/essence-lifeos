import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Bell, Circle, LogOut, Sun, Moon, Monitor, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import useStore from "../../store/useStore";
import { PDFExportButton } from "../ui/PDFExport";

const TITLES = {
  "/dashboard":"Dashboard","/tasks":"Task Manager","/calendar":"Calendar",
  "/time":"Time Tracking","/finance":"Finance","/ai":"AI Assistant",
};
const ICONS = {
  "/dashboard":"📊","/tasks":"✅","/calendar":"📅","/time":"⏱️","/finance":"💰","/ai":"🤖",
};

const THEMES = [
  { id:"dark",     Icon:Moon,    label:"Dark",     desc:"Deep space"   },
  { id:"light",    Icon:Sun,     label:"Light",    desc:"Clean & bright" },
  { id:"midnight", Icon:Monitor, label:"Midnight", desc:"Pure AMOLED"  },
];

function ThemePicker() {
  const { theme, setTheme } = useStore();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const cur = THEMES.find(t=>t.id===theme) || THEMES[0];

  useEffect(() => {
    const fn = e => { if(ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  return (
    <div ref={ref} style={{ position:"relative" }}>
      <motion.button onClick={() => setOpen(o=>!o)} whileTap={{ scale:0.95 }}
        className="btn-ghost"
        style={{ gap:6, paddingLeft:10, paddingRight:10, fontSize:12 }}>
        <cur.Icon style={{ width:14, height:14 }}/>
        <span style={{ fontWeight:700 }}>{cur.label}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration:0.18 }}>
          <ChevronDown style={{ width:12, height:12 }}/>
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <div style={{ position:"fixed", inset:0, zIndex:40 }} onClick={() => setOpen(false)}/>
            <motion.div
              initial={{ opacity:0, scale:0.92, y:-6 }}
              animate={{ opacity:1, scale:1,    y:0  }}
              exit={{    opacity:0, scale:0.92, y:-6 }}
              transition={{ duration:0.14, ease:"easeOut" }}
              style={{ position:"absolute", right:0, top:"calc(100% + 8px)", width:192,
                borderRadius:14, overflow:"hidden", zIndex:9999,
                background:"var(--bg-elevated)", border:"1px solid var(--border-strong)",
                boxShadow:"0 16px 48px rgba(0,0,0,0.4)" }}>
              {THEMES.map(({ id, Icon, label, desc }) => {
                const isActive = theme === id;
                return (
                  <motion.button key={id} onClick={() => { setTheme(id); setOpen(false); }}
                    whileHover={{ background:"var(--bg-hover)" }}
                    style={{ width:"100%", display:"flex", alignItems:"center", gap:10,
                      padding:"10px 14px", textAlign:"left", cursor:"pointer", border:"none",
                      background: isActive ? "var(--accent-glow)" : "transparent",
                      transition:"background 0.12s" }}>
                    <Icon style={{ width:14, height:14, color: isActive ? "var(--accent)" : "var(--text-muted)", flexShrink:0 }}/>
                    <div style={{ flex:1 }}>
                      <p style={{ fontSize:12, fontWeight:700, color: isActive ? "var(--accent)" : "var(--text-primary)", lineHeight:1.2 }}>
                        {label}
                      </p>
                      <p style={{ fontSize:10, color:"var(--text-muted)", lineHeight:1.2 }}>{desc}</p>
                    </div>
                    {isActive && <div style={{ width:6, height:6, borderRadius:"50%", background:"var(--accent)", flexShrink:0 }}/>}
                  </motion.button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Topbar() {
  const { activeTimer, user, logout } = useStore();
  const location = useLocation();
  const navigate  = useNavigate();
  const title     = TITLES[location.pathname] || "ESSENCE";
  const emoji     = ICONS[location.pathname] || "⚡";
  const initials  = user?.name?.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase() || "U";
  const hour      = new Date().getHours();
  const greeting  = hour<12?"Morning":hour<17?"Afternoon":"Evening";

  return (
    <header style={{ height:62, flexShrink:0, display:"flex", alignItems:"center",
      justifyContent:"space-between", padding:"0 20px", gap:12,
      background:"var(--bg-surface)", borderBottom:"1px solid var(--border)",
      backdropFilter:"blur(20px)", position:"sticky", top:0, zIndex:100 }}>

      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ width:36, height:36, borderRadius:11, display:"flex", alignItems:"center", justifyContent:"center",
          background:"var(--bg-elevated)", border:"1px solid var(--border)", fontSize:16, flexShrink:0 }}>
          {emoji}
        </div>
        <div>
          <p style={{ fontWeight:800, fontSize:14, color:"var(--text-primary)", lineHeight:1.2, letterSpacing:"-0.01em" }}>
            {title}
          </p>
          <p style={{ fontSize:11, color:"var(--text-muted)", lineHeight:1.2 }}>
            Good {greeting}, {user?.name?.split(" ")[0]}
          </p>
        </div>
      </div>

      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
        {/* Active timer pill */}
        <AnimatePresence>
          {activeTimer && (
            <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.9 }}
              style={{ display:"flex", alignItems:"center", gap:7, padding:"6px 12px", borderRadius:10,
                background:"rgba(35,209,139,0.1)", border:"1px solid rgba(35,209,139,0.25)", marginRight:4 }}>
              <Circle style={{ width:8, height:8, fill:"var(--green)", color:"var(--green)", animation:"glow-pulse 2s infinite" }}/>
              <span style={{ fontSize:12, fontWeight:700, color:"var(--green)", maxWidth:120, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {activeTimer.taskTitle}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <ThemePicker/>
        <PDFExportButton/>

        <motion.button className="btn-icon" whileTap={{ scale:0.9 }}>
          <Bell style={{ width:16, height:16 }}/>
        </motion.button>

        {/* User section */}
        <div style={{ display:"flex", alignItems:"center", gap:8, paddingLeft:12, marginLeft:4, borderLeft:"1px solid var(--border)" }}>
          <motion.div whileHover={{ scale:1.05 }}
            style={{ width:34, height:34, borderRadius:11, display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:12, fontWeight:900, color:"white", flexShrink:0,
              background:"linear-gradient(135deg,var(--accent),#8b5cf6)", boxShadow:"0 0 14px var(--accent-glow)" }}>
            {initials}
          </motion.div>
          <div className="hidden sm:block">
            <p style={{ fontSize:12, fontWeight:700, color:"var(--text-primary)", lineHeight:1.2, maxWidth:96,
              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user?.name}</p>
            <p style={{ fontSize:10, color:"var(--text-muted)", lineHeight:1.2, maxWidth:96,
              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user?.email}</p>
          </div>
          <motion.button onClick={() => { logout(); navigate("/auth"); }} title="Sign out"
            className="btn-icon" whileTap={{ scale:0.9 }}
            style={{ color:"var(--text-muted)" }}
            onMouseEnter={e=>{e.currentTarget.style.color="var(--red)"; e.currentTarget.style.background="rgba(255,95,126,0.1)";}}
            onMouseLeave={e=>{e.currentTarget.style.color="var(--text-muted)"; e.currentTarget.style.background="transparent";}}>
            <LogOut style={{ width:14, height:14 }}/>
          </motion.button>
        </div>
      </div>
    </header>
  );
}
