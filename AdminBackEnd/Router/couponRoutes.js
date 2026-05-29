// routes/couponRoutes.js
const express = require("express");
const router = express.Router();

const Coupon = require("../models/Coupon");

// ==============================
// ADD COUPON
// ==============================
router.post("/admin/coupon", async (req, res) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      minOrderAmount,
      expiryDate,
    } = req.body;

    // Check coupon already exists
    const existingCoupon = await Coupon.findOne({
      code: code.toUpperCase(),
    });

    if (existingCoupon) {
      return res.status(400).json({
        success: false,
        message: "Coupon already exists",
      });
    }

    const coupon = new Coupon({
      code: code.toUpperCase(),
      discountType,
      discountValue,
      minOrderAmount,
      expiryDate,
    });

    await coupon.save();

    res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      coupon,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

module.exports = router;