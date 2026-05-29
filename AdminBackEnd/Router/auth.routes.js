const express = require("express");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();
const router = express.Router();

// Single Admin user
const ADMIN = {
  email: "admin@example.com",
  password: "admin123",
  id: "ADMIN001",
  name: "Admin User",
};

// ---------------- LOGIN ----------------a
router.post("/auth/login", (req, res) => {
  const { email, password } = req.body;

  if (email === ADMIN.email && password === ADMIN.password) {
    const token = jwt.sign(
      { id: ADMIN.id, role: "Admin", name: ADMIN.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || "24h" }
    );

    return res.json({
      token,
      user: { id: ADMIN.id, name: ADMIN.name, email: ADMIN.email },
    });
  }

  return res.status(401).json({ message: "Invalid credentials" });
});

module.exports = router;
