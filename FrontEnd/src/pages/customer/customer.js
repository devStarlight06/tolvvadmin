// src/pages/Customer/Customer.js

import { useEffect, useState } from "react";
import { Container, Table, Spinner, Badge, Alert, Button } from "react-bootstrap";
import { motion } from "framer-motion";
import { FaUsers, FaEye } from "react-icons/fa";
import Header from "../../component/header/header";
import Sidebar from "../../component/sidebar/sidebar";
import "./customer.css";

const API_BASE = "http://localhost:7000/api/customers";

const Customer = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  // Get token and user role
  const getToken = () => localStorage.getItem("token");
  const getUserRole = () => {
    try {
      const token = getToken();
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role ? payload.role.toLowerCase() : null;
    } catch (err) {
      console.error("Error parsing token:", err);
      return null;
    }
  };

  // Fetch Customers (grouped by email)
  const fetchCustomers = async () => {
    try {
      const token = getToken();
      if (!token) {
        setAuthError("No authentication token found. Please login as admin.");
        return;
      }

      const res = await fetch(`${API_BASE}/`, {
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });

      if (res.status === 401) {
        setAuthError("Session expired. Please login again.");
        return;
      }

      if (res.status === 403) {
        setAuthError("Admin access required. You don't have permission to view this page.");
        return;
      }

      const data = await res.json();
      console.log("Customers data:", data);
      
      // Handle both response formats
      if (data.success) {
        setCustomers(data.data || []);
      } else if (Array.isArray(data)) {
        setCustomers(data);
      } else {
        setCustomers([]);
      }
      setAuthError("");
    } catch (err) {
      console.error("Fetch customers error:", err);
      setAuthError("Failed to fetch customers. Please check your connection.");
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const userRole = getUserRole();
      console.log("User role (lowercase):", userRole);
      
      if (userRole !== "admin") {
        setAuthError("Admin access required. Please login as admin.");
        setLoading(false);
        return;
      }
      
      await fetchCustomers();
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" /> Loading...
      </div>
    );
  }

  if (authError) {
    return (
      <div>
        <Header />
        <div className="admin-layout">
          <Sidebar />
          <main className="admin-content">
            <Container>
              <Alert variant="danger" className="mt-4">
                <h5>Access Denied</h5>
                <p>{authError}</p>
                <Button variant="primary" onClick={() => window.location.href = "/login"}>
                  Go to Login
                </Button>
              </Alert>
            </Container>
          </main>
        </div>
      </div>
    );
  }

  // Calculate summary stats
  const totalCustomers = customers.length;
  const totalRevenue = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
  const totalOrders = customers.reduce((sum, c) => sum + (c.orderCount || 0), 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return (
    <div>
      <Header />
      <div className="admin-layout">
        <Sidebar />
        <main className="admin-content">
          <Container fluid>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="d-flex justify-content-between align-items-center mb-4"
            >
              <h4>
                <FaUsers className="me-2" />
                Customer Management
              </h4>
              <span className="text-muted">
                Total: {totalCustomers} customers
              </span>
            </motion.div>

            {/* Summary Cards */}
            <div className="row g-3 mb-4">
              <div className="col-md-3">
                <div className="summary-card p-3 border rounded bg-white shadow-sm">
                  <h6 className="text-muted">Total Customers</h6>
                  <h3 className="mb-0">{totalCustomers}</h3>
                </div>
              </div>
              <div className="col-md-3">
                <div className="summary-card p-3 border rounded bg-white shadow-sm">
                  <h6 className="text-muted">Total Revenue</h6>
                  <h3 className="mb-0 text-success">₹{totalRevenue.toFixed(2)}</h3>
                </div>
              </div>
              <div className="col-md-3">
                <div className="summary-card p-3 border rounded bg-white shadow-sm">
                  <h6 className="text-muted">Total Orders</h6>
                  <h3 className="mb-0">{totalOrders}</h3>
                </div>
              </div>
              <div className="col-md-3">
                <div className="summary-card p-3 border rounded bg-white shadow-sm">
                  <h6 className="text-muted">Avg. Order Value</h6>
                  <h3 className="mb-0 text-primary">₹{avgOrderValue.toFixed(2)}</h3>
                </div>
              </div>
            </div>

            {/* Customers Table */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="table-wrapper bg-white p-3 rounded shadow-sm"
            >
              <Table responsive bordered hover className="customers-table mb-0">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th className="text-center">Orders</th>
                    <th className="text-end">Total Spent</th>
                    <th className="text-end">Avg. Order</th>
                    <th>Last Order</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-4 text-muted">
                        No customers found
                      </td>
                    </tr>
                  ) : (
                    customers.map((customer, idx) => (
                      <motion.tr
                        key={customer.email || idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                      >
                        <td>{idx + 1}</td>
                        <td>
                          <strong>{customer.name || "N/A"}</strong>
                          {customer.userRegistered && (
                            <Badge bg="success" className="ms-1" pill>Registered</Badge>
                          )}
                        </td>
                        <td>{customer.email || "N/A"}</td>
                        <td>{customer.phone || "N/A"}</td>
                        <td className="text-center">
                          <Badge bg="primary" pill>
                            {customer.orderCount || 0}
                          </Badge>
                        </td>
                        <td className="text-end text-success fw-bold">
                          ₹{(customer.totalSpent || 0).toFixed(2)}
                        </td>
                        <td className="text-end">
                          ₹{((customer.totalSpent || 0) / (customer.orderCount || 1)).toFixed(2)}
                        </td>
                        <td>
                          {customer.lastOrderDate 
                            ? new Date(customer.lastOrderDate).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric"
                              })
                            : "N/A"}
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </Table>
            </motion.div>
          </Container>
        </main>
      </div>
    </div>
  );
};

export default Customer;