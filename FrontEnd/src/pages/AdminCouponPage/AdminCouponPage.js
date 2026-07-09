// src/pages/AdminCouponPage/AdminCouponPage.js

import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../../component/sidebar/sidebar";
import Header from "../../component/header/header";

const AdminCouponPage = () => {
  const [formData, setFormData] = useState({
    code: "",
    type: "percentage",
    value: "",
    usageLimit: "",
    applicableProducts: [],
    applicableCategories: [],
    startDate: "",
    endDate: "",
    isActive: true,
    description: "",
  });

  const [loading, setLoading] = useState(false);
  const [coupons, setCoupons] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [products, setProducts] = useState([]);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [showCategorySelector, setShowCategorySelector] = useState(false);

  const TOKEN = localStorage.getItem("token");

  // ==================== API CONFIG ====================
  const API_BASE = "http://localhost:7000/api";
  
  const api = axios.create({
    baseURL: API_BASE,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
  });

  // ==================== FETCH DATA ====================
  useEffect(() => {
    fetchCoupons();
    fetchProducts();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      console.log("📦 Fetching coupons from:", `${API_BASE}/coupons`);
      const res = await api.get("/coupons");
      console.log("✅ Coupons fetched:", res.data);
      setCoupons(res.data.data || []);
    } catch (error) {
      console.error("❌ Error fetching coupons:", error);
      if (error.response?.status === 404) {
        console.log("Coupon API not found - server may need restart");
      }
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get("/admin/products?limit=10000");
      setProducts(res.data.data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
    }
  };

  // ==================== HANDLE CHANGE ====================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // ==================== HANDLE ARRAY SELECTORS ====================
  const handleArraySelect = (field, value) => {
    const currentArray = formData[field] || [];
    if (currentArray.includes(value)) {
      setFormData({
        ...formData,
        [field]: currentArray.filter(item => item !== value),
      });
    } else {
      setFormData({
        ...formData,
        [field]: [...currentArray, value],
      });
    }
  };

  // ==================== SUBMIT COUPON ====================
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      if (!formData.code) {
        alert("Coupon code is required");
        setLoading(false);
        return;
      }
      if (!formData.value) {
        alert("Discount value is required");
        setLoading(false);
        return;
      }
      if (!formData.startDate || !formData.endDate) {
        alert("Start and end dates are required");
        setLoading(false);
        return;
      }

      const couponData = {
        code: formData.code.toUpperCase(),
        type: formData.type,
        value: parseFloat(formData.value),
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
        applicableProducts: formData.applicableProducts || [],
        applicableCategories: formData.applicableCategories || [],
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        isActive: formData.isActive,
        description: formData.description || "",
      };

      console.log("📦 Creating coupon:", couponData);

      let res;
      if (editingId) {
        res = await api.put(`/coupons/${editingId}`, couponData);
        alert("Coupon updated successfully!");
      } else {
        res = await api.post("/coupons", couponData);
        alert("Coupon created successfully!");
      }

      console.log("✅ Coupon saved:", res.data);
      
      setFormData({
        code: "",
        type: "percentage",
        value: "",
        usageLimit: "",
        applicableProducts: [],
        applicableCategories: [],
        startDate: "",
        endDate: "",
        isActive: true,
        description: "",
      });
      setEditingId(null);
      fetchCoupons();

    } catch (error) {
      console.error("❌ Error saving coupon:", error);
      const errorMsg = error?.response?.data?.message || error.message || "Error saving coupon";
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // ==================== EDIT COUPON ====================
  const handleEdit = (coupon) => {
    setFormData({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      usageLimit: coupon.usageLimit || "",
      applicableProducts: coupon.applicableProducts || [],
      applicableCategories: coupon.applicableCategories || [],
      startDate: coupon.startDate ? coupon.startDate.split('T')[0] : "",
      endDate: coupon.endDate ? coupon.endDate.split('T')[0] : "",
      isActive: coupon.isActive,
      description: coupon.description || "",
    });
    setEditingId(coupon._id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ==================== DELETE COUPON ====================
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this coupon?")) return;

    try {
      await api.delete(`/coupons/${id}`);
      alert("Coupon deleted successfully!");
      fetchCoupons();
    } catch (error) {
      console.error("Error deleting coupon:", error);
      alert(error?.response?.data?.message || "Error deleting coupon");
    }
  };

  // ==================== TOGGLE STATUS ====================
  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await api.patch(`/coupons/${id}/toggle-status`);
      alert(`Coupon ${currentStatus ? "deactivated" : "activated"} successfully!`);
      fetchCoupons();
    } catch (error) {
      console.error("Error toggling status:", error);
      alert(error?.response?.data?.message || "Error updating status");
    }
  };

  // ==================== RENDER ====================
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f4f6f9" }}>
      <Sidebar />
      <div style={{ flex: 1, padding: "20px" }}>
        <Header />

        {/* ===== FORM ===== */}
        <div
          style={{
            maxWidth: "1000px",
            margin: "20px auto",
            background: "#fff",
            padding: "30px",
            borderRadius: "20px",
            boxShadow: "0 5px 20px rgba(0,0,0,0.08)",
          }}
        >
          <h2 style={{ fontSize: "32px", fontWeight: "700" }}>
            {editingId ? "Edit Coupon" : "Create Coupon"}
          </h2>
          <p style={{ color: "#666", marginBottom: "30px" }}>
            {editingId ? "Update coupon details" : "Add discount coupons for your customers"}
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              {/* Coupon Code */}
              <div>
                <label className="form-label">Coupon Code *</label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="SAVE10"
                  className="form-control"
                  required
                  style={{ textTransform: "uppercase" }}
                />
              </div>

              {/* Discount Type */}
              <div>
                <label className="form-label">Discount Type *</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="form-control"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                  <option value="free_shipping">Free Shipping</option>
                </select>
              </div>

              {/* Discount Value */}
              <div>
                <label className="form-label">Discount Value *</label>
                <input
                  type="number"
                  name="value"
                  value={formData.value}
                  onChange={handleChange}
                  placeholder={formData.type === "percentage" ? "10" : "100"}
                  className="form-control"
                  required
                  min="0"
                />
                {formData.type === "percentage" && (
                  <small style={{ color: "#666" }}>Percentage cannot exceed 100%</small>
                )}
              </div>

              {/* Usage Limit Per User */}
              <div>
                <label className="form-label">Usage Limit Per User</label>
                <input
                  type="number"
                  name="usageLimit"
                  value={formData.usageLimit}
                  onChange={handleChange}
                  placeholder="1 (leave empty for unlimited)"
                  className="form-control"
                  min="1"
                />
                <small style={{ color: "#666" }}>How many times a user can use this coupon</small>
              </div>

              {/* Start Date */}
              <div>
                <label className="form-label">Start Date *</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="form-control"
                  required
                />
              </div>

              {/* End Date */}
              <div>
                <label className="form-label">End Date *</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="form-control"
                  required
                />
              </div>

              {/* Status */}
              <div>
                <label className="form-label">Status</label>
                <select
                  name="isActive"
                  value={formData.isActive}
                  onChange={handleChange}
                  className="form-control"
                >
                  <option value={true}>Active</option>
                  <option value={false}>Inactive</option>
                </select>
              </div>
            </div>

            {/* ===== PRODUCT RESTRICTIONS ===== */}
            <div style={{ marginTop: "20px" }}>
              <label className="form-label">Applicable Products (Optional)</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowProductSelector(!showProductSelector)}
                >
                  {showProductSelector ? "Hide Products" : "Select Products"}
                </button>
                {formData.applicableProducts.length > 0 && (
                  <span style={{ background: "#e9ecef", padding: "5px 15px", borderRadius: "20px" }}>
                    {formData.applicableProducts.length} selected
                  </span>
                )}
              </div>

              {showProductSelector && (
                <div style={{ 
                  marginTop: "10px", 
                  padding: "15px", 
                  border: "1px solid #ddd", 
                  borderRadius: "10px",
                  maxHeight: "200px",
                  overflowY: "auto"
                }}>
                  {products.map(product => (
                    <label key={product._id} style={{ display: "block", padding: "5px" }}>
                      <input
                        type="checkbox"
                        checked={formData.applicableProducts.includes(product._id)}
                        onChange={() => handleArraySelect("applicableProducts", product._id)}
                      />
                      <span style={{ marginLeft: "10px" }}>{product.ProductName}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* ===== CATEGORY RESTRICTIONS ===== */}
            <div style={{ marginTop: "20px" }}>
              <label className="form-label">Applicable Categories (Optional)</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowCategorySelector(!showCategorySelector)}
                >
                  {showCategorySelector ? "Hide Categories" : "Select Categories"}
                </button>
                {formData.applicableCategories.length > 0 && (
                  <span style={{ background: "#e9ecef", padding: "5px 15px", borderRadius: "20px" }}>
                    {formData.applicableCategories.length} selected
                  </span>
                )}
              </div>

              {showCategorySelector && (
                <div style={{ 
                  marginTop: "10px", 
                  padding: "15px", 
                  border: "1px solid #ddd", 
                  borderRadius: "10px",
                  maxHeight: "200px",
                  overflowY: "auto"
                }}>
                  {/* Categories from your product data */}
                  {[...new Set(products.map(p => p.Category || p.category).filter(Boolean))].map(cat => (
                    <label key={cat} style={{ display: "block", padding: "5px" }}>
                      <input
                        type="checkbox"
                        checked={formData.applicableCategories.includes(cat)}
                        onChange={() => handleArraySelect("applicableCategories", cat)}
                      />
                      <span style={{ marginLeft: "10px" }}>{cat}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            <div style={{ marginTop: "20px" }}>
              <label className="form-label">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                placeholder="Write coupon details..."
                className="form-control"
              />
            </div>

            {/* Preview Card */}
            <div
              style={{
                marginTop: "30px",
                background: "linear-gradient(135deg,#1a1a2e,#16213e)",
                borderRadius: "20px",
                padding: "30px",
                color: "#fff",
              }}
            >
              <h3 style={{ fontSize: "28px", fontWeight: "700" }}>
                {formData.code || "COUPON"}
              </h3>
              <p style={{ marginTop: "10px", fontSize: "18px" }}>
                {formData.type === "percentage"
                  ? `${formData.value || 0}% OFF`
                  : formData.type === "free_shipping"
                  ? "FREE SHIPPING"
                  : `₹${formData.value || 0} OFF`}
              </p>
              {formData.usageLimit && (
                <p>🔢 Each user can use this coupon {formData.usageLimit} time{formData.usageLimit > 1 ? 's' : ''}</p>
              )}
              {formData.applicableProducts.length > 0 && (
                <p>📦 Applicable to {formData.applicableProducts.length} selected products</p>
              )}
              {formData.applicableCategories.length > 0 && (
                <p>🏷️ Applicable to {formData.applicableCategories.length} selected categories</p>
              )}
              <p style={{ marginTop: "10px", fontSize: "12px", opacity: 0.7 }}>
                Valid from {formData.startDate || "Start"} to {formData.endDate || "End"}
              </p>
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: "15px", marginTop: "30px" }}>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-dark"
                style={{
                  padding: "12px 30px",
                  borderRadius: "12px",
                  fontWeight: "600",
                }}
              >
                {loading ? "Saving..." : editingId ? "Update Coupon" : "Create Coupon"}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    setEditingId(null);
                    setFormData({
                      code: "",
                      type: "percentage",
                      value: "",
                      usageLimit: "",
                      applicableProducts: [],
                      applicableCategories: [],
                      startDate: "",
                      endDate: "",
                      isActive: true,
                      description: "",
                    });
                  }}
                  style={{
                    padding: "12px 30px",
                    borderRadius: "12px",
                    fontWeight: "600",
                  }}
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>

        {/* ===== COUPON LIST ===== */}
        <div
          style={{
            maxWidth: "1000px",
            margin: "20px auto",
            background: "#fff",
            padding: "30px",
            borderRadius: "20px",
            boxShadow: "0 5px 20px rgba(0,0,0,0.08)",
          }}
        >
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3 style={{ marginBottom: 0 }}>All Coupons</h3>
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={fetchCoupons}
            >
              🔄 Refresh
            </button>
          </div>
          
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : coupons.length === 0 ? (
            <div className="text-center py-4">
              <p style={{ color: "#666" }}>No coupons created yet.</p>
              <p style={{ color: "#999", fontSize: "14px" }}>
                Use the form above to create your first coupon.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #eee" }}>
                    <th style={{ padding: "12px", textAlign: "left" }}>Code</th>
                    <th style={{ padding: "12px", textAlign: "left" }}>Discount</th>
                    <th style={{ padding: "12px", textAlign: "left" }}>Usage Limit</th>
                    <th style={{ padding: "12px", textAlign: "left" }}>Used</th>
                    <th style={{ padding: "12px", textAlign: "left" }}>Status</th>
                    <th style={{ padding: "12px", textAlign: "left" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map(coupon => (
                    <tr key={coupon._id} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: "12px" }}>
                        <strong>{coupon.code}</strong>
                      </td>
                      <td style={{ padding: "12px" }}>
                        {coupon.type === "percentage"
                          ? `${coupon.value}%`
                          : coupon.type === "free_shipping"
                          ? "Free Shipping"
                          : `₹${coupon.value}`}
                      </td>
                      <td style={{ padding: "12px" }}>
                        {coupon.usageLimit ? `Per User: ${coupon.usageLimit}` : "Unlimited"}
                      </td>
                      <td style={{ padding: "12px" }}>
                        {coupon.usageCount || 0} times
                      </td>
                      <td style={{ padding: "12px" }}>
                        <span
                          style={{
                            padding: "4px 12px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: "600",
                            background: coupon.isActive && !coupon.isExpired ? "#d4edda" : "#f8d7da",
                            color: coupon.isActive && !coupon.isExpired ? "#155724" : "#721c24",
                          }}
                        >
                          {coupon.isActive && !coupon.isExpired ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td style={{ padding: "12px" }}>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleEdit(coupon)}
                          style={{ marginRight: "5px" }}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-outline-warning"
                          onClick={() => handleToggleStatus(coupon._id, coupon.isActive)}
                          style={{ marginRight: "5px" }}
                        >
                          {coupon.isActive ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(coupon._id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminCouponPage;