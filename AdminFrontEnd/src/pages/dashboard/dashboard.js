import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Spinner, Table } from "react-bootstrap";
import { motion } from "framer-motion";
import { FaRupeeSign, FaShoppingCart, FaClock } from "react-icons/fa";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import Header from "../../component/header/header";
import Sidebar from "../../component/sidebar/sidebar";
import "./dashboard.css";

const API_BASE = "http://localhost:7000/api/dashboard";

const Dashboard = () => {
  const [stats, setStats] = useState([]);
  const [commissionData, setCommissionData] = useState([]);
  const [companyCommissionData, setCompanyCommissionData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return setLoading(false);

        const headers = { Authorization: `Bearer ${token}` };

        // ===== STATS =====
        const statsRes = await fetch(`${API_BASE}/stats`, { headers });
        const statsData = await statsRes.json();

        // ===== DAILY & MONTHLY INCOME =====
        const incomeRes = await fetch(`${API_BASE}/income-summary`, { headers });
        const incomeData = await incomeRes.json();

        setStats([
          {
            title: "Total Admin Income",
            value: `₹${statsData.totalCommission}`,
            icon: <FaRupeeSign />,
          },
          {
            title: "Today's Income",
            value: `₹${incomeData.dailyIncome}`,
            icon: <FaRupeeSign />,
          },
          {
            title: "This Month Income",
            value: `₹${incomeData.monthlyIncome}`,
            icon: <FaRupeeSign />,
          },
          {
            title: "Total Orders",
            value: statsData.totalOrders,
            icon: <FaShoppingCart />,
          },
          {
            title: "Delivered Orders",
            value: statsData.deliveredOrders,
            icon: <FaShoppingCart />,
          },
          {
            title: "Pending Orders",
            value: statsData.pendingOrders,
            icon: <FaClock />,
          },
          {
            title: "Cancelled Orders",
            value: statsData.cancelledOrders,
            icon: <FaClock />,
          },
        ]);


        // ===== MONTHLY ADMIN COMMISSION (AVG) =====
        const commissionRes = await fetch(`${API_BASE}/admin-commission`, {
          headers,
        });
        setCommissionData(await commissionRes.json());

        // ===== COMPANY-WISE COMMISSION =====
        const companyRes = await fetch(
          `${API_BASE}/admin-commission-per-company`,
          { headers }
        );
        setCompanyCommissionData(await companyRes.json());

        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading)
    return (
      <div className="text-center py-5">
        <Spinner animation="border" /> Loading...
      </div>
    );

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
              Dashboard Overview
            </motion.h3>

            {/* ===== STATS CARDS ===== */}
            <Row className="g-4">
              {stats.map((item, i) => (
                <Col xl={3} lg={4} md={6} xs={12} key={i}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Card className="stat-card">
                      <div className="stat-icon">{item.icon}</div>
                      <div>
                        <h6>{item.title}</h6>
                        <h4>{item.value}</h4>
                      </div>
                    </Card>
                  </motion.div>
                </Col>
              ))}
            </Row>

            {/* ===== MONTHLY AVG ADMIN COMMISSION ===== */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-5"
            >
              <Card className="chart-card p-3">
                <h5 className="mb-3">Monthly Admin Income</h5>
                {commissionData.length === 0 ? (
                  <p>No data available</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={commissionData}>
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(v) => `₹${v}`} />
                      <Line
                        type="monotone"
                        dataKey="totalCommission"
                        strokeWidth={3}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </Card>
            </motion.div>

            {/* ===== COMPANY-WISE ADMIN COMMISSION ===== */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-5"
            >
              <Card className="p-3">
                <h5>Admin Commission Per Company</h5>
                {companyCommissionData.length === 0 ? (
                  <p>No data available</p>
                ) : (
                  <Table striped bordered hover responsive>
                    <thead>
                      <tr>
                        <th>Company</th>
                        <th>Total Products Sold</th>
                        <th>Total Sales (₹)</th>
                        <th>Admin Commission (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {companyCommissionData.map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.company}</td>
                          <td>{item.totalQty}</td>
                          <td>{item.totalSales}</td>
                          <td>{item.adminCommission}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
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
