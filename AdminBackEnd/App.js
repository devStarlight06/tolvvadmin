const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();

app.use(cors({ origin: ["http://localhost:3002", "http://localhost:3001"], credentials: true }));
app.use(express.json());
app.use("/images", express.static("public/images"));
// Frontend images folder ને પણ serve કરો
app.use("/images", express.static("D:/GourmentBazar/SuperAdmin/AdminFrontEnd/public/images"));

/* ===== ROUTES ===== */
app.use("/api/admin", require("./Router/auth.routes"));
app.use("/api/admin", require("./Router/admin.routers"));

app.use("/api/admin", require("./Router/order.routes"));
app.use("/api/admin", require("./Router/invoice"));
app.use("/api/customers", require("./Router/customer.router"));

app.use("/api/coupons", require("./Router/couponRoutes"));

// ✅ THIS LINE WAS MISSING (VERY IMPORTANT)
app.use("/api/dashboard", require("./Router/dashboard"));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

const PORT = process.env.PORT || 7000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
