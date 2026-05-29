// src/pages/AdminCouponPage/AdminCouponPage.js

import React, { useState } from "react";
import axios from "axios";
import Sidebar from "../../component/sidebar/sidebar";
import Header from "../../component/header/header";

const AdminCouponPage = () => {
  const [formData, setFormData] = useState({
    code: "",
    discountType: "percentage",
    discountValue: "",
    minOrderAmount: "",
    expiryDate: "",
    description: "",
    isActive: true,
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const res = await axios.post(
        "http://localhost:7000/api/coupons/admin/coupon",
        formData
      );

      alert("Coupon Created Successfully");

    //   console.log(res.data);

      setFormData({
        code: "",
        discountType: "percentage",
        discountValue: "",
        minOrderAmount: "",
        expiryDate: "",
        description: "",
        isActive: true,
      });
    } catch (error) {
      console.log(error);
      alert(error?.response?.data?.message || "Error creating coupon");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#f4f6f9",
      }}
    >
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          padding: "20px",
        }}
      >
        <Header />

        <div
          style={{
            maxWidth: "900px",
            margin: "20px auto",
            background: "#fff",
            padding: "30px",
            borderRadius: "20px",
            boxShadow: "0 5px 20px rgba(0,0,0,0.08)",
          }}
        >
          <h2
            style={{
              fontSize: "32px",
              fontWeight: "700",
              marginBottom: "10px",
            }}
          >
            Create Coupon
          </h2>

          <p
            style={{
              color: "#666",
              marginBottom: "30px",
            }}
          >
            Add discount coupons for your customers.
          </p>

          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "20px",
              }}
            >
              {/* Coupon Code */}
              <div>
                <label className="form-label">Coupon Code</label>

                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="SAVE10"
                  className="form-control"
                  required
                />
              </div>

              {/* Discount Type */}
              <div>
                <label className="form-label">Discount Type</label>

                <select
                  name="discountType"
                  value={formData.discountType}
                  onChange={handleChange}
                  className="form-control"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </div>

              {/* Discount Value */}
              <div>
                <label className="form-label">Discount Value</label>

                <input
                  type="number"
                  name="discountValue"
                  value={formData.discountValue}
                  onChange={handleChange}
                  placeholder="10"
                  className="form-control"
                  required
                />
              </div>

              {/* Minimum Order */}
              <div>
                <label className="form-label">
                  Minimum Order Amount
                </label>

                <input
                  type="number"
                  name="minOrderAmount"
                  value={formData.minOrderAmount}
                  onChange={handleChange}
                  placeholder="500"
                  className="form-control"
                />
              </div>

              {/* Expiry Date */}
              <div>
                <label className="form-label">Expiry Date</label>

                <input
                  type="date"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleChange}
                  className="form-control"
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
              ></textarea>
            </div>

            {/* Preview Card */}
            <div
              style={{
                marginTop: "30px",
                background: "linear-gradient(135deg,#111,#333)",
                borderRadius: "20px",
                padding: "30px",
                color: "#fff",
              }}
            >
              <h3
                style={{
                  fontSize: "28px",
                  fontWeight: "700",
                }}
              >
                {formData.code || "COUPON"}
              </h3>

              <p
                style={{
                  marginTop: "10px",
                  fontSize: "18px",
                }}
              >
                {formData.discountType === "percentage"
                  ? `${formData.discountValue || 0}% OFF`
                  : `₹${formData.discountValue || 0} OFF`}
              </p>

              <p>
                On orders above ₹
                {formData.minOrderAmount || 0}
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-dark"
              style={{
                marginTop: "30px",
                padding: "12px 30px",
                borderRadius: "12px",
                fontWeight: "600",
              }}
            >
              {loading ? "Creating..." : "Create Coupon"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminCouponPage;