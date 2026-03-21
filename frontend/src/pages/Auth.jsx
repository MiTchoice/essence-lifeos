import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Zap, GraduationCap, User, Mail, Lock, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { authApi } from "../api";
import useStore from "../store/useStore";

const FEATURES = [
  { icon:"✅", text:"AI-powered task prioritisation" },
  { icon:"⏱️", text:"Live time tracker with analytics" },
  { icon:"💰", text:"Personal finance & budget tracking" },
  { icon:"🤖", text:"Smart AI assistant with live data" },
  { icon:"📊", text:"Interactive dashboard & heatmaps" },
];

export default function Auth() {
  const { setAuth } = useStore();
  const [mode,   setMode]   = useState("login");
  const [loading,setLoading]= useState(false);
  const [showPw, setShowPw] = useState(false);
  const [error,  setError]  = useState("");
  const [form,   setForm]   = useState({ name:"", email:"", password:"" });
  const s = (k,v) => { setForm(f=>({...f,[k]:v})); setError(""); };

  const submit = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const fn  = mode==="login" ? authApi.login : authApi.register;
      const res = await fn(mode==="login" ? { email:form.email, password:form.password } : form);
      setAuth(res.user, res.token);
    } catch(err) { setError(err.error || "Something went wrong"); }
    finally      { setLoading(false); }
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", overflow:"hidden", background:"var(--bg-base)" }}>

      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[54%] flex-col justify-between"
        style={{ padding:48, background:"var(--bg-surface)", borderRight:"1px solid var(--border)", position:"relative" }}>
        {/* Aurora orbs */}
        <div style={{ position:"absolute", top:-100, left:-60, width:400, height:400, borderRadius:"50%", opacity:0.18,
          background:"radial-gradient(circle, var(--accent) 0%, transparent 70%)", filter:"blur(70px)", pointerEvents:"none" }}/>
        <div style={{ position:"absolute", bottom:-80, right:-40, width:320, height:320, borderRadius:"50%", opacity:0.12,
          background:"radial-gradient(circle, var(--green) 0%, transparent 70%)", filter:"blur(70px)", pointerEvents:"none" }}/>

        {/* Logo */}
        <div style={{ position:"relative", zIndex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:4 }}>
            <div style={{ width:46, height:46, borderRadius:14, display:"flex", alignItems:"center", justifyContent:"center",
              background:"linear-gradient(135deg,var(--accent),#8b5cf6)", boxShadow:"0 0 28px var(--accent-glow)" }}>
              <Zap style={{ width:22, height:22, color:"white" }}/>
            </div>
            <span style={{ fontSize:28, fontWeight:900, letterSpacing:"-0.03em", color:"var(--text-primary)" }}>ESSENCE</span>
          </div>
          <p style={{ fontSize:12, fontWeight:700, letterSpacing:"0.18em", textTransform:"uppercase",
            background:"linear-gradient(90deg,var(--accent),var(--green))", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
            marginLeft:58 }}>MyLifeMyChoice</p>
        </div>

        {/* Hero text */}
        <div style={{ position:"relative", zIndex:1 }}>
          <h2 style={{ fontSize:36, fontWeight:900, letterSpacing:"-0.03em", lineHeight:1.15, color:"var(--text-primary)", marginBottom:8 }}>
            Track. Plan.{" "}
            <span style={{ background:"linear-gradient(135deg,var(--accent),var(--green))", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
              Improve.
            </span>
          </h2>
          <p style={{ fontSize:14, color:"var(--text-muted)", marginBottom:32 }}>
            Everything you need to be your most productive self, powered by real data.
          </p>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {FEATURES.map((f,i) => (
              <motion.div key={i} initial={{ opacity:0, x:-16 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.3+i*0.09 }}
                style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:30, height:30, borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
                  background:"rgba(108,114,255,0.1)", border:"1px solid rgba(108,114,255,0.2)", fontSize:15 }}>{f.icon}</div>
                <span style={{ fontSize:13, color:"var(--text-secondary)" }}>{f.text}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Team */}
        <div style={{ position:"relative", zIndex:1 }}>
          <div style={{ borderRadius:16, padding:16, background:"rgba(108,114,255,0.06)", border:"1px solid var(--border)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:12 }}>
              <GraduationCap style={{ width:14, height:14, color:"var(--accent)" }}/>
              <span style={{ fontSize:10, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.2em", color:"var(--text-muted)" }}>
                NIT Hamirpur · Group Project
              </span>
            </div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {[["Mitrasen Yadav","#6c72ff"],["Ashish Garg","#23d18b"],["Anshul Thakur","#a78bfa"]].map(([n,c])=>(
                <span key={n} style={{ padding:"4px 12px", borderRadius:20, fontSize:11, fontWeight:700, color:"white",
                  background:`${c}20`, border:`1px solid ${c}40` }}>{n}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4, ease:[0.22,1,0.36,1] }}
          style={{ width:"100%", maxWidth:420, position:"relative", zIndex:1 }}>

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div style={{ width:36, height:36, borderRadius:11, display:"flex", alignItems:"center", justifyContent:"center",
              background:"linear-gradient(135deg,var(--accent),#8b5cf6)" }}>
              <Zap style={{ width:16, height:16, color:"white" }}/>
            </div>
            <span style={{ fontSize:22, fontWeight:900, color:"var(--text-primary)" }}>ESSENCE</span>
          </div>

          <div style={{ borderRadius:24, padding:32, background:"var(--bg-elevated)",
            border:"1px solid var(--border-strong)", boxShadow:"0 32px 80px rgba(0,0,0,0.25)" }}>

            <div style={{ marginBottom:24 }}>
              <h1 style={{ fontSize:22, fontWeight:900, letterSpacing:"-0.025em", color:"var(--text-primary)", marginBottom:4 }}>
                {mode==="login" ? "Welcome back 👋" : "Get started free 🚀"}
              </h1>
              <p style={{ fontSize:13, color:"var(--text-muted)" }}>
                {mode==="login" ? "Sign in to your personal dashboard" : "Create your ESSENCE account"}
              </p>
            </div>

            {/* Mode toggle */}
            <div style={{ display:"flex", borderRadius:14, padding:4, marginBottom:22, background:"var(--bg-surface)" }}>
              {["login","register"].map(m => (
                <button key={m} onClick={() => { setMode(m); setError(""); setForm({name:"",email:"",password:""}); }}
                  style={{ flex:1, padding:"9px 0", borderRadius:11, fontSize:12, fontWeight:700,
                    cursor:"pointer", border:"none", transition:"all 0.18s ease",
                    background: mode===m ? "var(--accent-glow)" : "transparent",
                    border: mode===m ? "1px solid var(--accent)" : "1px solid transparent",
                    color: mode===m ? "var(--accent)" : "var(--text-muted)" }}>
                  {m==="login" ? "Sign In" : "Sign Up"}
                </button>
              ))}
            </div>

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                  style={{ marginBottom:16, padding:"10px 14px", borderRadius:11, fontSize:13, fontWeight:600,
                    color:"var(--red)", background:"rgba(255,95,126,0.1)", border:"1px solid rgba(255,95,126,0.25)",
                    display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ width:18, height:18, borderRadius:"50%", background:"var(--red)",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:10, fontWeight:900, color:"white", flexShrink:0 }}>!</span>
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={submit} style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <AnimatePresence>
                {mode==="register" && (
                  <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }}>
                    <label className="label">Full Name</label>
                    <div style={{ position:"relative" }}>
                      <User style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", width:14, height:14, color:"var(--text-muted)" }}/>
                      <input className="input" style={{ paddingLeft:36 }} placeholder="e.g. Mitrasen Yadav" required={mode==="register"}
                        value={form.name} onChange={e=>s("name",e.target.value)}/>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="label">Email</label>
                <div style={{ position:"relative" }}>
                  <Mail style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", width:14, height:14, color:"var(--text-muted)" }}/>
                  <input type="email" className="input" style={{ paddingLeft:36 }} placeholder="you@example.com" required
                    value={form.email} onChange={e=>s("email",e.target.value)}/>
                </div>
              </div>

              <div>
                <label className="label">Password</label>
                <div style={{ position:"relative" }}>
                  <Lock style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", width:14, height:14, color:"var(--text-muted)" }}/>
                  <input type={showPw?"text":"password"} className="input" style={{ paddingLeft:36, paddingRight:40 }}
                    placeholder="Min. 6 characters" required minLength={6}
                    value={form.password} onChange={e=>s("password",e.target.value)}/>
                  <button type="button" onClick={()=>setShowPw(!showPw)}
                    style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)",
                      background:"none", border:"none", cursor:"pointer", color:"var(--text-muted)", lineHeight:1 }}>
                    {showPw ? <EyeOff style={{ width:14, height:14 }}/> : <Eye style={{ width:14, height:14 }}/>}
                  </button>
                </div>
              </div>

              <motion.button type="submit" disabled={loading} whileTap={{ scale:0.98 }}
                style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                  padding:13, borderRadius:12, fontWeight:800, fontSize:14, color:"white", cursor:"pointer",
                  background:"linear-gradient(135deg,var(--accent),#4f46e5)", border:"none",
                  boxShadow:"0 4px 24px var(--accent-glow)", transition:"all 0.14s ease",
                  opacity: loading ? 0.6 : 1 }}>
                {loading
                  ? <div style={{ width:18, height:18, border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"white", borderRadius:"50%", animation:"spin 0.7s linear infinite" }}/>
                  : <>{mode==="login" ? "Sign In" : "Create Account"} <ArrowRight style={{ width:16, height:16 }}/></>}
              </motion.button>
            </form>

            <p style={{ textAlign:"center", marginTop:18, fontSize:13, color:"var(--text-muted)" }}>
              {mode==="login" ? "Don't have an account? " : "Already registered? "}
              <button onClick={() => { setMode(mode==="login"?"register":"login"); setError(""); }}
                style={{ fontWeight:700, color:"var(--accent)", background:"none", border:"none", cursor:"pointer",
                  transition:"opacity 0.12s" }}>
                {mode==="login" ? "Sign up free" : "Sign in"}
              </button>
            </p>
          </div>

          <p className="text-center mt-5 text-xs lg:hidden" style={{ color:"var(--text-muted)" }}>
            ESSENCE · MyLifeMyChoice · NIT Hamirpur
          </p>
        </motion.div>
      </div>
    </div>
  );
}
