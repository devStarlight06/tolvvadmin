const mongoose = require("mongoose");

const VendorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["vendor"],
    default: "vendor"
  },
  phone: { type: String, default: "" },
  company: { type: String, default: "" }
}, { timestamps: true }); // Added timestamps

module.exports = mongoose.model("Vendor", VendorSchema);