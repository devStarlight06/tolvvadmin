const express = require("express");
const PDFDocument = require("pdfkit");
const Order = require("../Models/Order");
const auth = require("../Middleware/auth");

const router = express.Router();

/* ================= INVOICE PDF ================= */
router.get("/orders/:id/invoice", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // ✅ IMPORTANT HEADERS (ONLY ONCE)
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${order._id}.pdf`
    );

    const doc = new PDFDocument({ margin: 50 });

    // ✅ Pipe BEFORE writing
    doc.pipe(res);

    /* ================= PDF CONTENT ================= */

    doc.fontSize(20).text("INVOICE", { align: "center" });
    doc.moveDown();

    doc.fontSize(12).text(`Order ID: ${order._id}`);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`);
    doc.moveDown();

    doc.text("Customer Details", { underline: true });
    doc.text(order.shippingAddress.name);
    doc.text(order.shippingAddress.email);
    doc.text(order.shippingAddress.phone);
    doc.moveDown();

    doc.text("Shipping Address", { underline: true });
    doc.text(order.shippingAddress.address);
    doc.text(
      `${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`
    );
    doc.text(order.shippingAddress.country);
    doc.moveDown();

    doc.text("Products", { underline: true });
    order.items.forEach((item) => {
      doc.text(
        `${item.name} × ${item.quantity} — ₹${item.price * item.quantity}`
      );
    });

    doc.moveDown();
    doc.fontSize(14).text(`Total: ₹${order.totalPrice}`, {
      align: "right",
    });

    /* ================= END PDF ================= */
    doc.end(); // ✅ ONLY THIS ENDS RESPONSE

  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.status(500).json({ message: "Invoice generation failed" });
    }
  }
});

module.exports = router;
