// Router/order.routes.js
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Order = require("../Models/Order");
const Product = require("../Models/Product");
const User = require("../Models/UserSchema");
const auth = require("../Middleware/auth");

// ==================== GET ALL ORDERS ====================
router.get("/orders", auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      orderStatus,
      paymentMethod,
      startDate,
      endDate,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (orderStatus) filter.orderStatus = orderStatus;
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    if (search) {
      filter.$or = [
        { customOrderId: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
        { customerEmail: { $regex: search, $options: "i" } },
        { "address.mobile": { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const orders = await Order.find(filter)
      .populate("userId", "name email")
      .populate("items.productId", "ProductName ProductPrice")
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(filter);

    const stats = await Order.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" },
          totalItems: { $sum: { $size: "$items" } },
          pendingCount: {
            $sum: { $cond: [{ $eq: ["$orderStatus", "Pending"] }, 1, 0] }
          },
          processingCount: {
            $sum: { $cond: [{ $eq: ["$orderStatus", "Processing for Shipping"] }, 1, 0] }
          },
          shippedCount: {
            $sum: { $cond: [{ $eq: ["$orderStatus", "Shipped"] }, 1, 0] }
          },
          deliveredCount: {
            $sum: { $cond: [{ $eq: ["$orderStatus", "Delivered"] }, 1, 0] }
          },
          cancelledCount: {
            $sum: { $cond: [{ $eq: ["$orderStatus", "Cancelled"] }, 1, 0] }
          },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: orders,
      stats: stats[0] || {
        totalOrders: 0,
        totalRevenue: 0,
        totalItems: 0,
        pendingCount: 0,
        processingCount: 0,
        shippedCount: 0,
        deliveredCount: 0,
        cancelledCount: 0,
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==================== GET SINGLE ORDER ====================
router.get("/orders/:id", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("userId", "name email phone")
      .populate("items.productId", "ProductName ProductPrice ProductImages")
      .populate("items.hamperId");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Get order error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==================== UPDATE ORDER STATUS ====================
router.put("/orders/:id/status", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus, status, note } = req.body;

    // Validate order ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    // Find order
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Update status
    if (orderStatus) {
      order.orderStatus = orderStatus;
      
      // If delivered, set delivered date
      if (orderStatus === "Delivered") {
        order.deliveredAt = new Date();
      }
    }

    if (status) {
      order.status = status;
    }

    if (note) {
      order.note = note;
    }

    await order.save();

    // Return updated order
    const updatedOrder = await Order.findById(id)
      .populate("userId", "name email")
      .populate("items.productId", "ProductName ProductPrice");

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: updatedOrder,
    });
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update order status",
    });
  }
});

// ==================== DELETE ORDER ====================
router.delete("/orders/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate order ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    await Order.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (error) {
    console.error("Delete order error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==================== GET ORDER STATISTICS ====================
router.get("/orders/stats", auth, async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(now);
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalOrders,
      todayOrders,
      weekOrders,
      monthOrders,
      statusBreakdown,
      paymentBreakdown,
      revenue,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: startOfToday } }),
      Order.countDocuments({ createdAt: { $gte: startOfWeek } }),
      Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Order.aggregate([
        { $group: { _id: "$orderStatus", count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $group: { _id: "$paymentMethod", count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$totalAmount" },
            totalDiscount: { $sum: "$discount" },
            totalShipping: { $sum: "$shippingCost" },
          },
        },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalOrders,
        todayOrders,
        weekOrders,
        monthOrders,
        statusBreakdown,
        paymentBreakdown,
        revenue: revenue[0] || {
          totalRevenue: 0,
          totalDiscount: 0,
          totalShipping: 0,
        },
      },
    });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;