// models/Product.js
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: String,
    price: Number,
    description: String,
    category: String,
    image: String,
    company: {
      type: String, // Company Name
      required: true,
    },
    commission_rate: {
      type: Number,
      default: 5, // admin commission %
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
