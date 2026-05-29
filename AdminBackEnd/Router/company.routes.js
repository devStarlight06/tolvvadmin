const express = require("express");
const auth = require("../Middleware/auth");
const role = require("../Middleware/role");
const Company = require("../Models/Company");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// ---------------- MULTER CONFIG ----------------
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, "../public/images/company");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage });

// ---------------- GET all companies ----------------
router.get("/companies", auth, role(["Admin"]), async (req, res) => {
  try {
    const companies = await Company.find();
    res.json({ companies });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---------------- ADD a new company ----------------
router.post("/companies", auth, role(["Admin"]), upload.single("logo"), async (req, res) => {
  try {
    const companyData = {
      name: req.body.name,
      status: req.body.status,
      logo: req.file ? `/images/company/${req.file.filename}` : ""
    };
    const company = await Company.create(companyData);
    res.status(201).json({ company });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---------------- UPDATE a company ----------------
router.put("/companies/:id", auth, role(["Admin"]), upload.single("logo"), async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);

    const updateData = {
      name: req.body.name,
      status: req.body.status
    };

    if (req.file) {
      // Delete old logo if exists
      if (company.logo && fs.existsSync(path.join(__dirname, "../public", company.logo))) {
        fs.unlinkSync(path.join(__dirname, "../public", company.logo));
      }
      updateData.logo = `/images/company/${req.file.filename}`;
    }

    const updated = await Company.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json({ company: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ---------------- DELETE a company ----------------
router.delete("/companies/:id", auth, role(["Admin"]), async (req, res) => {
  try {
    await Company.findByIdAndDelete(req.params.id);
    res.json({ message: "Company deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
