// routes/invoice.js
const express = require("express");
const PDFDocument = require("pdfkit");
const Order = require("../Models/Order");
const auth = require("../Middleware/auth");

const router = express.Router();

/* ================= INVOICE PDF ================= */
router.get("/orders/:id/invoice", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("userId", "name email");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Set headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${order.customOrderId || order._id}.pdf`
    );

    const doc = new PDFDocument({ 
      margin: 50,
      size: 'A4',
    });

    doc.pipe(res);

    // ================= HEADER =================
    doc
      .fontSize(24)
      .font("Helvetica-Bold")
      .fillColor("#1a1a1a")
      .text("TOLVV", { align: "center" })
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#666666")
      .text("Celestial. Ritualistic. Personal", { align: "center" })
      .moveDown(0.5)
      .text("Zodiac Inspired Bath & Body", { align: "center" })
      .moveDown();

    // ================= INVOICE TITLE =================
    doc
      .fontSize(18)
      .font("Helvetica-Bold")
      .fillColor("#1a1a1a")
      .text("INVOICE", { align: "center" })
      .moveDown(0.5);

    // ================= INVOICE INFO =================
    const startX = 50;
    const startY = doc.y;
    
    // Left column
    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#333333")
      .text(`Invoice #: ${order.customOrderId || order._id}`, startX, startY, { continued: true })
      .text(`  |  Date: ${new Date(order.createdAt).toLocaleDateString('en-IN', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      })}`);
    
    doc.text(`Payment Method: ${order.paymentMethod.toUpperCase()}`);
    doc.text(`Payment Status: ${order.status}`);
    doc.text(`Order Status: ${order.orderStatus}`);
    doc.moveDown(2);

    // ================= BILLING DETAILS =================
    // Box for customer details
    const boxY = doc.y;
    doc
      .rect(50, boxY, 495, 120)
      .strokeColor("#e0e0e0")
      .lineWidth(1)
      .stroke();
    
    // Customer Details
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .fillColor("#1a1a1a")
      .text("CUSTOMER DETAILS", 65, boxY + 8);
    
    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#333333")
      .text(`Name: ${order.customerName || order.address?.name || 'N/A'}`, 65, boxY + 30)
      .text(`Email: ${order.customerEmail || 'N/A'}`, 65, boxY + 48)
      .text(`Phone: ${order.address?.mobile || 'N/A'}`, 65, boxY + 66);

    // Shipping Address
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor("#1a1a1a")
      .text("SHIPPING ADDRESS", 300, boxY + 8);

    if (order.address) {
      const addr = order.address;
      const addressLines = [];
      if (addr.houseNumber) addressLines.push(addr.houseNumber);
      if (addr.buildingName) addressLines.push(addr.buildingName);
      if (addr.road) addressLines.push(addr.road);
      if (addr.landmark) addressLines.push(`Near: ${addr.landmark}`);
      
      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#333333")
        .text(addressLines.join(', ') || 'Address not provided', 300, boxY + 30, { width: 230 })
        .text(`${addr.city || ''}${addr.city && addr.state ? ', ' : ''}${addr.state || ''}${(addr.city || addr.state) && addr.pincode ? ' - ' : ''}${addr.pincode || ''}`, 300, boxY + 48)
        .text(`Phone: ${addr.mobile || 'N/A'}`, 300, boxY + 66);
    }

    doc.moveDown(2);
    doc.y = boxY + 140;

    // ================= ITEMS TABLE =================
    const tableTop = doc.y + 10;
    const tableHeaders = ['#', 'Item', 'Quantity', 'Price', 'Total'];
    const columnWidths = [30, 220, 70, 70, 90];
    const startXTable = 50;

    // Table Header
    doc
      .rect(startXTable, tableTop - 5, 495, 25)
      .fillColor("#f5f5f5")
      .fill();
    
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor("#1a1a1a");
    
    let xPos = startXTable;
    tableHeaders.forEach((header, i) => {
      doc.text(header, xPos + 5, tableTop + 2, { 
        width: columnWidths[i] - 10,
        align: i === 0 ? 'center' : i === 1 ? 'left' : 'right'
      });
      xPos += columnWidths[i];
    });

    // Table Rows
    let rowY = tableTop + 28;
    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor("#333333");

    order.items.forEach((item, index) => {
      // Check if we need a new page
      if (rowY > 700) {
        doc.addPage();
        rowY = 50;
        
        // Redraw header on new page
        doc
          .fontSize(10)
          .font("Helvetica-Bold")
          .fillColor("#1a1a1a");
        
        xPos = startXTable;
        tableHeaders.forEach((header, i) => {
          doc.text(header, xPos + 5, rowY, { 
            width: columnWidths[i] - 10,
            align: i === 0 ? 'center' : i === 1 ? 'left' : 'right'
          });
          xPos += columnWidths[i];
        });
        rowY += 25;
      }

      const itemTotal = item.priceAtBuy * item.quantity;
      
      // Row background for alternating rows
      if (index % 2 === 0) {
        doc
          .rect(startXTable, rowY - 3, 495, 20)
          .fillColor("#fafafa")
          .fill();
      }

      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor("#333333");

      xPos = startXTable;
      
      // # (Index)
      doc.text((index + 1).toString(), xPos + 5, rowY, { 
        width: columnWidths[0] - 10,
        align: 'center'
      });
      xPos += columnWidths[0];

      // Item Name
      const itemName = item.isFree ? `${item.productName} (FREE)` : item.productName;
      doc.text(itemName, xPos + 5, rowY, { 
        width: columnWidths[1] - 10,
        align: 'left'
      });
      xPos += columnWidths[1];

      // Quantity
      doc.text(item.quantity.toString(), xPos + 5, rowY, { 
        width: columnWidths[2] - 10,
        align: 'right'
      });
      xPos += columnWidths[2];

      // Price
      doc.text(`₹${item.priceAtBuy.toFixed(2)}`, xPos + 5, rowY, { 
        width: columnWidths[3] - 10,
        align: 'right'
      });
      xPos += columnWidths[3];

      // Total
      doc.text(`₹${itemTotal.toFixed(2)}`, xPos + 5, rowY, { 
        width: columnWidths[4] - 10,
        align: 'right'
      });

      // If item has hamper items, show them as sub-items
      if (item.hamperItems && item.hamperItems.length > 0) {
        rowY += 15;
        doc
          .fontSize(8)
          .fillColor("#666666");
        
        item.hamperItems.forEach((hItem, hIndex) => {
          doc.text(`  └ ${hItem.name || 'Item'} × ${hItem.quantity || 0}${hItem.isFree ? ' (FREE)' : ''}`, 
            startXTable + 35, rowY, { width: 300 });
          rowY += 13;
        });
      }

      rowY += 22;
    });

    // ================= TOTAL SECTION =================
    const totalY = Math.max(rowY + 10, 400);
    
    // Summary box
    const summaryX = 350;
    const summaryY = totalY;
    
    doc
      .rect(summaryX, summaryY, 195, 120)
      .strokeColor("#e0e0e0")
      .lineWidth(1)
      .stroke();

    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#333333")
      .text("Subtotal:", summaryX + 15, summaryY + 15, { width: 80, align: 'left' })
      .text(`₹${order.subtotal?.toFixed(2) || '0.00'}`, summaryX + 95, summaryY + 15, { width: 85, align: 'right' });

    if (order.discount && order.discount > 0) {
      doc
        .text(`Discount (${order.couponCode || 'Coupon'}):`, summaryX + 15, summaryY + 40, { width: 80, align: 'left' })
        .fillColor("#4CAF50")
        .text(`-₹${order.discount.toFixed(2)}`, summaryX + 95, summaryY + 40, { width: 85, align: 'right' });
    }

    if (order.shippingCost && order.shippingCost > 0) {
      doc
        .fillColor("#333333")
        .text("Shipping:", summaryX + 15, summaryY + 65, { width: 80, align: 'left' })
        .text(`₹${order.shippingCost.toFixed(2)}`, summaryX + 95, summaryY + 65, { width: 85, align: 'right' });
    }

    // Total
    doc
      .rect(summaryX, summaryY + 85, 195, 30)
      .fillColor("#1a1a1a")
      .fill();

    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .fillColor("#ffffff")
      .text("TOTAL:", summaryX + 15, summaryY + 92, { width: 80, align: 'left' })
      .text(`₹${order.totalAmount?.toFixed(2) || '0.00'}`, summaryX + 95, summaryY + 92, { width: 85, align: 'right' });

    // ================= FOOTER =================
    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor("#999999")
      .text(
        "Thank you for shopping with TOLVV!",
        50,
        780,
        { align: 'center' }
      )
      .text(
        "This is a system generated invoice. For any queries, please contact support@tolvvsigns.com",
        50,
        795,
        { align: 'center', width: 495 }
      );

    // ================= END PDF =================
    doc.end();

  } catch (err) {
    console.error("Invoice generation error:", err);
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false,
        message: "Invoice generation failed",
        error: err.message 
      });
    }
  }
});

