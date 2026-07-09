// Router/admin.routers.js
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const auth = require("../Middleware/auth");
const role = require("../Middleware/role");
const User = require("../Models/UserSchema");
const Product = require("../Models/Product");  // ← Your user-side Product model
const Order = require("../Models/Order");

dotenv.config();
const router = express.Router();

// ==================== ADMIN LOGIN ====================
const ADMIN = {
  email: "admin@tolvvsigns.com",
  password: "admin123",
  id: "ADMIN001",
  name: "Admin User",
  role: "Admin",
};

router.post("/auth/login", (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    if (email === ADMIN.email && password === ADMIN.password) {
      const token = jwt.sign(
        { 
          id: ADMIN.id, 
          role: ADMIN.role, 
          name: ADMIN.name,
          email: ADMIN.email 
        },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: process.env.JWT_EXPIRE || "7d" }
      );

      return res.json({
        success: true,
        token,
        user: {
          id: ADMIN.id,
          name: ADMIN.name,
          email: ADMIN.email,
          role: ADMIN.role,
        },
        message: "Login successful",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// ==================== ADMIN VERIFY TOKEN ====================
router.get("/auth/verify", auth, async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user,
      message: "Token is valid",
    });
  } catch (err) {
    console.error("Verify error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// ==================== ADMIN CHANGE PASSWORD ====================
router.post("/auth/change-password", auth, role(["Admin"]), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current and new password are required",
      });
    }

    if (req.user.id === ADMIN.id) {
      if (currentPassword !== ADMIN.password) {
        return res.status(401).json({
          success: false,
          message: "Current password is incorrect",
        });
      }
      ADMIN.password = newPassword;
      return res.json({
        success: true,
        message: "Password changed successfully",
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// ==================== PRODUCT SUMMARY ====================
router.get("/products-summary", auth, role(["Admin"]), async (req, res) => {
  try {
    const products = await Product.find();
    
    const categoryWiseProducts = {};
    const zodiacWiseProducts = {};

    products.forEach((p) => {
      // By Category
      if (p.Category) {
        if (!categoryWiseProducts[p.Category]) {
          categoryWiseProducts[p.Category] = {
            category: p.Category,
            products: [],
            count: 0,
          };
        }
        categoryWiseProducts[p.Category].products.push(p);
        categoryWiseProducts[p.Category].count++;
      }

      // By Zodiac
      if (p.Zodiac) {
        if (!zodiacWiseProducts[p.Zodiac]) {
          zodiacWiseProducts[p.Zodiac] = {
            zodiac: p.Zodiac,
            products: [],
            count: 0,
          };
        }
        zodiacWiseProducts[p.Zodiac].products.push(p);
        zodiacWiseProducts[p.Zodiac].count++;
      }
    });

    res.json({
      success: true,
      data: {
        totalProducts: products.length,
        byCategory: Object.values(categoryWiseProducts),
        byZodiac: Object.values(zodiacWiseProducts),
      },
    });
  } catch (err) {
    console.error("Products summary error:", err);
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
});

// ==================== ADMIN DASHBOARD STATS ====================
router.get("/dashboard-stats", auth, role(["Admin"]), async (req, res) => {
  try {
    const [
      totalProducts,
      totalOrders,
      totalCustomers,
      totalRevenue,
      recentOrders,
    ] = await Promise.all([
      Product.countDocuments(),
      Order.countDocuments(),
      Order.distinct("shippingAddress.email"),
      Order.aggregate([
        { $match: { orderStatus: "Delivered" } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select("customOrderId totalAmount orderStatus createdAt"),
    ]);

    const ordersByStatus = await Order.aggregate([
      { $group: { _id: "$orderStatus", count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      data: {
        totalProducts,
        totalOrders,
        totalCustomers: totalCustomers.length,
        totalRevenue: totalRevenue[0]?.total || 0,
        recentOrders,
        ordersByStatus,
      },
    });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// ==================== GET ALL PRODUCTS ====================
router.get("/products", auth, role(["Admin"]), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      category,
      zodiac,
      minPrice,
      maxPrice,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const filter = {};
    if (category) filter.Category = category;
    if (zodiac) filter.Zodiac = zodiac;
    if (minPrice || maxPrice) {
      filter.ProductPrice = {};
      if (minPrice) filter.ProductPrice.$gte = parseFloat(minPrice);
      if (maxPrice) filter.ProductPrice.$lte = parseFloat(maxPrice);
    }
    if (search) {
      filter.$or = [
        { ProductName: { $regex: search, $options: "i" } },
        { Description: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = {};
    sort[sortBy === "price" ? "ProductPrice" : sortBy] = sortOrder === "asc" ? 1 : -1;

    const products = await Product.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(filter);

    res.json({
      success: true,
      data: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Get products error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// ==================== GET SINGLE PRODUCT ====================
router.get("/product/:id", auth, role(["Admin"]), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }
    res.json({
      success: true,
      data: product,
    });
  } catch (err) {
    console.error("Get product error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// ==================== CREATE PRODUCT ====================
router.post("/product", auth, role(["Admin"]), async (req, res) => {
  try {
    const {
      ProductName,
      ProductPrice,
      Category,
      Zodiac,
      Description,
      Image,
      size,
      color,
    } = req.body;

    // Validate required fields
    if (!ProductName || !ProductPrice) {
      return res.status(400).json({
        success: false,
        message: "ProductName and ProductPrice are required",
      });
    }

    const product = new Product({
      ProductName,
      ProductPrice: parseFloat(ProductPrice),
      Category: Category || "",
      Zodiac: Zodiac || "",
      Description: Description || "",
      Image: Image || "",
      size: size || "",
      color: color || "",
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (err) {
    console.error("Create product error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// ==================== UPDATE PRODUCT ====================
router.put("/product/:id", auth, role(["Admin"]), async (req, res) => {
  try {
    const productId = req.params.id;
    const updateData = { ...req.body };

    // Parse numeric fields
    if (updateData.ProductPrice) updateData.ProductPrice = parseFloat(updateData.ProductPrice);

    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) delete updateData[key];
    });

    const product = await Product.findByIdAndUpdate(
      productId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (err) {
    console.error("Update product error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// ==================== DELETE PRODUCT ====================
router.delete("/product/:id", auth, role(["Admin"]), async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (err) {
    console.error("Delete product error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// ==================== TOGGLE PRODUCT STATUS ====================
// Note: Your schema doesn't have isActive by default, so add it if needed
router.patch("/product/:id/toggle-status", auth, role(["Admin"]), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // If your schema has isActive field
    product.isActive = !product.isActive;
    await product.save();

    res.json({
      success: true,
      message: `Product ${product.isActive ? "activated" : "deactivated"} successfully`,
      data: product,
    });
  } catch (err) {
    console.error("Toggle status error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// ==================== BULK OPERATIONS ====================
router.patch("/products/bulk", auth, role(["Admin"]), async (req, res) => {
  try {
    const { productIds, updateData } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of product IDs",
      });
    }

    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide update data",
      });
    }

    if (updateData.ProductPrice) updateData.ProductPrice = parseFloat(updateData.ProductPrice);

    const result = await Product.updateMany(
      { _id: { $in: productIds } },
      { $set: updateData },
      { runValidators: true }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} products updated successfully`,
      data: { modifiedCount: result.modifiedCount },
    });
  } catch (err) {
    console.error("Bulk update error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

router.delete("/products/bulk", auth, role(["Admin"]), async (req, res) => {
  try {
    const { productIds } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of product IDs",
      });
    }

    const result = await Product.deleteMany({ _id: { $in: productIds } });

    res.json({
      success: true,
      message: `${result.deletedCount} products deleted successfully`,
      data: { deletedCount: result.deletedCount },
    });
  } catch (err) {
    console.error("Bulk delete error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = router;