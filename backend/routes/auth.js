const express = require("express");
const router  = express.Router();
const jwt     = require("jsonwebtoken");
const User    = require("../models/User");
const protect = require("../middleware/auth");

const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET || "lifeos_secret", { expiresIn: "30d" });

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: "All fields required" });
    if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: "Email already registered — please login" });
    const user = await User.create({ name, email, password });
    res.status(201).json({
      success: true,
      token: sign(user._id),
      user: { _id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ error: "Invalid email or password" });
    res.json({
      success: true,
      token: sign(user._id),
      user: { _id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get("/me", protect, (req, res) => {
  res.json({ success: true, user: { _id: req.user._id, name: req.user.name, email: req.user.email } });
});

module.exports = router;
