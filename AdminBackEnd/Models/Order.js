// Models/Order.js
const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    // ================= USER INFORMATION =================
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    customOrderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    customerEmail: {
      type: String,
      required: true,
    },

    // ================= ORDER ITEMS =================
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        hamperId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Hamper",
        },
        productName: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        priceAtBuy: {
          type: Number,
          required: true,
          min: 0,
        },
        isFree: {
          type: Boolean,
          default: false,
        },
        hamperItems: [
          {
            productId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Product",
            },
            name: String,
            quantity: Number,
            isFree: {
              type: Boolean,
              default: false,
            },
          },
        ],
      },
    ],

    // ================= PRICING =================
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    shippingCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    codCharge: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    couponCode: {
      type: String,
      default: null,
    },

    // ================= PAYMENT =================
    paymentMethod: {
      type: String,
      enum: ["upi", "card", "cod", "cod_hybrid", "razorpay"],
      required: true,
    },

    status: {
      type: String,
      enum: [
        "PAYMENT_PENDING",
        "PARTIALLY_PAID_COD",
        "COD_CONFIRMED",
        "PAID",
        "FAILED",
        "CANCELLED",
        "REFUNDED",
      ],
      default: "PAYMENT_PENDING",
      index: true,
    },

    orderStatus: {
      type: String,
      enum: [
        "Pending",
        "Confirmed",
        "Processing for Shipping",
        "Shipped",
        "In Transit",
        "Out for Delivery",
        "Delivered",
        "Cancelled",
        "Returned to Origin",
        "Partial Payment Received",
        "Awaiting Advance Payment",
        "Awaiting Payment",
        "Payment Failed",
        "Payment Received",
      ],
      default: "Pending",
      index: true,
    },

    // ================= PARTIAL PAYMENT =================
    partialPayment: {
      paidOnline: {
        type: Number,
        default: 0,
        min: 0,
      },
      remainingToPay: {
        type: Number,
        default: 0,
        min: 0,
      },
      paymentMode: {
        type: String,
        enum: ["COD_HYBRID", null],
        default: null,
      },
      transactionId: {
        type: String,
        default: null,
      },
      paidAt: {
        type: Date,
        default: null,
      },
      paymentMethod: {
        type: String,
        default: null,
      },
      advanceAmount: {
        type: Number,
        default: 0,
      },
    },

    // ================= ADDRESS =================
    address: {
      name: {
        type: String,
        required: true,
      },
      houseNumber: {
        type: String,
        required: true,
      },
      buildingName: String,
      societyName: String,
      road: String,
      landmark: String,
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        default: "Gujarat",
      },
      pincode: {
        type: String,
        required: true,
      },
      mobile: {
        type: String,
        required: true,
      },
      street: String,
    },

    // ================= RAZORPAY FIELDS =================
    razorpayOrderId: {
      type: String,
      default: null,
    },
    razorpayPaymentId: {
      type: String,
      default: null,
    },
    razorpaySignature: {
      type: String,
      default: null,
    },
    paymentId: {
      type: String,
      default: null,
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED"],
      default: "PENDING",
    },
    paymentFailureReason: {
      type: String,
      default: null,
    },

    // ================= TIMESTAMPS =================
    paidAt: {
      type: Date,
      default: null,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },

    // ================= REFUND FIELDS =================
    refundStatus: {
      type: String,
      enum: ["NONE", "PROCESSED", "PENDING", "FAILED"],
      default: "NONE",
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
    refundId: {
      type: String,
      default: null,
    },
    refundedAt: {
      type: Date,
      default: null,
    },

    // ================= OTHER FIELDS =================
    note: {
      type: String,
      default: "",
    },
    subscribe: {
      type: Boolean,
      default: false,
    },
    emailSent: {
      type: Boolean,
      default: false,
    },

    // ================= SHIPROCKET FIELDS =================
    shiprocketOrderId: {
      type: String,
      default: null,
    },
    shiprocketShipmentId: {
      type: String,
      default: null,
    },
    shiprocketLabelUrl: {
      type: String,
      default: null,
    },
    awbCode: {
      type: String,
      default: null,
    },
    shiprocketStatus: {
      type: String,
      default: null,
    },
    trackingStatus: {
      type: String,
      default: null,
    },
    trackingData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    lastTrackingUpdate: {
      type: Date,
      default: null,
    },
    totalWeight: {
      type: Number,
      default: 0.8,
    },
  },
  {
    timestamps: true,  // ← This handles createdAt and updatedAt automatically
  }
);

// ❌ REMOVED: orderSchema.pre('save', ...) - Not needed because timestamps: true

// ==================== VIRTUAL FIELDS ====================
orderSchema.virtual('isFullyPaid').get(function() {
  return this.status === 'PAID';
});

orderSchema.virtual('isPartiallyPaid').get(function() {
  return this.status === 'PARTIALLY_PAID_COD';
});

orderSchema.virtual('remainingAmount').get(function() {
  if (this.status === 'PARTIALLY_PAID_COD') {
    return this.partialPayment?.remainingToPay || 0;
  }
  if (this.status === 'PAYMENT_PENDING') {
    return this.totalAmount;
  }
  return 0;
});

// ==================== METHODS ====================
orderSchema.methods.markAsPaid = async function(paymentId, paymentMethod = 'razorpay') {
  this.status = 'PAID';
  this.orderStatus = 'Confirmed';
  this.paymentId = paymentId;
  this.paidAt = new Date();
  this.paymentStatus = 'SUCCESS';
  this.paymentMethod = paymentMethod;
  await this.save();
  return this;
};

orderSchema.methods.markAsPartiallyPaid = async function(transactionId, amount, remainingAmount) {
  this.status = 'PARTIALLY_PAID_COD';
  this.orderStatus = 'Partial Payment Received';
  this.partialPayment = {
    paidOnline: amount,
    remainingToPay: remainingAmount,
    paymentMode: 'COD_HYBRID',
    transactionId: transactionId,
    paidAt: new Date(),
    paymentMethod: 'RAZORPAY',
    advanceAmount: amount,
  };
  this.paymentStatus = 'SUCCESS';
  await this.save();
  return this;
};

orderSchema.methods.markAsFailed = async function(reason) {
  this.status = 'FAILED';
  this.orderStatus = 'Payment Failed';
  this.paymentStatus = 'FAILED';
  this.paymentFailureReason = reason;
  await this.save();
  return this;
};

orderSchema.methods.markAsCancelled = async function() {
  this.status = 'CANCELLED';
  this.orderStatus = 'Cancelled';
  await this.save();
  return this;
};

orderSchema.methods.markAsDelivered = async function() {
  this.orderStatus = 'Delivered';
  this.deliveredAt = new Date();
  await this.save();
  return this;
};

// ==================== INDEXES ====================
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ customOrderId: 1, userId: 1 });
orderSchema.index({ razorpayOrderId: 1 });
orderSchema.index({ awbCode: 1 });
orderSchema.index({ shiprocketShipmentId: 1 });

module.exports = mongoose.model("Order", orderSchema);