// Middleware/auth.js
const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  // Get token from header
  const token = req.header("Authorization")?.replace("Bearer ", "");
  
  // Also check if token is in headers.authorization
  let authToken = token;
  if (!authToken && req.headers.authorization) {
    authToken = req.headers.authorization.split(" ")[1];
  }

  // Check if no token
  if (!authToken) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(authToken, process.env.JWT_SECRET || "your_jwt_secret");
    req.user = decoded;
    // console.log("Decoded user:", req.user); // Debug log
    next();
  } catch (err) {
    console.error("Token verification error:", err.message);
    res.status(401).json({ message: "Token is not valid" });
  }
};