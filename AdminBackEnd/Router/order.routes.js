const express = require("express");
const Order = require("../Models/Order");
const Product = require("../Models/Product");
const auth = require("../Middleware/auth");

const router = express.Router();

/* ================= GET ALL ORDERS ================= */
router.get("/orders", auth, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ================= CREATE ORDER ================= */
router.post("/", auth, async (req, res) => {
  try {
    const { items } = req.body;

    let totalAdminCommission = 0;
    let totalOrderPrice = 0;

    const processedItems = await Promise.all(
      items.map(async (item) => {
        const product = await Product.findById(item.productId);
        if (!product) {
          throw new Error(`Product ${item.productId} not found`);
        }

        const lineTotal = product.price * item.qty;
        const rate = product.commission_rate || 2;

        const adminShare = (lineTotal * rate) / 100;
        const vendorShare = lineTotal - adminShare;

        totalAdminCommission += adminShare;
        totalOrderPrice += lineTotal;

        return {
          productId: product._id,
          vendorId: product.vendorId,
          name: product.name,
          price: product.price,
          quantity: item.qty,
          company: product.company,
          commission_rate: rate,
          adminShare: Number(adminShare.toFixed(2)),
          vendorShare: Number(vendorShare.toFixed(2)),
        };
      })
    );

    const order = new Order({
      customer: req.user?.name || "Customer",
      items: processedItems,
      totalPrice: Number(totalOrderPrice.toFixed(2)),
      adminCommission: Number(totalAdminCommission.toFixed(2)),
      orderStatus: "Pending",
    });

    await order.save();
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ================= UPDATE ORDER STATUS ================= */
router.put("/orders/:id/status", auth, async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { orderStatus: status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
