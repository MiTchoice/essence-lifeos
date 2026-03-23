# 🚀 LifeOS — Personal Productivity System made by us

A full-stack productivity + analytics + AI assistant system.
**100% free, open-source, no paid APIs required.**

---

## ⚡ Quick Start (5 minutes)

### 1. Prerequisites

```bash
# Verify Node.js v18+ is installed
node --version   # Should output v18.x.x or higher
npm --version    # Should output 9.x or higher
```

### 2. Install MongoDB (choose one)

**Option A — Local MongoDB (recommended for development):**
```bash
# Ubuntu / Debian
sudo apt-get update && sudo apt-get install -y mongodb
sudo systemctl start mongodb && sudo systemctl enable mongodb

# macOS (Homebrew)
brew tap mongodb/brew
brew install mongodb-community@7.0
brew services start mongodb-community@7.0

# Windows — Download installer from:
# https://www.mongodb.com/try/download/community
```

**Option B — MongoDB Atlas (free cloud, no install):**
1. Sign up free at https://www.mongodb.com/atlas
2. Create an M0 (free forever) cluster
3. Get your connection string — you'll paste it in `.env` below

---

### 3. Setup Backend

```bash
cd backend

# Copy environment config
cp .env.example .env

# Edit .env — at minimum set MONGODB_URI:
# For local:  MONGODB_URI=mongodb://localhost:27017/lifeos
# For Atlas:  MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/lifeos

# Install dependencies (pinned versions — no conflicts)
npm install

# Seed sample data (optional but recommended)
node seed.js
```

### 4. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install
```

### 5. Run the App

```bash
# Terminal 1 — Start backend (port 5000)
cd backend && npm run dev

# Terminal 2 — Start frontend (port 3000)
cd frontend && npm run dev

# Open in browser
# http://localhost:3000
```

---

## 🤖 AI Setup (Optional — Mock AI works without this)

The app works perfectly with **mock AI** out of the box. To enable real AI:

### Option A: OpenRouter (Recommended)
1. Sign up free at https://openrouter.ai
2. Get your API key (free models available)
3. In `backend/.env`:
```env
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-xxxxxxxxxxxxxxxx
```

### Option B: HuggingFace
1. Sign up free at https://huggingface.co
2. Create an access token
3. In `backend/.env`:
```env
AI_PROVIDER=huggingface
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxx
```

### Option C: Keep Mock AI (no setup needed)
```env
AI_PROVIDER=mock
```

---

## 📁 Project Structure

```
lifeos/
├── backend/
│   ├── server.js              # Express app entry point
│   ├── seed.js                # Sample data seeder
│   ├── .env.example           # Environment template
│   ├── models/
│   │   ├── Task.js
│   │   ├── TimeEntry.js
│   │   ├── Expense.js
│   │   └── CalendarEvent.js
│   ├── controllers/
│   │   ├── taskController.js
│   │   ├── timeController.js
│   │   ├── financeController.js
│   │   ├── calendarController.js
│   │   ├── aiController.js
│   │   └── dashboardController.js
│   └── routes/
│       ├── tasks.js
│       ├── time.js
│       ├── finance.js
│       ├── calendar.js
│       ├── ai.js
│       └── dashboard.js
└── frontend/
    ├── vite.config.js
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── index.css
        ├── api/index.js        # All API calls
        ├── store/useStore.js   # Zustand global state
        ├── components/
        │   ├── layout/
        │   │   ├── Sidebar.jsx
        │   │   └── Topbar.jsx
        │   ├── dashboard/
        │   │   ├── KPICard.jsx
        │   │   └── ActivityHeatmap.jsx
        │   └── ui/
        │       ├── ToastContainer.jsx
        │       └── Spinner.jsx
        └── pages/
            ├── Dashboard.jsx
            ├── Tasks.jsx
            ├── Calendar.jsx
            ├── TimeTracking.jsx
            ├── Finance.jsx
            └── AIAssistant.jsx
```

---

## 🧪 API Endpoints Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/health | Health check |
| GET | /api/tasks | Get all tasks |
| POST | /api/tasks | Create task |
| PUT | /api/tasks/:id | Update task |
| DELETE | /api/tasks/:id | Delete task |
| POST | /api/tasks/:id/prepone | Move task 1 day earlier |
| POST | /api/tasks/:id/postpone | Move task 1 day later |
| POST | /api/tasks/shuffle/all | AI-reorder by priority |
| GET | /api/time | Get time entries |
| POST | /api/time/start | Start live timer |
| POST | /api/time/stop/:id | Stop timer |
| GET | /api/time/report/daily | Today vs yesterday report |
| GET | /api/finance | Get expenses |
| POST | /api/finance | Add expense |
| GET | /api/finance/comparison/daily | Today vs yesterday |
| GET | /api/calendar | Get events |
| POST | /api/calendar/sync/tasks | Sync tasks to calendar |
| GET | /api/dashboard | Aggregated dashboard data |
| GET | /api/ai/suggestions | Productivity suggestions |
| GET | /api/ai/predictions | Tomorrow's forecast |
| POST | /api/ai/ask | Chat with AI assistant |

---

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| `ECONNREFUSED 27017` | Start MongoDB: `sudo systemctl start mongodb` |
| `Cannot find module` | Run `npm install` in the correct folder |
| CORS errors | Ensure backend runs on port 5000 and frontend on 3000 |
| Vite proxy 502 | Start backend before frontend |
| AI returns mock | Set `AI_PROVIDER=openrouter` and add API key |
| Port already in use | `kill -9 $(lsof -ti:5000)` or `kill -9 $(lsof -ti:3000)` |

---

## 🎨 Features

- ✅ **Task Manager** — Create, edit, delete, filter by status/priority
- ✅ **AI Shuffle** — Reorder tasks by AI-computed priority score
- ✅ **Prepone/Postpone** — Shift task scheduled dates
- ✅ **Calendar** — Month view with event creation & task sync
- ✅ **Time Tracking** — Live timer + manual entries + daily reports
- ✅ **Finance Tracker** — Expenses with category breakdown & trends
- ✅ **AI Assistant** — Chat + productivity tips + predictions
- ✅ **Dashboard** — KPI cards, charts, activity heatmap
- ✅ **Dark/Light Mode** — System preference detection
- ✅ **Toast Notifications** — Action feedback throughout

---

## 📦 Tech Stack & Versions

**Backend:**
- Node.js v18+
- Express 4.18.2
- Mongoose 8.3.4
- MongoDB 7.0

**Frontend:**
- React 18.2.0
- Vite 5.2.8
- Tailwind CSS 3.4.3
- Framer Motion 11.1.7
- Recharts 2.12.7
- Zustand 4.5.2
- React Router DOM 6.23.1
- date-fns 3.6.0
- Axios 1.6.8
