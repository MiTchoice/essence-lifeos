import { create } from "zustand";

/* ── Theme engine ─────────────────────────────────────────────────────────── */
const THEMES = ["dark", "light", "midnight"];
const DEFAULT_THEME = "dark";

function applyTheme(theme) {
  const t = THEMES.includes(theme) ? theme : DEFAULT_THEME;
  // Remove all theme attributes first
  document.documentElement.removeAttribute("data-theme");
  // Force reflow (helps with CSS variable re-computation)
  void document.documentElement.offsetHeight;
  // Apply new theme
  document.documentElement.setAttribute("data-theme", t);
  // Also update body background directly for instant visual
  const bgMap = { dark:"#0b0b14", light:"#f4f6fb", midnight:"#000000" };
  document.documentElement.style.backgroundColor = bgMap[t] || bgMap.dark;
  document.body.style.backgroundColor = bgMap[t] || bgMap.dark;
  document.body.style.color = t === "light" ? "#0f1020" : "#f0f0fa";
  localStorage.setItem("essence_theme", t);
  return t;
}

// Boot: apply saved theme immediately
const bootTheme = applyTheme(localStorage.getItem("essence_theme") || DEFAULT_THEME);

/* ── Auth persistence ─────────────────────────────────────────────────────── */
const savedUser  = (() => { try { return JSON.parse(localStorage.getItem("lifeos_user") || "null"); } catch { return null; } })();
const savedToken = localStorage.getItem("lifeos_token") || null;

/* ── Store ────────────────────────────────────────────────────────────────── */
const useStore = create((set, get) => ({
  // Theme
  theme: bootTheme,
  setTheme: (theme) => {
    const applied = applyTheme(theme);
    set({ theme: applied });
  },

  // Auth
  user:  savedUser,
  token: savedToken,
  setAuth: (user, token) => {
    localStorage.setItem("lifeos_user",  JSON.stringify(user));
    localStorage.setItem("lifeos_token", token);
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem("lifeos_user");
    localStorage.removeItem("lifeos_token");
    set({ user: null, token: null, tasks: [] });
  },

  // Tasks
  tasks: [],
  tasksLoaded: false,
  setTasks:    (tasks) => set({ tasks, tasksLoaded: true }),
  addTask:     (t)     => set(s => ({ tasks: [t, ...s.tasks] })),
  updateTask:  (id, d) => set(s => ({ tasks: s.tasks.map(t => t._id === id ? { ...t, ...d } : t) })),
  removeTask:  (id)    => set(s => ({ tasks: s.tasks.filter(t => t._id !== id) })),

  // Timer
  activeTimer: null,
  setActiveTimer: (timer) => set({ activeTimer: timer }),

  // Toasts
  toasts: [],
  addToast: (message, type = "success") => {
    const id = Date.now();
    set(s => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })), 3500);
  },
  removeToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}));

export default useStore;
