require("dotenv").config();
const express  = require("express");
const cors     = require("cors");
const mongoose = require("mongoose");
const protect  = require("./middleware/auth");

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin:"*", methods:["GET","POST","PUT","DELETE","OPTIONS"], allowedHeaders:["Content-Type","Authorization"] }));
app.use(express.json({ limit:"10mb" }));
app.use(express.urlencoded({ extended:true }));

// Public routes (no login needed)
app.use("/api/auth", require("./routes/auth"));
app.get("/api/health", (req, res) => res.json({ status:"ok", time:new Date().toISOString() }));

// Protected routes (must be logged in)
app.use("/api/tasks",     protect, require("./routes/tasks"));
app.use("/api/calendar",  protect, require("./routes/calendar"));
app.use("/api/time",      protect, require("./routes/time"));
app.use("/api/finance",   protect, require("./routes/finance"));
app.use("/api/ai",        protect, require("./routes/ai"));
app.use("/api/dashboard", protect, require("./routes/dashboard"));

app.use((err, req, res, next) => res.status(500).json({ error:err.message }));

const MONGO_URI = process.env.MONGODB_URI || "";
if (!MONGO_URI) { console.error("❌  Set MONGODB_URI in backend\\.env"); process.exit(1); }

mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS:10000 })
  .then(() => {
    console.log("✅ MongoDB Atlas connected");
    app.listen(PORT, () => console.log(`🚀 LifeOS server → http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error("❌ MongoDB failed:", err.message);
    console.error("   → Atlas: Network Access → Allow 0.0.0.0/0");
    process.exit(1);
  });

module.exports = app;
