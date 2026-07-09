const mongoose = require("mongoose");

const AdminSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: {
    type: String,
    enum: ["Admin"],
    required: true
  },
  
});

module.exports = mongoose.model("Admin", AdminSchema);
