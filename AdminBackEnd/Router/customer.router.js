// const express = require("express");
// const mongoose = require("mongoose");
// const Order = require("../Models/Order");
// const Vendor = require("../Models/vendor");
// const auth = require("../Middleware/auth");

// const router = express.Router();

// // Helper function to check if user is admin (case-insensitive)
// const isAdmin = (user) => {
//   return user && user.role && user.role.toLowerCase() === "admin";
// };

// // GET /api/customers - Get actual customers (people who placed orders)
// router.get("/", auth, async (req, res) => {
//   try {
//     console.log("User from token:", req.user);
    
//     // Check if user is admin (case-insensitive)
//     if (!isAdmin(req.user)) {
//       return res.status(403).json({ 
//         message: "Admin access required. Your role: " + req.user.role 
//       });
//     }

//     // Get unique customers from orders
//     const customers = await Order.aggregate([
//       {
//         $group: {
//           _id: "$guestId",
//           name: { $first: "$shippingAddress.name" },
//           email: { $first: "$shippingAddress.email" },
//           phone: { $first: "$shippingAddress.phone" },
//           totalSpent: { $sum: "$totalPrice" },
//           orderCount: { $sum: 1 },
//           lastOrderDate: { $max: "$createdAt" }
//         }
//       },
//       {
//         $project: {
//           _id: 0,
//           guestId: "$_id",
//           name: 1,
//           email: 1,
//           phone: 1,
//           totalSpent: 1,
//           orderCount: 1,
//           lastOrderDate: 1
//         }
//       },
//       { $sort: { lastOrderDate: -1 } }
//     ]);

//     res.json(customers);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: err.message });
//   }
// });

// // GET /api/customers/vendors - Get all vendors
// router.get("/vendors", auth, async (req, res) => {
//   try {
//     console.log("User from token:", req.user);
    
//     // Check if user is admin (case-insensitive)
//     if (!isAdmin(req.user)) {
//       return res.status(403).json({ 
//         message: "Admin access required. Your role: " + req.user.role 
//       });
//     }

//     const vendors = await Vendor.find({ role: "vendor" }).select(
//       "name email phone company createdAt"
//     );

//     res.json(vendors);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: err.message });
//   }
// });

// // POST /api/customers/vendors - Admin add new vendor
// router.post("/vendors", auth, async (req, res) => {
//   try {
//     console.log("User from token:", req.user);
    
//     // Check if user is admin (case-insensitive)
//     if (!isAdmin(req.user)) {
//       return res.status(403).json({ 
//         message: "Admin access required. Your role: " + req.user.role 
//       });
//     }

//     const { name, email, password, phone, company } = req.body;

//     // Validate required fields
//     if (!name || !email || !password) {
//       return res.status(400).json({ message: "Name, email and password are required" });
//     }

//     // Check if vendor already exists
//     const existingVendor = await Vendor.findOne({ email });
//     if (existingVendor) {
//       return res.status(400).json({ message: "Vendor with this email already exists" });
//     }

//     // Hash password
//     const bcrypt = require("bcryptjs");
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Create new vendor
//     const newVendor = new Vendor({
//       name,
//       email,
//       password: hashedPassword,
//       role: "vendor",
//       phone: phone || "",
//       company: company || ""
//     });

//     await newVendor.save();

//     // Return vendor without password
//     const vendorResponse = newVendor.toObject();
//     delete vendorResponse.password;

//     res.status(201).json({ 
//       success: true, 
//       message: "Vendor added successfully",
//       vendor: vendorResponse 
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: err.message });
//   }
// });

// // PUT /api/customers/vendors/:id - Admin update vendor
// router.put("/vendors/:id", auth, async (req, res) => {
//   try {
//     if (!isAdmin(req.user)) {
//       return res.status(403).json({ message: "Admin access required" });
//     }

//     const { name, email, phone, company } = req.body;
//     const vendorId = req.params.id;

//     const updatedVendor = await Vendor.findByIdAndUpdate(
//       vendorId,
//       { name, email, phone, company },
//       { new: true, runValidators: true }
//     ).select("-password");

//     if (!updatedVendor) {
//       return res.status(404).json({ message: "Vendor not found" });
//     }

//     res.json({ 
//       success: true, 
//       message: "Vendor updated successfully",
//       vendor: updatedVendor 
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: err.message });
//   }
// });

// // DELETE /api/customers/vendors/:id - Admin delete vendor
// router.delete("/vendors/:id", auth, async (req, res) => {
//   try {
//     if (!isAdmin(req.user)) {
//       return res.status(403).json({ message: "Admin access required" });
//     }

//     const vendorId = req.params.id;
//     const deletedVendor = await Vendor.findByIdAndDelete(vendorId);

//     if (!deletedVendor) {
//       return res.status(404).json({ message: "Vendor not found" });
//     }

