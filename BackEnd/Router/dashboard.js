// routes/dashboard.js
const express = require("express");
const Order = require("../Models/Order");
const auth = require("../Middleware/auth");

const router = express.Router();

/* ======================================================
   DASHBOARD STATS
====================================================== */
router.get("/stats", auth, async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const deliveredOrders = await Order.countDocuments({ orderStatus: "Delivered" });
    const pendingOrders = await Order.countDocuments({ orderStatus: "Pending" });
    const cancelledOrders = await Order.countDocuments({ orderStatus: "Cancelled" });

    // ✅ FIX: Use priceAtBuy instead of price
    const salesAgg = await Order.aggregate([
      { $match: { orderStatus: "Delivered" } },
      { $unwind: "$items" },
      {
        $group: {
          _id: null,
          totalSales: {
            $sum: { $multiply: ["$items.priceAtBuy", "$items.quantity"] },
          },
        },
      },
    ]);

    res.json({
      totalOrders,
      deliveredOrders,
      pendingOrders,
      cancelledOrders,
      totalSales: (salesAgg[0]?.totalSales || 0).toFixed(2),
    });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ message: err.message });
  }
});

/* ======================================================
   TOTAL SALES
====================================================== */
router.get("/total-sales", auth, async (req, res) => {
  try {
    const data = await Order.aggregate([
      { $match: { orderStatus: "Delivered" } },
      { $unwind: "$items" },
      {
        $group: {
          _id: null,
          totalSales: {
            $sum: { $multiply: ["$items.priceAtBuy", "$items.quantity"] },
          },
          totalOrders: { $sum: 1 },
          totalItems: { $sum: "$items.quantity" },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        totalSales: (data[0]?.totalSales || 0).toFixed(2),
        totalOrders: data[0]?.totalOrders || 0,
        totalItems: data[0]?.totalItems || 0,
      },
    });
  } catch (err) {
    console.error("Total sales error:", err);
    res.status(500).json({ message: err.message });
  }
});

/* ======================================================
   MONTHLY SALES (Chart)
====================================================== */
router.get("/monthly-sales", auth, async (req, res) => {
  try {
    const data = await Order.aggregate([
      { $match: { orderStatus: "Delivered" } },
      { $unwind: "$items" },
      {
        $group: {
          _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
          totalSales: {
            $sum: { $multiply: ["$items.priceAtBuy", "$items.quantity"] },
          },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

    res.json(
      data.map(d => ({
        month: months[d._id.month - 1],
        year: d._id.year,
        totalSales: d.totalSales.toFixed(2),
      }))
    );
  } catch (err) {
    console.error("Monthly sales error:", err);
    res.status(500).json({ message: err.message });
  }
});

/* ======================================================
   DAILY & MONTHLY SALES
====================================================== */
router.get("/sales-summary", auth, async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    );

    const data = await Order.aggregate([
      { $match: { orderStatus: "Delivered" } },
      { $unwind: "$items" },
      {
        $project: {
          createdAt: 1,
          itemTotal: { $multiply: ["$items.priceAtBuy", "$items.quantity"] },
        },
      },
    ]);

    const dailySales = data
      .filter(d => d.createdAt >= startOfToday)
      .reduce((s, d) => s + d.itemTotal, 0);

    const monthlySales = data
      .filter(d => d.createdAt >= startOfMonth)
      .reduce((s, d) => s + d.itemTotal, 0);

    res.json({
      dailySales: dailySales.toFixed(2),
      monthlySales: monthlySales.toFixed(2),
    });
  } catch (err) {
    console.error("Sales summary error:", err);
    res.status(500).json({ message: err.message });
  }
});

/* ======================================================
   SALES BY COMPANY
====================================================== */
router.get("/sales-by-company", auth, async (req, res) => {
  try {
    const data = await Order.aggregate([
      { $match: { orderStatus: "Delivered" } },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.productId",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $group: {
          _id: "$product.company",
          totalQty: { $sum: "$items.quantity" },
          totalSales: {
            $sum: { $multiply: ["$items.priceAtBuy", "$items.quantity"] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          company: "$_id",
          totalQty: 1,
          totalSales: { $round: ["$totalSales", 2] },
        },
      },
      { $sort: { totalSales: -1 } },
    ]);

    res.json(data);
  } catch (err) {
    console.error("Sales by company error:", err);
    res.status(500).json({ message: err.message });
  }
});

/* ======================================================
   PRODUCT WISE SALES
====================================================== */
router.get("/product-wise-sales", auth, async (req, res) => {
  try {
    const data = await Order.aggregate([
      { $match: { orderStatus: "Delivered" } },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.productId",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $group: {
          _id: "$product._id",
          name: { $first: "$product.ProductName" }, // ✅ FIX: Use ProductName
          company: { $first: "$product.company" },
          category: { $first: "$product.Category" }, // ✅ FIX: Use Category
          sunSign: { $first: "$product.Zodiac" }, // ✅ FIX: Use Zodiac
          totalQty: { $sum: "$items.quantity" },
          totalSales: {
            $sum: { $multiply: ["$items.priceAtBuy", "$items.quantity"] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          name: 1,
          company: 1,
          category: 1,
          sunSign: 1,
          totalQty: 1,
          totalSales: { $round: ["$totalSales", 2] },
        },
      },
      { $sort: { totalSales: -1 } },
    ]);

    res.json(data);
  } catch (err) {
    console.error("Product wise sales error:", err);
    res.status(500).json({ message: err.message });
  }
});

/* ======================================================
   SALES BY SUN SIGN
====================================================== */
router.get("/sales-by-sunsign", auth, async (req, res) => {
  try {
    const data = await Order.aggregate([
      { $match: { orderStatus: "Delivered" } },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.productId",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $group: {
          _id: "$product.Zodiac", // ✅ FIX: Use Zodiac
          totalQty: { $sum: "$items.quantity" },
          totalSales: {
            $sum: { $multiply: ["$items.priceAtBuy", "$items.quantity"] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          sunSign: "$_id",
          totalQty: 1,
          totalSales: { $round: ["$totalSales", 2] },
        },
      },
      { $sort: { totalSales: -1 } },
    ]);

    res.json(data);
  } catch (err) {
    console.error("Sales by sun sign error:", err);
    res.status(500).json({ message: err.message });
  }
});

/* ======================================================
   SALES BY CATEGORY
====================================================== */
router.get("/sales-by-category", auth, async (req, res) => {
  try {
    const data = await Order.aggregate([
      { $match: { orderStatus: "Delivered" } },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.productId",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $group: {
          _id: "$product.Category", // ✅ FIX: Use Category
          totalQty: { $sum: "$items.quantity" },
          totalSales: {
            $sum: { $multiply: ["$items.priceAtBuy", "$items.quantity"] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          totalQty: 1,
          totalSales: { $round: ["$totalSales", 2] },
        },
      },
      { $sort: { totalSales: -1 } },
    ]);

    res.json(data);
  } catch (err) {
    console.error("Sales by category error:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;