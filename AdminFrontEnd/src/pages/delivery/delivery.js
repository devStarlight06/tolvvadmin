// src/pages/Delivery/Delivery.js

import { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Badge,
  Spinner,
  Button,
  Modal,
  Form,
  Alert,
} from "react-bootstrap";
import { motion } from "framer-motion";
import { 
  FaTruck, 
  FaClock, 
  FaEye, 
  FaEdit, 
  FaTrash,
  FaCheckCircle,
  FaTimesCircle,
  FaShippingFast,
  FaBoxOpen,
} from "react-icons/fa";

import Header from "../../component/header/header";
import Sidebar from "../../component/sidebar/sidebar";
import "./delivery.css";

const Delivery = () => {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderStatus, setOrderStatus] = useState("");
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const API_BASE = "http://localhost:7000/api/admin";

  // ==================== GET TOKEN ====================
  const getToken = () => localStorage.getItem("token");

  // ==================== FETCH ORDERS ====================
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/orders`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      const data = await res.json();
      
      if (data.success) {
        setOrders(data.data || []);
        setStats(data.stats || {});
      } else {
        console.error("Failed to fetch orders:", data.message);
      }
      setLoading(false);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // ==================== UPDATE ORDER STATUS ====================
  const handleUpdateStatus = async () => {
    if (!selectedOrder || !orderStatus) return;

    try {
      setUpdating(true);
      setError("");
      setSuccess("");

      const res = await fetch(`${API_BASE}/orders/${selectedOrder._id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ orderStatus }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess("Order status updated successfully!");
        setShowModal(false);
        fetchOrders();
      } else {
        setError(data.message || "Failed to update order status");
      }
    } catch (err) {
      setError(err.message || "Error updating order status");
    } finally {
      setUpdating(false);
    }
  };

  // ==================== DELETE ORDER ====================
  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;

    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      const data = await res.json();

      if (data.success) {
        setSuccess("Order deleted successfully!");
        fetchOrders();
      } else {
        setError(data.message || "Failed to delete order");
      }
    } catch (err) {
      setError(err.message || "Error deleting order");
    }
  };

  // ==================== OPEN MODAL ====================
  const openStatusModal = (order) => {
    setSelectedOrder(order);
    setOrderStatus(order.orderStatus || "Pending");
    setShowModal(true);
    setError("");
    setSuccess("");
  };

  // ==================== GET STATUS COLOR ====================
  const getStatusColor = (status) => {
    const colors = {
      "Pending": "warning",
      "Confirmed": "info",
      "Processing for Shipping": "primary",
      "Shipped": "info",
      "In Transit": "warning",
      "Out for Delivery": "warning",
      "Delivered": "success",
      "Cancelled": "danger",
      "Returned to Origin": "secondary",
      "Partial Payment Received": "info",
      "Awaiting Advance Payment": "warning",
      "Awaiting Payment": "warning",
      "Payment Failed": "danger",
      "Payment Received": "success",
    };
    return colors[status] || "secondary";
  };

  // ==================== GET STATUS ICON ====================
  const getStatusIcon = (status) => {
    const icons = {
      "Delivered": <FaCheckCircle className="text-success" />,
      "Cancelled": <FaTimesCircle className="text-danger" />,
      "Shipped": <FaShippingFast className="text-info" />,
      "Processing for Shipping": <FaBoxOpen className="text-primary" />,
    };
    return icons[status] || <FaClock className="text-warning" />;
  };

  // ==================== CALCULATE COUNTS ====================
  const deliveredCount = orders.filter(o => o.orderStatus === "Delivered").length;
  const pendingCount = orders.filter(o => o.orderStatus === "Pending").length;
  const cancelledCount = orders.filter(o => o.orderStatus === "Cancelled").length;
  const shippedCount = orders.filter(o => o.orderStatus === "Shipped").length;

  // ==================== STATUS OPTIONS ====================
  const statusOptions = [
    "Pending",
    "Confirmed",
    "Processing for Shipping",
    "Shipped",
    "In Transit",
    "Out for Delivery",
    "Delivered",
    "Cancelled",
    "Returned to Origin",
    "Partial Payment Received",
    "Awaiting Advance Payment",
    "Awaiting Payment",
    "Payment Failed",
    "Payment Received",
  ];

  return (
    <div>
      <Header />
      <Sidebar />

      <div className="admin-layout">
        <main className="admin-content">
          <Container fluid>
            <motion.h4
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4"
            >
              📦 Delivery Status
            </motion.h4>

            {/* ===== SUCCESS/ERROR ALERTS ===== */}
            {success && (
              <Alert variant="success" onClose={() => setSuccess("")} dismissible>
                {success}
              </Alert>
            )}
            {error && (
              <Alert variant="danger" onClose={() => setError("")} dismissible>
                {error}
              </Alert>
            )}

            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Loading orders...</p>
              </div>
            ) : (
              <>
                {/* ===== STATS ===== */}
                <Row className="g-4 mb-4">
                  <Col lg={3} md={6}>
                    <motion.div whileHover={{ scale: 1.04 }}>
                      <Card className="delivery-card total">
                        <FaTruck className="icon" />
                        <h6>Total Orders</h6>
                        <h3>{stats.totalOrders || orders.length}</h3>
                      </Card>
                    </motion.div>
                  </Col>

                  <Col lg={3} md={6}>
                    <motion.div whileHover={{ scale: 1.04 }}>
                      <Card className="delivery-card delivered">
                        <FaCheckCircle className="icon" />
                        <h6>Delivered</h6>
                        <h3>{stats.deliveredCount || deliveredCount}</h3>
                      </Card>
                    </motion.div>
                  </Col>

                  <Col lg={3} md={6}>
                    <motion.div whileHover={{ scale: 1.04 }}>
                      <Card className="delivery-card pending">
                        <FaClock className="icon" />
                        <h6>Pending</h6>
                        <h3>{stats.pendingCount || pendingCount}</h3>
                      </Card>
                    </motion.div>
                  </Col>

                  <Col lg={3} md={6}>
                    <motion.div whileHover={{ scale: 1.04 }}>
                      <Card className="delivery-card shipped">
                        <FaShippingFast className="icon" />
                        <h6>Shipped</h6>
                        <h3>{stats.shippedCount || shippedCount}</h3>
                      </Card>
                    </motion.div>
                  </Col>
                </Row>

                {/* ===== TABLE ===== */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="table-wrapper"
                >
                  <div className="table-responsive">
                    <Table striped bordered hover>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Order ID</th>
                          <th>Customer</th>
                          <th>Total (₹)</th>
                          <th>Status</th>
                          <th>Payment</th>
                          <th>Date</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.length === 0 ? (
                          <tr>
                            <td colSpan="8" className="text-center py-4">
                              No orders found
                            </td>
                          </tr>
                        ) : (
                          orders.map((order, index) => (
                            <motion.tr
                              key={order._id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.03 }}
                            >
                              <td>{index + 1}</td>
                              <td>
                                <strong>{order.customOrderId || order._id}</strong>
                              </td>
                              <td>
                                {order.customerName || order.address?.name || "Guest"}
                              </td>
                              <td>₹{order.totalAmount?.toFixed(2) || "0.00"}</td>
                              <td>
                                <Badge bg={getStatusColor(order.orderStatus)}>
                                  {getStatusIcon(order.orderStatus)} {order.orderStatus || "Pending"}
                                </Badge>
                              </td>
                              <td>
                                <Badge bg="secondary">
                                  {order.paymentMethod?.toUpperCase() || "N/A"}
                                </Badge>
                              </td>
                              <td>
                                {new Date(order.createdAt).toLocaleDateString("en-GB", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </td>
                              <td>
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  className="me-1"
                                  onClick={() => openStatusModal(order)}
                                  title="Update Status"
                                >
                                  <FaEdit />
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleDeleteOrder(order._id)}
                                  title="Delete"
                                >
                                  <FaTrash />
                                </Button>
                              </td>
                            </motion.tr>
                          ))
                        )}
                      </tbody>
                    </Table>
                  </div>

                  {/* ===== PAGINATION ===== */}
                  {orders.length > 0 && (
                    <div className="d-flex justify-content-between align-items-center mt-3">
                      <span className="text-muted">
                        Showing {orders.length} orders
                      </span>
                      <div>
                        <Button variant="outline-secondary" size="sm" className="me-1">
                          Previous
                        </Button>
                        <Button variant="outline-secondary" size="sm">
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </motion.div>
              </>
            )}

            {/* ===== UPDATE STATUS MODAL ===== */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
              <Modal.Header closeButton>
                <Modal.Title>Update Order Status</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <div className="mb-3">
                  <p>
                    <strong>Order ID:</strong> {selectedOrder?.customOrderId || selectedOrder?._id}
                  </p>
                  <p>
                    <strong>Customer:</strong> {selectedOrder?.customerName || "Guest"}
                  </p>
                  <p>
                    <strong>Current Status:</strong>{" "}
                    <Badge bg={getStatusColor(selectedOrder?.orderStatus)}>
                      {selectedOrder?.orderStatus || "Pending"}
                    </Badge>
                  </p>
                </div>

                <Form.Group>
                  <Form.Label>New Status</Form.Label>
                  <Form.Select
                    value={orderStatus}
                    onChange={(e) => setOrderStatus(e.target.value)}
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleUpdateStatus}
                  disabled={updating}
                >
                  {updating ? <Spinner size="sm" animation="border" /> : "Update Status"}
                </Button>
              </Modal.Footer>
            </Modal>
          </Container>
        </main>
      </div>
    </div>
  );
};

export default Delivery;