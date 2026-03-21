import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";
import useStore from "../../store/useStore";

const CONFIGS = {
  success: { Icon:CheckCircle2, color:"var(--green)",  bar:"var(--green)",  bg:"rgba(35,209,139,0.08)"  },
  error:   { Icon:XCircle,      color:"var(--red)",    bar:"var(--red)",    bg:"rgba(255,95,126,0.08)"  },
  warning: { Icon:AlertTriangle,color:"var(--amber)",  bar:"var(--amber)",  bg:"rgba(255,181,71,0.08)"  },
  info:    { Icon:Info,         color:"var(--cyan)",   bar:"var(--cyan)",   bg:"rgba(56,189,248,0.08)"  },
};

export function ToastContainer() {
  const { toasts, removeToast } = useStore();
  return (
    <div style={{ position:"fixed", bottom:24, right:24, zIndex:9999,
      display:"flex", flexDirection:"column", gap:8, pointerEvents:"none" }}>
      <AnimatePresence>
        {toasts.map(t => {
          const cfg = CONFIGS[t.type] || CONFIGS.success;
          return (
            <motion.div key={t.id}
              initial={{ opacity:0, x:80, scale:0.9 }}
              animate={{ opacity:1, x:0,  scale:1   }}
              exit={{    opacity:0, x:80, scale:0.9 }}
              transition={{ type:"spring", stiffness:420, damping:32 }}
              style={{ pointerEvents:"auto", display:"flex", alignItems:"center", gap:10,
                borderRadius:14, padding:"11px 16px", minWidth:240, maxWidth:340,
                background:"var(--bg-elevated)", border:"1px solid var(--border-strong)",
                backdropFilter:"blur(20px)", boxShadow:"0 8px 32px rgba(0,0,0,0.4)",
                position:"relative", overflow:"hidden" }}>
              {/* Accent bar */}
              <div style={{ position:"absolute", left:0, top:0, bottom:0, width:3,
                background:cfg.bar, borderRadius:"3px 0 0 3px" }}/>
              {/* Icon */}
              <div style={{ width:28, height:28, borderRadius:8, display:"flex", alignItems:"center",
                justifyContent:"center", flexShrink:0, background:cfg.bg }}>
                <cfg.Icon style={{ width:15, height:15, color:cfg.color }}/>
              </div>
              <span style={{ flex:1, fontSize:13, fontWeight:600, color:"var(--text-primary)", lineHeight:1.35 }}>
                {t.message}
              </span>
              <button onClick={() => removeToast(t.id)} style={{ color:"var(--text-muted)", background:"none",
                border:"none", cursor:"pointer", padding:2, borderRadius:5, flexShrink:0,
                transition:"color 0.12s" }}
                onMouseEnter={e=>e.currentTarget.style.color="var(--text-primary)"}
                onMouseLeave={e=>e.currentTarget.style.color="var(--text-muted)"}>
                <X style={{ width:14, height:14 }}/>
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
export default ToastContainer;
