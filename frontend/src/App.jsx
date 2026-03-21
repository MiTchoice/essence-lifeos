import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Sidebar       from "./components/layout/Sidebar";
import Topbar        from "./components/layout/Topbar";
import { ToastContainer } from "./components/ui/ToastContainer";
import Auth          from "./pages/Auth";
import Dashboard     from "./pages/Dashboard";
import Tasks         from "./pages/Tasks";
import Calendar      from "./pages/Calendar";
import TimeTracking  from "./pages/TimeTracking";
import Finance       from "./pages/Finance";
import AIAssistant   from "./pages/AIAssistant";
import useStore      from "./store/useStore";

/* ── Page transition — simple fade only to avoid stacking ── */
const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2, ease: "easeOut" } },
  exit:    { opacity: 0, transition: { duration: 0.12, ease: "easeIn" } },
};

function Page({ children }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      /* Critical: don't use position absolute — causes stacking overlap */
      style={{ width: "100%" }}
    >
      {children}
    </motion.div>
  );
}

/* ── AnimatedRoutes — separate component so useLocation works ── */
function AnimatedRoutes() {
  const location = useLocation();
  return (
    /* mode="wait" ensures old page fully exits before new one enters */
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/dashboard" element={<Page><Dashboard/></Page>}/>
        <Route path="/tasks"     element={<Page><Tasks/></Page>}/>
        <Route path="/calendar"  element={<Page><Calendar/></Page>}/>
        <Route path="/time"      element={<Page><TimeTracking/></Page>}/>
        <Route path="/finance"   element={<Page><Finance/></Page>}/>
        <Route path="/ai"        element={<Page><AIAssistant/></Page>}/>
        <Route path="*"          element={<Navigate to="/dashboard" replace/>}/>
      </Routes>
    </AnimatePresence>
  );
}

/* ── Protected app shell ── */
function ProtectedLayout() {
  const { user, theme } = useStore();

  // Re-sync theme on every render in case it drifted
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  if (!user) return <Navigate to="/auth" replace/>;

  return (
    <div className="flex h-screen overflow-hidden"
      style={{ background: "var(--bg-base)" }}>
      <Sidebar/>
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar/>
        {/* overflow-y-auto here — NOT on inner pages */}
        <main className="flex-1 overflow-y-auto" style={{ position: "relative" }}>
          <div className="p-6 max-w-screen-2xl mx-auto">
            <AnimatedRoutes/>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const { user } = useStore();
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={user ? <Navigate to="/dashboard" replace/> : <Auth/>}/>
        <Route path="/"     element={<Navigate to={user ? "/dashboard" : "/auth"} replace/>}/>
        <Route path="/*"    element={<ProtectedLayout/>}/>
      </Routes>
      <ToastContainer/>
    </BrowserRouter>
  );
}
