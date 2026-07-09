// src/pages/Dashboard/Dashboard.js

import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Spinner, Table } from "react-bootstrap";
import { motion } from "framer-motion";
import { 
  FaRupeeSign, 
  FaShoppingCart, 
  FaClock, 
  FaBox, 
  FaUsers,
  FaChartLine,
  FaTshirt,
  FaTags 
} from "react-icons/fa";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import Header from "../../component/header/header";
import Sidebar from "../../component/sidebar/sidebar";
import "./dashboard.css";

const API_BASE = "http://localhost:7000/api/dashboard";

const Dashboard = () => {
  const [stats, setStats] = useState([]);
  const [monthlySales, setMonthlySales] = useState([]);
  const [salesByCompany, setSalesByCompany] = useState([]);
  const [salesBySunSign, setSalesBySunSign] = useState([]);
  const [salesByCategory, setSalesByCategory] = useState([]);
  const [productWiseSales, setProductWiseSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setLoading(false);
          return;
        }

        const headers = { Authorization: `Bearer ${token}` };

        // ===== STATS =====
        const statsRes = await fetch(`${API_BASE}/stats`, { headers });
        const statsData = await statsRes.json();

        // ===== DAILY & MONTHLY SALES =====
        const salesSummaryRes = await fetch(`${API_BASE}/sales-summary`, { headers });
        const salesSummary = await salesSummaryRes.json();

        // ===== MONTHLY SALES CHART =====
        const monthlySalesRes = await fetch(`${API_BASE}/monthly-sales`, { headers });
        const monthlySalesData = await monthlySalesRes.json();

        // ===== SALES BY COMPANY =====
        const companyRes = await fetch(`${API_BASE}/sales-by-company`, { headers });
        const companyData = await companyRes.json();

        // ===== SALES BY SUN SIGN =====
        const sunSignRes = await fetch(`${API_BASE}/sales-by-sunsign`, { headers });
        const sunSignData = await sunSignRes.json();

        // ===== SALES BY CATEGORY =====
        const categoryRes = await fetch(`${API_BASE}/sales-by-category`, { headers });
        const categoryData = await categoryRes.json();

        // ===== PRODUCT WISE SALES =====
        const productRes = await fetch(`${API_BASE}/product-wise-sales`, { headers });
        const productData = await productRes.json();

        // Set Stats
        setStats([
          {
            title: "Total Revenue",
            value: `₹${statsData.totalSales || 0}`,
            icon: <FaRupeeSign />,
            color: "#28a745",
          },
          {
            title: "Today's Sales",
            value: `₹${salesSummary.dailySales || 0}`,
            icon: <FaChartLine />,
            color: "#17a2b8",
          },
          {
            title: "This Month Sales",
            value: `₹${salesSummary.monthlySales || 0}`,
            icon: <FaChartLine />,
            color: "#007bff",
          },
          {
            title: "Total Orders",
            value: statsData.totalOrders || 0,
            icon: <FaShoppingCart />,
            color: "#6f42c1",
          },
          {
            title: "Delivered",
            value: statsData.deliveredOrders || 0,
            icon: <FaBox />,
            color: "#28a745",
          },
          {
            title: "Pending",
            value: statsData.pendingOrders || 0,
            icon: <FaClock />,
            color: "#ffc107",
          },
          {
            title: "Cancelled",
            value: statsData.cancelledOrders || 0,
            icon: <FaClock />,
            color: "#dc3545",
          },
        ]);

        setMonthlySales(monthlySalesData);
        setSalesByCompany(companyData);
        setSalesBySunSign(sunSignData);
        setSalesByCategory(categoryData);
        setProductWiseSales(productData);

        setLoading(false);
      } catch (err) {
        console.error("Dashboard error:", err);
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="admin-layout">
        <Sidebar />
        <main className="admin-content">
          <Container fluid>
            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4"
            >
              📊 Dashboard Overview
            </motion.h3>

            {/* ===== STATS CARDS ===== */}
            <Row className="g-4">
              {stats.map((item, i) => (
                <Col xl={3} lg={4} md={6} xs={12} key={i}>
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="stat-card" style={{ borderLeft: `4px solid ${item.color}` }}>
                      <div className="stat-content">
                        <div className="stat-icon" style={{ color: item.color }}>
                          {item.icon}
                        </div>
                        <div className="stat-info">
                          <h6>{item.title}</h6>
                          <h4>{item.value}</h4>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                </Col>
              ))}
            </Row>

            {/* ===== MONTHLY SALES CHART ===== */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-5"
            >
              <Card className="chart-card p-4">
                <h5 className="mb-3">📈 Monthly Sales</h5>
                {monthlySales.length === 0 ? (
                  <p className="text-muted">No sales data available</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlySales}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(v) => `₹${v}`} />
                      <Line
                        type="monotone"
                        dataKey="totalSales"
                        stroke="#007bff"
                        strokeWidth={3}
                        dot={{ fill: "#007bff", r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </Card>
            </motion.div>

            {/* ===== TWO COLUMN CHARTS ===== */}
            <Row className="mt-4 g-4">
              {/* Sales by Category */}
              <Col md={6}>
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Card className="p-4">
                    <h5 className="mb-3">🏷️ Sales by Category</h5>
                    {salesByCategory.length === 0 ? (
                      <p className="text-muted">No data available</p>
                    ) : (
                      <div style={{ maxHeight: "250px", overflowY: "auto" }}>
                        {salesByCategory.map((item, idx) => (
                          <div key={idx} className="d-flex justify-content-between align-items-center border-bottom py-2">
                            <span><strong>{item.category || "Unknown"}</strong></span>
                            <span>
                              <span className="text-muted me-3">{item.totalQty} items</span>
                              <span className="fw-bold">₹{item.totalSales}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </motion.div>
              </Col>

              {/* Sales by Sun Sign */}
              <Col md={6}>
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Card className="p-4">
                    <h5 className="mb-3">♈ Sales by Sun Sign</h5>
                    {salesBySunSign.length === 0 ? (
                      <p className="text-muted">No data available</p>
                    ) : (
                      <div style={{ maxHeight: "250px", overflowY: "auto" }}>
                        {salesBySunSign.map((item, idx) => (
                          <div key={idx} className="d-flex justify-content-between align-items-center border-bottom py-2">
                            <span><strong>{item.sunSign || "Unknown"}</strong></span>
                            <span>
                              <span className="text-muted me-3">{item.totalQty} items</span>
                              <span className="fw-bold">₹{item.totalSales}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </motion.div>
              </Col>
            </Row>

            {/* ===== SALES BY COMPANY ===== */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-4"
            >
              {/* <Card className="p-4">
                <h5 className="mb-3">🏢 Sales by Company</h5>
                {salesByCompany.length === 0 ? (
                  <p className="text-muted">No data available</p>
                ) : (
                  <div className="table-responsive">
                    <Table striped bordered hover>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Company</th>
                          <th className="text-end">Quantity Sold</th>
                          <th className="text-end">Total Sales (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salesByCompany.map((item, idx) => (
                          <tr key={idx}>
                            <td>{idx + 1}</td>
                            <td><strong>{item.company || "Unknown"}</strong></td>
                            <td className="text-end">{item.totalQty}</td>
                            <td className="text-end">₹{item.totalSales}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Card> */}
            </motion.div>

            {/* ===== PRODUCT WISE SALES ===== */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-4"
            >
              <Card className="p-4">
                <h5 className="mb-3">📦 Top Selling Products</h5>
                {productWiseSales.length === 0 ? (
                  <p className="text-muted">No data available</p>
                ) : (
                  <div className="table-responsive">
                    <Table striped bordered hover>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Product</th>
                          <th>Category</th>
                          <th>Sun Sign</th>
                          <th className="text-end">Quantity</th>
                          <th className="text-end">Total Sales (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {productWiseSales.slice(0, 10).map((item, idx) => (
                          <tr key={idx}>
                            <td>{idx + 1}</td>
                            <td><strong>{item.name}</strong></td>
                            <td>{item.category || "N/A"}</td>
                            <td>{item.sunSign || "N/A"}</td>
                            <td className="text-end">{item.totalQty}</td>
                            <td className="text-end">₹{item.totalSales}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Card>
            </motion.div>
          </Container>
        </main>
      </div>
    </>
  );
};

export default Dashboard;