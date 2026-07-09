const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  houseNumber: String,
  buildingName: String,
  societyName: String,
  road: String,
  landmark: String,
  city: String,
  pincode: String,
  State: String,
  mobile: String,
  email: String,
  isDefault: {
    type: Boolean,
    default: false
  }
});

const userSchema = new mongoose.Schema({
  fname: {
    type: String,
    default: ""
  },
  lname: {
    type: String,
    default: ""
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  mobile: {
    type: String,
    default: null  // Allow null for direct login users
  },
  password: {
    type: String,
    required: false
  },
  role: {
    type: String,
    default: "user"
  },
  googleAuth: {
    type: Boolean,
    default: false
  },
  addresses: {
    type: [addressSchema],
    default: []
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("User", userSchema);