// routes/productRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const Product = require("../Models/Product");
const path = require("path");
const fs = require("fs");

// ==================== MULTER CONFIGURATION ====================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = "uploads/products/";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only images are allowed"), false);
    }
  }
});

// ==================== CREATE PRODUCT ====================
router.post("/products", upload.array("images", 5), async (req, res) => {
  try {
    const {
      name,
      price,
      description,
      category,
      sunSign,
      rulingPlanet,
      benefits,
      stock,
      isActive,
      metaTitle,
      metaDescription,
      commission_rate,
    } = req.body;

    // Handle image uploads
    let images = [];
    let mainImage = "";
    
    if (req.files && req.files.length > 0) {
      images = req.files.map(file => file.path);
      mainImage = images[0];
    } else if (req.body.images) {
      images = typeof req.body.images === 'string' 
        ? JSON.parse(req.body.images) 
        : req.body.images;
      mainImage = images[0] || "";
    }

    // Validate required fields
    if (!name) return res.status(400).json({ success: false, message: "Product name is required" });
    if (!price) return res.status(400).json({ success: false, message: "Price is required" });
    if (!description) return res.status(400).json({ success: false, message: "Description is required" });
    if (!category) return res.status(400).json({ success: false, message: "Category is required" });
    if (!sunSign) return res.status(400).json({ success: false, message: "Sun sign is required" });
    if (!rulingPlanet) return res.status(400).json({ success: false, message: "Ruling planet is required" });

    // Create product
    const product = new Product({
      name,
      price: parseFloat(price),
      description,
      category,
      sunSign,
      rulingPlanet,
      benefits: benefits || "",
      images,
      mainImage,
      stock: parseInt(stock) || 0,
      isActive: isActive !== undefined ? isActive === "true" || isActive === true : true,
      metaTitle: metaTitle || `Buy ${name} | TOLVV`,
      metaDescription: metaDescription || description?.substring(0, 160) || "",
      commission_rate: parseFloat(commission_rate) || 5,
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: "Product added successfully",
      data: product,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// ==================== GET ALL PRODUCTS (with filters & pagination) ====================
router.get("/products", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      category,
      sunSign,
      rulingPlanet,
      isActive,
      minPrice,
      maxPrice,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build filter
    const filter = {};
    if (category) filter.category = category;
    if (sunSign) filter.sunSign = sunSign;
    if (rulingPlanet) filter.rulingPlanet = rulingPlanet;
    if (isActive !== undefined) filter.isActive = isActive === "true";
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }
    if (search) {
      filter.$text = { $search: search };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Execute query
    const products = await Product.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// ==================== GET PRODUCT STATS ====================
router.get("/products/stats", async (req, res) => {
  try {
    const [
      totalProducts,
      activeProducts,
      lowStockProducts,
      totalByCategory,
      totalBySunSign,
    ] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({ stock: { $lt: 10 }, isActive: true }),
      Product.aggregate([
        { $group: { _id: "$category", count: { $sum: 1 } } },
      ]),
      Product.aggregate([
        { $group: { _id: "$sunSign", count: { $sum: 1 } } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalProducts,
        activeProducts,
        lowStockProducts,
        byCategory: totalByCategory,
        bySunSign: totalBySunSign,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// ==================== GET PRODUCTS BY SUN SIGN ====================
router.get("/products/sun-sign/:sunSign", async (req, res) => {
  try {
    const { sunSign } = req.params;
    const { activeOnly = true } = req.query;

    const filter = { sunSign };
    if (activeOnly === "true") filter.isActive = true;

    const products = await Product.find(filter);

    res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// ==================== GET PRODUCTS BY CATEGORY ====================
router.get("/products/category/:category", async (req, res) => {
  try {
    const { category } = req.params;
    const products = await Product.find({ 
      category, 
      isActive: true 
    });

    res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// ==================== GET SINGLE PRODUCT ====================
router.get("/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// ==================== UPDATE PRODUCT ====================
router.put("/products/:id", upload.array("images", 5), async (req, res) => {
  try {
    const productId = req.params.id;
    const updateData = { ...req.body };

    // Check if product exists
    const existingProduct = await Product.findById(productId);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Handle image updates
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => file.path);
      
      // If replacing all images
      if (req.body.replaceImages === "true") {
        updateData.images = newImages;
        updateData.mainImage = newImages[0] || "";
      } else {
        // Append to existing images
        updateData.images = [...(existingProduct.images || []), ...newImages];
        updateData.mainImage = updateData.images[0] || "";
      }
    }

    // Parse numeric fields
    if (updateData.price) updateData.price = parseFloat(updateData.price);
    if (updateData.stock) updateData.stock = parseInt(updateData.stock);
    if (updateData.commission_rate) updateData.commission_rate = parseFloat(updateData.commission_rate);
    
    // Handle isActive boolean
    if (updateData.isActive !== undefined) {
      updateData.isActive = updateData.isActive === "true" || updateData.isActive === true;
    }

    // Auto-generate meta if name changed
    if (updateData.name) {
      updateData.metaTitle = `Buy ${updateData.name} | TOLVV`;
    }

    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) delete updateData[key];
    });

    const product = await Product.findByIdAndUpdate(
      productId,
      updateData,
      {
        new: true,
        runValidators: true,
        context: "query",
      }
    );

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// ==================== UPDATE STOCK ====================
router.patch("/products/:id/stock", async (req, res) => {
  try {
    const { id } = req.params;
    const { stock, operation } = req.body;

    if (stock === undefined) {
      return res.status(400).json({
        success: false,
        message: "Stock value is required",
      });
    }

    let product;
    if (operation === "increment") {
      product = await Product.findByIdAndUpdate(
        id,
        { $inc: { stock: parseInt(stock) } },
        { new: true, runValidators: true }
      );
    } else if (operation === "decrement") {
      product = await Product.findByIdAndUpdate(
        id,
        { $inc: { stock: -parseInt(stock) } },
        { new: true, runValidators: true }
      );
    } else {
      product = await Product.findByIdAndUpdate(
        id,
        { stock: parseInt(stock) },
        { new: true, runValidators: true }
      );
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Stock updated successfully",
      data: { stock: product.stock },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// ==================== TOGGLE PRODUCT STATUS ====================
router.patch("/products/:id/toggle-status", async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    product.isActive = !product.isActive;
    await product.save();

    res.status(200).json({
      success: true,
      message: `Product ${product.isActive ? "activated" : "deactivated"} successfully`,
      data: { isActive: product.isActive },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// ==================== DELETE PRODUCT ====================
router.delete("/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Delete associated images from filesystem (optional)
    if (product.images && product.images.length > 0) {
      product.images.forEach(imagePath => {
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// ==================== BULK DELETE PRODUCTS ====================
router.delete("/products/bulk/delete", async (req, res) => {
  try {
    const { productIds } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of product IDs",
      });
    }

    // Get products to delete their images
    const products = await Product.find({ _id: { $in: productIds } });
    products.forEach(product => {
      if (product.images && product.images.length > 0) {
        product.images.forEach(imagePath => {
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }
        });
      }
    });

    const result = await Product.deleteMany({
      _id: { $in: productIds },
    });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} products deleted successfully`,
      data: { deletedCount: result.deletedCount },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// ==================== BULK UPDATE PRODUCTS ====================
router.patch("/products/bulk/update", async (req, res) => {
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

    // Parse numeric fields if present
    if (updateData.price) updateData.price = parseFloat(updateData.price);
    if (updateData.stock) updateData.stock = parseInt(updateData.stock);
    if (updateData.commission_rate) updateData.commission_rate = parseFloat(updateData.commission_rate);
    if (updateData.isActive !== undefined) {
      updateData.isActive = updateData.isActive === "true" || updateData.isActive === true;
    }

    const result = await Product.updateMany(
      { _id: { $in: productIds } },
      { $set: updateData },
      { runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} products updated successfully`,
      data: { modifiedCount: result.modifiedCount },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;