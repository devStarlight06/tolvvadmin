// routes/dashboard.js
const express = require("express");
const Order = require("../Models/Order");
const auth = require("../Middleware/auth");

const router = express.Router();

/* ======================================================
   ADMIN COMMISSION PER COMPANY
====================================================== */
router.get("/admin-commission-per-company", auth, async (req, res) => {
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
            $sum: { $multiply: ["$items.price", "$items.quantity"] },
          },
          adminCommission: {
            $sum: {
              $multiply: [
                { $multiply: ["$items.price", "$items.quantity"] },
                { $divide: [{ $ifNull: ["$product.commission_rate", 5] }, 100] },
              ],
            },
          },
        },
      },

      {
        $project: {
          _id: 0,
          company: "$_id",
          totalQty: 1,
          totalSales: { $round: ["$totalSales", 2] },
          adminCommission: { $round: ["$adminCommission", 2] },
        },
      },

      { $sort: { adminCommission: -1 } },
    ]);

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ======================================================
   DASHBOARD STATS
====================================================== */
router.get("/stats", auth, async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const deliveredOrders = await Order.countDocuments({ orderStatus: "Delivered" });
    const pendingOrders = await Order.countDocuments({ orderStatus: "Pending" });
    const cancelledOrders = await Order.countDocuments({ orderStatus: "Cancelled" });

    const commissionAgg = await Order.aggregate([
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
          _id: null,
          totalCommission: {
            $sum: {
              $multiply: [
                { $multiply: ["$items.price", "$items.quantity"] },
                { $divide: [{ $ifNull: ["$product.commission_rate", 5] }, 100] },
              ],
            },
          },
        },
      },
    ]);

    res.json({
      totalOrders,
      deliveredOrders,
      pendingOrders,
      cancelledOrders,
      totalCommission: (commissionAgg[0]?.totalCommission || 0).toFixed(2),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ======================================================
   MONTHLY ADMIN COMMISSION (CHART)
====================================================== */
router.get("/admin-commission", auth, async (req, res) => {
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
          _id: { month: { $month: "$createdAt" } },
          totalCommission: {
            $sum: {
              $multiply: [
                { $multiply: ["$items.price", "$items.quantity"] },
                { $divide: [{ $ifNull: ["$product.commission_rate", 5] }, 100] },
              ],
            },
          },
        },
      },
      { $sort: { "_id.month": 1 } },
    ]);

    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

    res.json(
      data.map(d => ({
        month: months[d._id.month - 1],
        totalCommission: d.totalCommission.toFixed(2),
      }))
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ======================================================
   DAILY & MONTHLY INCOME
====================================================== */
router.get("/income-summary", auth, async (req, res) => {
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
        $lookup: {
          from: "products",
          localField: "items.productId",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $project: {
          createdAt: 1,
          adminCommission: {
            $multiply: [
              { $multiply: ["$items.price", "$items.quantity"] },
              { $divide: [{ $ifNull: ["$product.commission_rate", 5] }, 100] },
            ],
          },
        },
      },
    ]);

    const dailyIncome = data
      .filter(d => d.createdAt >= startOfToday)
      .reduce((s, d) => s + d.adminCommission, 0);

    const monthlyIncome = data
      .filter(d => d.createdAt >= startOfMonth)
      .reduce((s, d) => s + d.adminCommission, 0);

    res.json({
      dailyIncome: dailyIncome.toFixed(2),
      monthlyIncome: monthlyIncome.toFixed(2),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.get("/product-wise-commission", auth, async (req, res) => {
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
          name: { $first: "$product.name" },
          company: { $first: "$product.company" },
          totalQty: { $sum: "$items.quantity" },
          totalSales: {
            $sum: { $multiply: ["$items.price", "$items.quantity"] },
          },
          adminCommission: {
            $sum: {
              $multiply: [
                { $multiply: ["$items.price", "$items.quantity"] },
                {
                  $divide: [
                    { $ifNull: ["$product.commission_rate", 5] },
                    100,
                  ],
                },
              ],
            },
          },
        },
      },

      {
        $project: {
          _id: 0,
          name: 1,
          company: 1,
          totalQty: 1,
          totalSales: { $round: ["$totalSales", 2] },
          adminCommission: { $round: ["$adminCommission", 2] },
          vendorEarning: {
            $round: [
              { $subtract: ["$totalSales", "$adminCommission"] },
              2,
            ],
          },
        },
      },

      { $sort: { totalSales: -1 } },
    ]);

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});
module.exports = router;
