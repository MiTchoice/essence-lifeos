import axios from "axios";

// Base API - general requests
const api = axios.create({
  baseURL: "/api",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Separate instance for AI - longer timeout (Atlas can be slow)
const aiAxios = axios.create({
  baseURL: "/api",
  timeout: 30000,   // 30s for AI (does 6 DB queries)
  headers: { "Content-Type": "application/json" },
});

// Attach JWT to ALL requests
const attachToken = (config) => {
  const token = localStorage.getItem("lifeos_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
};
api.interceptors.request.use(attachToken);
aiAxios.interceptors.request.use(attachToken);

// Response interceptors - normalise errors
const handleErr = (err) => {
  const msg = err.response?.data?.error || err.message || "Network error";
  return Promise.reject({ error: msg, status: err.response?.status });
};
api.interceptors.response.use(res => res.data, handleErr);
aiAxios.interceptors.response.use(res => res.data, handleErr);

// ── Auth ──────────────────────────────────────────────────
export const authApi = {
  register: (d)  => api.post("/auth/register", d),
  login:    (d)  => api.post("/auth/login", d),
  me:       ()   => api.get("/auth/me"),
};

// ── Tasks ─────────────────────────────────────────────────
export const tasksApi = {
  getAll:   (p)    => api.get("/tasks", { params: p }),
  create:   (d)    => api.post("/tasks", d),
  update:   (id,d) => api.put(`/tasks/${id}`, d),
  remove:   (id)   => api.delete(`/tasks/${id}`),
  prepone:  (id)   => api.post(`/tasks/${id}/prepone`),
  postpone: (id)   => api.post(`/tasks/${id}/postpone`),
  shuffle:  ()     => api.post("/tasks/shuffle/all"),
  stats:    ()     => api.get("/tasks/stats"),
};

// ── Time ──────────────────────────────────────────────────
export const timeApi = {
  getAll:      (p)  => api.get("/time", { params: p }),
  create:      (d)  => api.post("/time", d),
  start:       (d)  => api.post("/time/start", d),
  stop:        (id) => api.post(`/time/stop/${id}`),
  remove:      (id) => api.delete(`/time/${id}`),
  dailyReport: ()   => api.get("/time/report/daily"),
};

// ── Finance ───────────────────────────────────────────────
export const financeApi = {
  getAll:     (p)    => api.get("/finance", { params: p }),
  create:     (d)    => api.post("/finance", d),
  update:     (id,d) => api.put(`/finance/${id}`, d),
  remove:     (id)   => api.delete(`/finance/${id}`),
  comparison:    ()     => api.get("/finance/comparison/daily"),
  budgetMonthly: ()     => api.get("/finance/budget/monthly"),
};

// ── Calendar ──────────────────────────────────────────────
export const calendarApi = {
  getAll:    (p)    => api.get("/calendar", { params: p }),
  create:    (d)    => api.post("/calendar", d),
  update:    (id,d) => api.put(`/calendar/${id}`, d),
  remove:    (id)   => api.delete(`/calendar/${id}`),
  syncTasks: ()     => api.post("/calendar/sync/tasks"),
};

// ── AI — uses longer timeout ───────────────────────────────
export const aiApi = {
  suggestions: ()    => aiAxios.get("/ai/suggestions"),
  predictions: ()    => aiAxios.get("/ai/predictions"),
  ask:         (q,c) => aiAxios.post("/ai/ask", { question: q, context: c }),
};

// ── Dashboard ─────────────────────────────────────────────
export const dashboardApi = {
  get: () => api.get("/dashboard"),
};
