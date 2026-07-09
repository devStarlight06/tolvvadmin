// Router/couponRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const Coupon = require("../Models/Coupon");
const Product = require("../Models/Product");
const path = require("path");
const fs = require("fs");

console.log("🚀 Loading couponRoutes.js...");

// ==================== MULTER CONFIGURATION ====================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = "uploads/coupons/";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, "coupon-" + uniqueSuffix + ext);
  },
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only images are allowed"), false);
    }
  }
});

// ==================== TEST ROUTE (ADD THIS) ====================
router.get("/test", (req, res) => {
  console.log("✅ Test route hit!");
  res.json({
    success: true,
    message: "Coupon routes are working!",
    timestamp: new Date().toISOString()
  });
});

// ==================== GET ALL COUPONS ====================
router.get("/", async (req, res) => {
  try {
    console.log("📦 GET /coupons called");
    
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    
    console.log(`✅ Found ${coupons.length} coupons`);
    
    res.status(200).json({
      success: true,
      data: coupons,
      total: coupons.length,
    });
  } catch (error) {
    console.error("❌ Error fetching coupons:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==================== CREATE COUPON ====================
router.post("/", upload.single("bannerImage"), async (req, res) => {
  try {
    console.log("📦 POST /coupons called");
    console.log("Request body:", req.body);
    
    const {
      code,
      type,
      value,
      minPurchase,
      maxDiscount,
      applicableProducts,
      applicableCategories,
      applicableSunSigns,
      usageLimit,
      perUserLimit,
      startDate,
      endDate,
      isActive,
      applicableUsers,
      newUsersOnly,
      description,
    } = req.body;

    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({
        success: false,
        message: "Coupon code already exists",
      });
    }

    // Handle banner image
    let bannerImage = "";
    if (req.file) {
      bannerImage = req.file.path;
    }

    // Parse arrays
    const parseArray = (data) => {
      if (!data) return [];
      if (typeof data === 'string') {
        try {
          return JSON.parse(data);
        } catch {
          return data.split(',').map(item => item.trim());
        }
      }
      return data;
    };

    const coupon = new Coupon({
      code: code.toUpperCase(),
      type,
      value: parseFloat(value),
      minPurchase: minPurchase ? parseFloat(minPurchase) : 0,
      maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
      applicableProducts: parseArray(applicableProducts),
      applicableCategories: parseArray(applicableCategories),
      applicableSunSigns: parseArray(applicableSunSigns),
      usageLimit: usageLimit ? parseInt(usageLimit) : null,
      perUserLimit: perUserLimit ? parseInt(perUserLimit) : 1,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isActive: isActive !== undefined ? isActive === "true" || isActive === true : true,
      applicableUsers: parseArray(applicableUsers),
      newUsersOnly: newUsersOnly === "true" || newUsersOnly === true,
      description: description || "",
      bannerImage,
    });

    await coupon.save();

    res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      data: coupon,
    });
  } catch (error) {
    console.error("❌ Error creating coupon:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// ==================== GET SINGLE COUPON ====================
router.get("/:id", async (req, res) => {
  try {
    console.log(`📦 GET /coupons/${req.params.id} called`);
    
    const coupon = await Coupon.findById(req.params.id);
    
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    const couponObj = coupon.toObject();
    couponObj.isExpired = coupon.isExpired;
    couponObj.isAvailable = coupon.isAvailable;

    res.status(200).json({
      success: true,
      data: couponObj,
    });
  } catch (error) {
    console.error("❌ Error fetching coupon:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// ==================== UPDATE COUPON ====================
router.put("/:id", upload.single("bannerImage"), async (req, res) => {
  try {
    console.log(`📦 PUT /coupons/${req.params.id} called`);
    
    const couponId = req.params.id;
    const updateData = { ...req.body };

    const existingCoupon = await Coupon.findById(couponId);
    if (!existingCoupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    // Handle image update
    if (req.file) {
      if (existingCoupon.bannerImage && fs.existsSync(existingCoupon.bannerImage)) {
        fs.unlinkSync(existingCoupon.bannerImage);
      }
      updateData.bannerImage = req.file.path;
    }

    // Parse arrays
    const parseArray = (data) => {
      if (!data) return [];
      if (typeof data === 'string') {
        try {
          return JSON.parse(data);
        } catch {
          return data.split(',').map(item => item.trim());
        }
      }
      return data;
    };

    if (updateData.value) updateData.value = parseFloat(updateData.value);
    if (updateData.minPurchase) updateData.minPurchase = parseFloat(updateData.minPurchase);
    if (updateData.maxDiscount) updateData.maxDiscount = parseFloat(updateData.maxDiscount);
    if (updateData.usageLimit) updateData.usageLimit = parseInt(updateData.usageLimit);
    if (updateData.perUserLimit) updateData.perUserLimit = parseInt(updateData.perUserLimit);
    
    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);
    
    if (updateData.isActive !== undefined) {
      updateData.isActive = updateData.isActive === "true" || updateData.isActive === true;
    }
    if (updateData.newUsersOnly !== undefined) {
      updateData.newUsersOnly = updateData.newUsersOnly === "true" || updateData.newUsersOnly === true;
    }

    if (updateData.applicableProducts) {
      updateData.applicableProducts = parseArray(updateData.applicableProducts);
    }
    if (updateData.applicableCategories) {
      updateData.applicableCategories = parseArray(updateData.applicableCategories);
    }
    if (updateData.applicableSunSigns) {
      updateData.applicableSunSigns = parseArray(updateData.applicableSunSigns);
    }
    if (updateData.applicableUsers) {
      updateData.applicableUsers = parseArray(updateData.applicableUsers);
    }

    if (updateData.code) {
      updateData.code = updateData.code.toUpperCase();
    }

    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) delete updateData[key];
    });

    const coupon = await Coupon.findByIdAndUpdate(
      couponId,
      updateData,
      {
        new: true,
        runValidators: true,
        context: "query",
      }
    );

    res.status(200).json({
      success: true,
      message: "Coupon updated successfully",
      data: coupon,
    });
  } catch (error) {
    console.error("❌ Error updating coupon:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// ==================== TOGGLE COUPON STATUS ====================
router.patch("/:id/toggle-status", async (req, res) => {
  try {
    console.log(`📦 PATCH /coupons/${req.params.id}/toggle-status called`);
    
    const { id } = req.params;
    
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    res.status(200).json({
      success: true,
      message: `Coupon ${coupon.isActive ? "activated" : "deactivated"} successfully`,
      data: { isActive: coupon.isActive },
    });
  } catch (error) {
    console.error("❌ Error toggling status:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// ==================== DELETE COUPON ====================
router.delete("/:id", async (req, res) => {
  try {
    console.log(`📦 DELETE /coupons/${req.params.id} called`);
    
    const coupon = await Coupon.findById(req.params.id);
    
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    if (coupon.bannerImage && fs.existsSync(coupon.bannerImage)) {
      fs.unlinkSync(coupon.bannerImage);
    }

    await Coupon.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Coupon deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting coupon:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

console.log("✅ couponRoutes.js loaded successfully");
module.exports = router;