/* ================= BULK INVOICE DOWNLOAD ================= */
router.post("/orders/bulk/invoice", auth, async (req, res) => {
  try {
    const { orderIds } = req.body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of order IDs",
      });
    }

    const orders = await Order.find({ _id: { $in: orderIds } });

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No orders found",
      });
    }

    // Create a ZIP file with all invoices
    // For simplicity, we'll return a list of invoice URLs
    const invoiceUrls = orders.map(order => ({
      orderId: order.customOrderId || order._id,
      url: `/api/orders/${order._id}/invoice`,
    }));

    res.status(200).json({
      success: true,
      message: `${orders.length} invoices available`,
      data: invoiceUrls,
    });

  } catch (err) {
    console.error("Bulk invoice error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/* ================= INVOICE PREVIEW (HTML) ================= */
router.get("/orders/:id/invoice-preview", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("userId", "name email");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Generate HTML preview
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Invoice - ${order.customOrderId}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
    .header { text-align: center; border-bottom: 2px solid #1a1a1a; padding-bottom: 20px; }
    .header h1 { font-size: 28px; margin: 0; color: #1a1a1a; }
    .header p { color: #666; margin: 5px 0; }
    .invoice-info { display: flex; justify-content: space-between; margin: 20px 0; padding: 15px; background: #f5f5f5; }
    .details { display: flex; justify-content: space-between; margin: 20px 0; }
    .details-box { flex: 1; padding: 15px; background: #fafafa; border: 1px solid #e0e0e0; margin: 0 5px; }
    .details-box h3 { margin-top: 0; color: #1a1a1a; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #f5f5f5; padding: 12px; text-align: left; font-size: 12px; color: #666; }
    td { padding: 10px; border-bottom: 1px solid #e0e0e0; font-size: 12px; }
    .total-section { text-align: right; margin-top: 20px; padding: 20px; background: #fafafa; }
    .total-section .total { font-size: 20px; font-weight: bold; color: #1a1a1a; }
    .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #999; font-size: 11px; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: bold; }
    .status-paid { background: #4CAF50; color: white; }
    .status-pending { background: #FFA500; color: white; }
    .status-cancelled { background: #F44336; color: white; }
  </style>
</head>
<body>
  <div class="header">
    <h1>TOLVV</h1>
    <p>Celestial. Ritualistic. Personal</p>
    <p style="font-size: 12px;">Zodiac Inspired Bath & Body</p>
  </div>

  <div class="invoice-info">
    <div>
      <strong>Invoice #:</strong> ${order.customOrderId || order._id}<br>
      <strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
    </div>
    <div>
      <strong>Payment:</strong> ${order.paymentMethod.toUpperCase()}<br>
      <strong>Status:</strong> <span class="status-badge status-${order.status === 'PAID' ? 'paid' : order.status === 'CANCELLED' ? 'cancelled' : 'pending'}">${order.status}</span>
    </div>
  </div>

  <div class="details">
    <div class="details-box">
      <h3>Customer Details</h3>
      <p><strong>Name:</strong> ${order.customerName || order.address?.name || 'N/A'}</p>
      <p><strong>Email:</strong> ${order.customerEmail || 'N/A'}</p>
      <p><strong>Phone:</strong> ${order.address?.mobile || 'N/A'}</p>
    </div>
    <div class="details-box">
      <h3>Shipping Address</h3>
      <p>${order.address ? 
        `${order.address.houseNumber || ''} ${order.address.buildingName || ''} ${order.address.road || ''}`.trim() || 'Address not provided'
      : 'Address not provided'}</p>
      <p>${order.address?.city || ''}${order.address?.city && order.address?.state ? ', ' : ''}${order.address?.state || ''}${(order.address?.city || order.address?.state) && order.address?.pincode ? ' - ' : ''}${order.address?.pincode || ''}</p>
      <p><strong>Phone:</strong> ${order.address?.mobile || 'N/A'}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Item</th>
        <th style="text-align: right;">Quantity</th>
        <th style="text-align: right;">Price</th>
        <th style="text-align: right;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${order.items.map((item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${item.isFree ? `${item.productName} (FREE)` : item.productName}
            ${item.hamperItems && item.hamperItems.length > 0 ? 
              `<br><span style="color: #666; font-size: 11px;">${item.hamperItems.map(h => `└ ${h.name || 'Item'} × ${h.quantity || 0}${h.isFree ? ' (FREE)' : ''}`).join('<br>')}</span>` 
              : ''}
          </td>
          <td style="text-align: right;">${item.quantity}</td>
          <td style="text-align: right;">₹${item.priceAtBuy.toFixed(2)}</td>
          <td style="text-align: right;">₹${(item.priceAtBuy * item.quantity).toFixed(2)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="total-section">
    ${order.subtotal ? `<p>Subtotal: ₹${order.subtotal.toFixed(2)}</p>` : ''}
    ${order.discount && order.discount > 0 ? `<p style="color: #4CAF50;">Discount: -₹${order.discount.toFixed(2)}</p>` : ''}
    ${order.shippingCost && order.shippingCost > 0 ? `<p>Shipping: ₹${order.shippingCost.toFixed(2)}</p>` : ''}
    <p class="total">Total: ₹${(order.totalAmount || 0).toFixed(2)}</p>
  </div>

  <div class="footer">
    <p>Thank you for shopping with TOLVV!</p>
    <p>This is a system generated invoice. For any queries, please contact support@tolvvsigns.com</p>
  </div>
</body>
</html>
    `;

    res.send(html);
  } catch (err) {
    console.error("Invoice preview error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = router;