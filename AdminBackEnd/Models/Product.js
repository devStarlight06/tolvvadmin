// Models/Product.js
const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  ProductName: { 
    type: String, 
    required: [true, "Product name is required"],
    trim: true 
  },
  ProductPrice: { 
    type: Number, 
    required: [true, "Product price is required"],
    min: [0, "Price cannot be negative"]
  },
  Category: { 
    type: String,
    trim: true,
    default: ""
  },
  Zodiac: { 
    type: String,
    trim: true,
    default: ""
  },
  Description: { 
    type: String,
    trim: true,
    default: ""
  },
  Image: { 
    type: String,
    default: ""
  },
  size: { 
    type: String,
    trim: true,
    default: ""
  },
  color: { 
    type: String,
    trim: true,
    default: ""
  },
  isActive: {
    type: Boolean,
    default: true
  },
  stock: {
    type: Number,
    default: 0,
    min: [0, "Stock cannot be negative"]
  }
}, {
  timestamps: true
});

// ==================== INDEXES ====================
ProductSchema.index({ ProductName: 1 });
ProductSchema.index({ Category: 1 });
ProductSchema.index({ Zodiac: 1 });

// ==================== VIRTUAL FIELDS ====================
ProductSchema.virtual('formattedPrice').get(function() {
  return `₹${this.ProductPrice}`;
});

// ==================== METHODS ====================
ProductSchema.methods.toJSON = function() {
  const obj = this.toObject();
  obj.formattedPrice = this.formattedPrice;
  return obj;
};

// ==================== STATIC METHODS ====================
ProductSchema.statics.findByCategory = function(category) {
  return this.find({ Category: category, isActive: true });
};

ProductSchema.statics.findByZodiac = function(zodiac) {
  return this.find({ Zodiac: zodiac, isActive: true });
};

ProductSchema.statics.getActiveProducts = function() {
  return this.find({ isActive: true });
};

ProductSchema.statics.getCategories = function() {
  return this.distinct('Category');
};

ProductSchema.statics.getZodiacSigns = function() {
  return this.distinct('Zodiac');
};

module.exports = mongoose.model('Product', ProductSchema);