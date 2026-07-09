// Router/customer.router.js
const express = require("express");
const mongoose = require("mongoose");
const Order = require("../Models/Order");
const User = require("../Models/UserSchema");
const auth = require("../Middleware/auth");

const router = express.Router();

// Helper function to check if user is admin (case-insensitive)
const isAdmin = (user) => {
  return user && user.role && user.role.toLowerCase() === "admin";
};

// ==================== GET CUSTOMERS ====================
router.get("/", auth, async (req, res) => {
  try {
    console.log("User from token:", req.user);
    
    if (!isAdmin(req.user)) {
      return res.status(403).json({ 
        message: "Admin access required. Your role: " + req.user.role 
      });
    }

    const {
      page = 1,
      limit = 20,
      search,
      sortBy = "totalSpent",
      sortOrder = "desc",
      minOrders,
      minSpent,
    } = req.query;

    // ==================== CUSTOMER AGGREGATION PIPELINE ====================
    const pipeline = [];

    // Step 1: Match orders (optional search)
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { customerName: { $regex: search, $options: "i" } },
            { customerEmail: { $regex: search, $options: "i" } },
            { "address.mobile": { $regex: search, $options: "i" } },
          ]
        }
      });
    }

    // Step 2: Group by email (using customerEmail from order)
    pipeline.push({
      $group: {
        _id: "$customerEmail", // Group by customerEmail
        name: { $first: "$customerName" },
        email: { $first: "$customerEmail" },
        phone: { $first: "$address.mobile" },
        userId: { $first: "$userId" },
        totalSpent: { $sum: "$totalAmount" },
        totalDiscount: { $sum: "$discount" },
        orderCount: { $sum: 1 },
        lastOrderDate: { $max: "$createdAt" },
        firstOrderDate: { $min: "$createdAt" },
        orderIds: { $addToSet: "$_id" },
        paymentMethods: { $addToSet: "$paymentMethod" },
        statuses: { $addToSet: "$orderStatus" },
        addresses: { $addToSet: "$address" },
      }
    });

    // Step 3: Filter by min orders and min spent
    if (minOrders) {
      pipeline.push({ $match: { orderCount: { $gte: parseInt(minOrders) } } });
    }
    if (minSpent) {
      pipeline.push({ $match: { totalSpent: { $gte: parseFloat(minSpent) } } });
    }

    // Step 4: Lookup user details
    pipeline.push({
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      }
    });

    pipeline.push({
      $unwind: {
        path: "$user",
        preserveNullAndEmptyArrays: true,
      }
    });

    // Step 5: Project final fields
    pipeline.push({
      $project: {
        _id: 0,
        email: "$_id",
        name: 1,
        phone: 1,
        userId: 1,
        userRegistered: { $cond: [{ $ne: ["$user", null] }, true, false] },
        totalSpent: { $round: ["$totalSpent", 2] },
        totalDiscount: { $round: ["$totalDiscount", 2] },
        orderCount: 1,
        lastOrderDate: 1,
        firstOrderDate: 1,
        avgOrderValue: {
          $round: [
            { $cond: [
              { $eq: ["$orderCount", 0] },
              0,
              { $divide: ["$totalSpent", "$orderCount"] }
            ]},
            2
          ]
        },
        paymentMethods: 1,
        statuses: 1,
        addresses: { $slice: ["$addresses", 3] },
        lastOrderId: { $arrayElemAt: ["$orderIds", -1] },
      }
    });

    // Step 6: Sort
    pipeline.push({
      $sort: { [sortBy]: sortOrder === "asc" ? 1 : -1 }
    });

    // Step 7: Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: parseInt(limit) });

    // Execute aggregation
    const customers = await Order.aggregate(pipeline);

    // ==================== GET TOTAL COUNT ====================
    const countPipeline = [];

    if (search) {
      countPipeline.push({
        $match: {
          $or: [
            { customerName: { $regex: search, $options: "i" } },
            { customerEmail: { $regex: search, $options: "i" } },
            { "address.mobile": { $regex: search, $options: "i" } },
          ]
        }
      });
    }

    countPipeline.push({
      $group: {
        _id: "$customerEmail",
      }
    });

    countPipeline.push({
      $count: "total",
    });

    const countResult = await Order.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    // ==================== GET SUMMARY STATS ====================
    const statsPipeline = [];

    if (search) {
      statsPipeline.push({
        $match: {
          $or: [
            { customerName: { $regex: search, $options: "i" } },
            { customerEmail: { $regex: search, $options: "i" } },
            { "address.mobile": { $regex: search, $options: "i" } },
          ]
        }
      });
    }

    statsPipeline.push({
      $group: {
        _id: "$customerEmail",
        totalSpent: { $sum: "$totalAmount" },
        orderCount: { $sum: 1 },
      }
    });

    statsPipeline.push({
      $group: {
        _id: null,
        totalCustomers: { $sum: 1 },
        totalRevenue: { $sum: "$totalSpent" },
        totalOrders: { $sum: "$orderCount" },
        avgOrderValue: { $avg: "$totalSpent" },
      }
    });

    statsPipeline.push({
      $project: {
        _id: 0,
        totalCustomers: 1,
        totalRevenue: { $round: ["$totalRevenue", 2] },
        totalOrders: 1,
        avgOrderValue: { $round: ["$avgOrderValue", 2] },
      }
    });

    const stats = await Order.aggregate(statsPipeline);

    res.json({
      success: true,
      data: customers,
      stats: stats[0] || {
        totalCustomers: 0,
        totalRevenue: 0,
        totalOrders: 0,
        avgOrderValue: 0,
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Get customers error:", err);
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
});

// ==================== GET CUSTOMER DETAILS BY EMAIL ====================
router.get("/:email", auth, async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { email } = req.params;

    const orders = await Order.find({ 
      customerEmail: email 
    })
    .populate("items.productId", "ProductName ProductPrice")
    .populate("userId", "name email")
    .sort({ createdAt: -1 });

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const summary = {
      email: email,
      name: orders[0]?.customerName || "Unknown",
      phone: orders[0]?.address?.mobile || "Unknown",
      totalOrders: orders.length,
      totalSpent: orders.reduce((sum, order) => sum + order.totalAmount, 0),
      totalDiscount: orders.reduce((sum, order) => sum + (order.discount || 0), 0),
      firstOrderDate: orders[orders.length - 1]?.createdAt,
      lastOrderDate: orders[0]?.createdAt,
      avgOrderValue: orders.reduce((sum, order) => sum + order.totalAmount, 0) / orders.length,
      paymentMethods: [...new Set(orders.map(o => o.paymentMethod))],
      orderStatuses: [...new Set(orders.map(o => o.orderStatus))],
    };

    let user = null;
    if (orders[0]?.userId) {
      user = await User.findById(orders[0].userId).select("name email phone createdAt");
    }

    res.json({
      success: true,
      data: {
        summary,
        user,
        orders: orders.map(order => ({
          _id: order._id,
          customOrderId: order.customOrderId,
          totalAmount: order.totalAmount,
          orderStatus: order.orderStatus,
          paymentMethod: order.paymentMethod,
          createdAt: order.createdAt,
          items: order.items.map(item => ({
            productName: item.productName,
            quantity: item.quantity,
            priceAtBuy: item.priceAtBuy,
            isFree: item.isFree,
          })),
        })),
      },
    });
  } catch (err) {
    console.error("Get customer details error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// ==================== GET CUSTOMER BY PHONE ====================
router.get("/phone/:phone", auth, async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { phone } = req.params;

    const orders = await Order.find({ 
      "address.mobile": phone 
    })
    .sort({ createdAt: -1 });

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const emails = [...new Set(orders.map(o => o.customerEmail))];

    res.json({
      success: true,
      data: {
        phone,
        emails,
        totalOrders: orders.length,
        orders: orders.map(order => ({
          customOrderId: order.customOrderId,
          totalAmount: order.totalAmount,
          orderStatus: order.orderStatus,
          createdAt: order.createdAt,
          email: order.customerEmail,
        })),
      },
    });
  } catch (err) {
    console.error("Get customer by phone error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// ==================== CUSTOMER STATISTICS ====================
router.get("/stats/overview", auth, async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const stats = await Order.aggregate([
      {
        $group: {
          _id: "$customerEmail",
          totalSpent: { $sum: "$totalAmount" },
          orderCount: { $sum: 1 },
        }
      },
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          totalRevenue: { $sum: "$totalSpent" },
          totalOrders: { $sum: "$orderCount" },
          avgOrderValue: { $avg: "$totalSpent" },
          avgOrdersPerCustomer: { $avg: "$orderCount" },
          highValue: {
            $sum: { $cond: [{ $gte: ["$totalSpent", 10000] }, 1, 0] }
          },
          mediumValue: {
            $sum: { $cond: [
              { $and: [
                { $gte: ["$totalSpent", 5000] },
                { $lt: ["$totalSpent", 10000] }
              ]},
              1, 0
            ]}
          },
          lowValue: {
            $sum: { $cond: [{ $lt: ["$totalSpent", 5000] }, 1, 0] }
          },
          oneTimeCustomers: {
            $sum: { $cond: [{ $eq: ["$orderCount", 1] }, 1, 0] }
          },
          repeatCustomers: {
            $sum: { $cond: [{ $gt: ["$orderCount", 1] }, 1, 0] }
          },
        }
      },
      {
        $project: {
          _id: 0,
          totalCustomers: 1,
          totalRevenue: { $round: ["$totalRevenue", 2] },
          totalOrders: 1,
          avgOrderValue: { $round: ["$avgOrderValue", 2] },
          avgOrdersPerCustomer: { $round: ["$avgOrdersPerCustomer", 2] },
          segments: {
            highValue: 1,
            mediumValue: 1,
            lowValue: 1,
          },
          retention: {
            oneTimeCustomers: 1,
            repeatCustomers: 1,
            repeatRate: {
              $round: [
                { $multiply: [
                  { $divide: ["$repeatCustomers", "$totalCustomers"] },
                  100
                ]},
                1
              ]
            }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: stats[0] || {
        totalCustomers: 0,
        totalRevenue: 0,
        totalOrders: 0,
        avgOrderValue: 0,
        avgOrdersPerCustomer: 0,
        segments: { highValue: 0, mediumValue: 0, lowValue: 0 },
        retention: { oneTimeCustomers: 0, repeatCustomers: 0, repeatRate: 0 }
      },
    });
  } catch (err) {
    console.error("Get customer stats error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = router;