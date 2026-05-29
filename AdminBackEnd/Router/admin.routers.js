const express = require("express");
const auth = require("../Middleware/auth");
const role = require("../Middleware/role");
const Company = require("../Models/Company");
const Product = require("../Models/Product");

const router = express.Router();

// GET products grouped by company
router.get("/products-summary", auth, role(["Admin"]), async (req, res) => {
  try {
    const products = await Product.find();
    const companyWiseProducts = {};

    products.forEach((p) => {
      const companyName = p.company;
      if (!companyWiseProducts[companyName]) {
        companyWiseProducts[companyName] = { companyName, products: [] };
      }
      companyWiseProducts[companyName].products.push(p);
    });

    res.json({ companies: Object.values(companyWiseProducts) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add a product
router.post("/product", auth, role(["Admin"]), async (req, res) => {
  try {
    const { name, price, category, company, image, description } = req.body;
    const companyExists = await Company.findOne({ name: company });
    if (!companyExists) return res.status(400).json({ message: "Company not found" });

    const product = await Product.create({ name, price, category, company, image, description });
    res.status(201).json({ product });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete product
router.delete("/product/:id", auth, role(["Admin"]), async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update product
router.put("/product/:id", auth, role(["Admin"]), async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ product: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
