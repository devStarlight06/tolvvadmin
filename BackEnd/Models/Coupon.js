// models/Coupon.js
const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    // Coupon Code
    code: {
      type: String,
      required: [true, "Coupon code is required"],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: [3, "Coupon code must be at least 3 characters"],
      maxlength: [20, "Coupon code cannot exceed 20 characters"],
    },

    // Coupon Type
    type: {
      type: String,
      enum: ["percentage", "fixed", "free_shipping"],
      required: [true, "Coupon type is required"],
      default: "percentage",
    },

    // Discount Value
    value: {
      type: Number,
      required: [true, "Discount value is required"],
      min: [0, "Discount value cannot be negative"],
      validate: {
        validator: function(v) {
          if (this.type === "percentage" && v > 100) {
            return false;
          }
          return true;
        },
        message: "Percentage discount cannot exceed 100%",
      },
    },

    // Minimum Purchase Amount (optional)
    minPurchase: {
      type: Number,
      default: 0,
      min: [0, "Minimum purchase cannot be negative"],
    },

    // Maximum Discount Amount (for percentage coupons)
    maxDiscount: {
      type: Number,
      default: null,
      min: [0, "Maximum discount cannot be negative"],
    },

    // Product Restrictions
    applicableProducts: {
      type: [String], // Array of product IDs
      default: [],
    },
    applicableCategories: {
      type: [String], // Array of categories
      default: [],
    },
    applicableSunSigns: {
      type: [String], // Array of sun signs
      enum: ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"],
      default: [],
    },

    // Usage Limits
    usageLimit: {
      type: Number,
      default: null, // null = unlimited
      min: [1, "Usage limit must be at least 1"],
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    perUserLimit: {
      type: Number,
      default: 1,
      min: [1, "Per user limit must be at least 1"],
    },

    // Date Range
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
      validate: {
        validator: function(v) {
          return v > this.startDate;
        },
        message: "End date must be after start date",
      },
    },

    // Status
    isActive: {
      type: Boolean,
      default: true,
    },

    // User Restrictions
    applicableUsers: {
      type: [String], // Array of user IDs (null = all users)
      default: [],
    },
    newUsersOnly: {
      type: Boolean,
      default: false,
    },

    // Additional Info
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    bannerImage: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Indexes for faster queries
couponSchema.index({ code: 1 });
couponSchema.index({ startDate: 1, endDate: 1 });
couponSchema.index({ isActive: 1 });
couponSchema.index({ usageLimit: 1, usageCount: 1 });

// Virtual property: isExpired
couponSchema.virtual("isExpired").get(function() {
  return this.endDate < new Date();
});

// Virtual property: isAvailable
couponSchema.virtual("isAvailable").get(function() {
  if (!this.isActive) return false;
  if (this.isExpired) return false;
  if (this.usageLimit && this.usageCount >= this.usageLimit) return false;
  return true;
});

// Method: Check if coupon applies to product
couponSchema.methods.appliesToProduct = function(productId, productCategory, productSunSign) {
  // If no restrictions, applies to all
  if (this.applicableProducts.length === 0 && 
      this.applicableCategories.length === 0 && 
      this.applicableSunSigns.length === 0) {
    return true;
  }

  // Check product ID
  if (this.applicableProducts.length > 0 && 
      this.applicableProducts.includes(productId)) {
    return true;
  }

  // Check category
  if (this.applicableCategories.length > 0 && 
      this.applicableCategories.includes(productCategory)) {
    return true;
  }

  // Check sun sign
  if (this.applicableSunSigns.length > 0 && 
      this.applicableSunSigns.includes(productSunSign)) {
    return true;
  }

  return false;
};

// Method: Calculate discount
couponSchema.methods.calculateDiscount = function(amount) {
  if (this.type === "percentage") {
    let discount = (amount * this.value) / 100;
    if (this.maxDiscount) {
      discount = Math.min(discount, this.maxDiscount);
    }
    return Math.round(discount * 100) / 100;
  } else if (this.type === "fixed") {
    return Math.min(this.value, amount);
  } else if (this.type === "free_shipping") {
    return 0; // Free shipping handled separately
  }
  return 0;
};

// Static method: Get available coupons for user
couponSchema.statics.getAvailableForUser = function(userId, productIds = [], totalAmount = 0) {
  const now = new Date();
  const query = {
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
    $or: [
      { usageLimit: null },
      { $expr: { $lt: ["$usageCount", "$usageLimit"] } },
    ],
  };

  // Check user eligibility
  // If applicableUsers is not empty, user must be in list
  // For newUsersOnly, check if user has orders

  return this.find(query).sort({ value: -1 });
};

module.exports = mongoose.model("Coupon", couponSchema);