const jwt  = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async function protect(req, res, next) {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) return res.status(401).json({ error: "Not authorised — please log in" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "lifeos_secret");
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) return res.status(401).json({ error: "User not found" });
    next();
  } catch {
    res.status(401).json({ error: "Invalid token — please log in again" });
  }
};