//     res.json({ 
//       success: true, 
//       message: "Vendor deleted successfully" 
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: err.message });
//   }
// });

// module.exports = router;


const express = require("express");
const mongoose = require("mongoose");
const Order = require("../Models/Order");
const Vendor = require("../Models/vendor");
const auth = require("../Middleware/auth");

const router = express.Router();

// Helper function to check if user is admin (case-insensitive)
const isAdmin = (user) => {
  return user && user.role && user.role.toLowerCase() === "admin";
};

// GET /api/customers - Get actual customers (grouped by email)
router.get("/", auth, async (req, res) => {
  try {
    console.log("User from token:", req.user);
    
    // Check if user is admin (case-insensitive)
    if (!isAdmin(req.user)) {
      return res.status(403).json({ 
        message: "Admin access required. Your role: " + req.user.role 
      });
    }

    // Get unique customers grouped by email
    const customers = await Order.aggregate([
      {
        // Group by email address (most reliable unique identifier)
        $group: {
          _id: "$shippingAddress.email",
          name: { $first: "$shippingAddress.name" },
          phone: { $first: "$shippingAddress.phone" },
          totalSpent: { $sum: "$totalPrice" },
          orderCount: { $sum: 1 },
          lastOrderDate: { $max: "$createdAt" },
          // Collect unique guestIds (optional)
          guestIds: { $addToSet: "$guestId" }
        }
      },
      {
        $project: {
          _id: 0,
          email: "$_id",
          name: 1,
          phone: 1,
          totalSpent: 1,
          orderCount: 1,
          lastOrderDate: 1,
          guestIds: 1
        }
      },
      { $sort: { lastOrderDate: -1 } }
    ]);

    res.json(customers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// Alternative: Get customers grouped by name and email combination
router.get("/by-name", auth, async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: "Admin access required" });
    }

    // Group by name and email combination for more accurate grouping
    const customers = await Order.aggregate([
      {
        $group: {
          _id: {
            email: "$shippingAddress.email",
            name: "$shippingAddress.name"
          },
          phone: { $first: "$shippingAddress.phone" },
          totalSpent: { $sum: "$totalPrice" },
          orderCount: { $sum: 1 },
          lastOrderDate: { $max: "$createdAt" },
          orders: { 
            $push: {
              orderId: "$_id",
              date: "$createdAt",
              amount: "$totalPrice"
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          name: "$_id.name",
          email: "$_id.email",
          phone: 1,
          totalSpent: 1,
          orderCount: 1,
          lastOrderDate: 1,
          recentOrders: { $slice: ["$orders", 5] }
        }
      },
      { $sort: { totalSpent: -1 } }
    ]);

    res.json(customers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/customers/vendors - Get all vendors
router.get("/vendors", auth, async (req, res) => {
  try {
    console.log("User from token:", req.user);
    
    // Check if user is admin (case-insensitive)
    if (!isAdmin(req.user)) {
      return res.status(403).json({ 
        message: "Admin access required. Your role: " + req.user.role 
      });
    }

    const vendors = await Vendor.find({ role: "vendor" }).select(
      "name email phone company createdAt"
    );

    res.json(vendors);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/customers/vendors - Admin add new vendor
router.post("/vendors", auth, async (req, res) => {
  try {
    console.log("User from token:", req.user);
    
    // Check if user is admin (case-insensitive)
    if (!isAdmin(req.user)) {
      return res.status(403).json({ 
        message: "Admin access required. Your role: " + req.user.role 
      });
    }

    const { name, email, password, phone, company } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    // Check if vendor already exists
    const existingVendor = await Vendor.findOne({ email });
    if (existingVendor) {
      return res.status(400).json({ message: "Vendor with this email already exists" });
    }

    // Hash password
    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new vendor
    const newVendor = new Vendor({
      name,
      email,
      password: hashedPassword,
      role: "vendor",
      phone: phone || "",
      company: company || ""
    });

    await newVendor.save();

    // Return vendor without password
    const vendorResponse = newVendor.toObject();
    delete vendorResponse.password;

    res.status(201).json({ 
      success: true, 
      message: "Vendor added successfully",
      vendor: vendorResponse 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/customers/vendors/:id - Admin update vendor
router.put("/vendors/:id", auth, async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { name, email, phone, company } = req.body;
    const vendorId = req.params.id;

    const updatedVendor = await Vendor.findByIdAndUpdate(
      vendorId,
      { name, email, phone, company },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedVendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    res.json({ 
      success: true, 
      message: "Vendor updated successfully",
      vendor: updatedVendor 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/customers/vendors/:id - Admin delete vendor
router.delete("/vendors/:id", auth, async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const vendorId = req.params.id;
    const deletedVendor = await Vendor.findByIdAndDelete(vendorId);

    if (!deletedVendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    res.json({ 
      success: true, 
      message: "Vendor deleted successfully" 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;