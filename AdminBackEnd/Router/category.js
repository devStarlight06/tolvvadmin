const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Category = require("../models/Category");
const auth = require("../Middleware/auth");
const role = require("../Middleware/role");

const router = express.Router();

// ---------------- MULTER CONFIG FOR CATEGORY IMAGES ----------------
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, "../public/images/categories");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only images are allowed'));
  }
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

// ============ CATEGORY CRUD OPERATIONS ============

// ✅ GET ALL CATEGORIES (Public - Active only)
router.get("/categories", async (req, res) => {
  try {
    const categories = await Category.find({ status: "active" }).sort({ createdAt: -1 });
    res.json({
      success: true,
      categories
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
});

// ✅ GET ALL CATEGORIES FOR ADMIN (Includes inactive)
router.get("/admin/categories", auth, role(["Admin"]), async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      categories
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
});

// ✅ GET SINGLE CATEGORY
router.get("/category/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ 
        success: false,
        message: "Category not found" 
      });
    }
    res.json({
      success: true,
      category
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
});

// ✅ CREATE CATEGORY (Admin only) - FIXED VERSION
router.post("/category", auth, role(["Admin"]), upload.single("image"), async (req, res) => {
  try {
    const { name, description, status } = req.body;

    if (!name) {
      return res.status(400).json({ 
        success: false,
        message: "Category name is required" 
      });
    }

    // Check if category already exists (case insensitive)
    const existingCategory = await Category.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    });
    
    if (existingCategory) {
      return res.status(400).json({ 
        success: false,
        message: "Category with this name already exists" 
      });
    }

    // Prepare category data
    const categoryData = {
      name: name.trim(),
      description: description || "",
      status: status || "active"
    };

    // Add image if uploaded
    if (req.file) {
      categoryData.image = `/images/categories/${req.file.filename}`;
    }

    // Create category
    const category = new Category(categoryData);
    await category.save();

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      category
    });
  } catch (err) {
    console.error("Create category error:", err);
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
});

// ✅ UPDATE CATEGORY (Admin only) - FIXED VERSION
router.put("/category/:id", auth, role(["Admin"]), upload.single("image"), async (req, res) => {
  try {
    const { name, description, status } = req.body;
    const categoryId = req.params.id;

    // Find existing category
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ 
        success: false,
        message: "Category not found" 
      });
    }

    // Check for duplicate name (excluding current category)
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: categoryId }
      });
      
      if (existingCategory) {
        return res.status(400).json({ 
          success: false,
          message: "Category with this name already exists" 
        });
      }
    }

    // Prepare update data
    const updateData = {
      name: name ? name.trim() : category.name,
      description: description !== undefined ? description : category.description,
      status: status || category.status
    };

    // Update image if new file uploaded
    if (req.file) {
      // Delete old image if exists
      if (category.image && fs.existsSync(path.join(__dirname, "../public", category.image))) {
        try {
          fs.unlinkSync(path.join(__dirname, "../public", category.image));
        } catch (unlinkErr) {
          console.error("Error deleting old image:", unlinkErr);
        }
      }
      updateData.image = `/images/categories/${req.file.filename}`;
    }

    // Update category
    const updatedCategory = await Category.findByIdAndUpdate(
      categoryId,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: "Category updated successfully",
      category: updatedCategory
    });
  } catch (err) {
    console.error("Update category error:", err);
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
});

// ✅ DELETE CATEGORY (Admin only) - FIXED VERSION
router.delete("/category/:id", auth, role(["Admin"]), async (req, res) => {
  try {
    const categoryId = req.params.id;
    const category = await Category.findById(categoryId);
    
    if (!category) {
      return res.status(404).json({ 
        success: false,
        message: "Category not found" 
      });
    }

    // Delete category image if exists
    if (category.image && fs.existsSync(path.join(__dirname, "../public", category.image))) {
      try {
        fs.unlinkSync(path.join(__dirname, "../public", category.image));
      } catch (unlinkErr) {
        console.error("Error deleting image:", unlinkErr);
      }
    }

    await Category.findByIdAndDelete(categoryId);

    res.json({
      success: true,
      message: "Category deleted successfully"
    });
  } catch (err) {
    console.error("Delete category error:", err);
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
});

// ✅ UPDATE CATEGORY STATUS (Admin only) - FIXED VERSION
router.patch("/category/:id/status", auth, role(["Admin"]), async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status || !["active", "inactive"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Valid status (active/inactive) is required"
      });
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { status: status },
      { new: true }
    );
    
    if (!category) {
      return res.status(404).json({ 
        success: false,
        message: "Category not found" 
      });
    }

    res.json({
      success: true,
      message: `Category ${status === "active" ? "activated" : "deactivated"} successfully`,
      category
    });
  } catch (err) {
    console.error("Status update error:", err);
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
});

// ✅ TEST ROUTE (Without image upload for testing)
router.post("/category-test", auth, role(["Admin"]), async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ 
        success: false,
        message: "Category name is required" 
      });
    }

    // Check if category exists
    const existingCategory = await Category.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    });
    
    if (existingCategory) {
      return res.status(400).json({ 
        success: false,
        message: "Category already exists" 
      });
    }

    const category = new Category({
      name: name.trim(),
      description: description || "",
      status: "active"
    });

    await category.save();

    res.status(201).json({
      success: true,
      message: "Category created successfully (test)",
      category
    });
  } catch (err) {
    console.error("Test create error:", err);
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
});

module.exports = router;