// src/pages/Order/Order.js

import { useEffect, useState } from "react";
import { 
  Container, 
  Table, 
  Badge, 
  Button, 
  Modal, 
  Spinner, 
  Form, 
  Alert,
  Row,
  Col,
  Card
} from "react-bootstrap";
import { motion } from "framer-motion";
import { 
  FaEye, 
  FaEdit, 
  FaTrash, 
  FaShippingFast, 
  FaCheckCircle, 
  FaTimesCircle,
  FaClock,
  FaBox,
  FaTruck,
  FaRupeeSign
} from "react-icons/fa";

import "./order.css";
import Header from "../../component/header/header";
import Sidebar from "../../component/sidebar/sidebar";

const Order = () => {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [viewOrder, setViewOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Status update modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [updating, setUpdating] = useState(false);

  // Delete confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);

  const token = localStorage.getItem("token");
  const API = "http://localhost:7000/api/admin";

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

  // ==================== STATUS COLORS ====================
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

  // ==================== STATUS ICONS ====================
  const getStatusIcon = (status) => {
    const icons = {
      "Delivered": <FaCheckCircle className="text-success" />,
      "Cancelled": <FaTimesCircle className="text-danger" />,
      "Shipped": <FaTruck className="text-info" />,
      "Processing for Shipping": <FaBox className="text-primary" />,
      "Pending": <FaClock className="text-warning" />,
      "In Transit": <FaTruck className="text-warning" />,
      "Out for Delivery": <FaTruck className="text-warning" />,
      "Confirmed": <FaCheckCircle className="text-info" />,
    };
    return icons[status] || <FaClock className="text-secondary" />;
  };

  // ==================== FETCH ORDERS ====================
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API}/orders`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned non-JSON response. Please check API endpoint.");
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to load orders");
      }
      
      if (data.success) {
        setOrders(data.data || []);
        setStats(data.stats || {});
      } else {
        setOrders(data.orders || []);
        setStats({});
      }
      
    } catch (err) {
      console.error("Fetch orders error:", err);
      setError(err.message || "Failed to load orders. Please check if server is running.");
      setOrders([]);
      setStats({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      setError("No authentication token found. Please login.");
      setLoading(false);
      return;
    }
    fetchOrders();
  }, [token]);

  // ==================== UPDATE ORDER STATUS ====================
  const handleStatusChange = async () => {
    if (!selectedOrder || !newStatus) return;

    try {
      setUpdating(true);
      setError("");

      const response = await fetch(`${API}/orders/${selectedOrder._id}/status`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderStatus: newStatus }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to update status");
      }

      setSuccess(`Order status updated to "${newStatus}" successfully!`);
      setShowStatusModal(false);
      fetchOrders();
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Update status error:", err);
      setError(err.message || "Failed to update order status");
      setTimeout(() => setError(""), 3000);
    } finally {
      setUpdating(false);
    }
  };

  // ==================== DELETE ORDER ====================
  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;

    try {
      const response = await fetch(`${API}/orders/${orderToDelete}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to delete order");
      }

      setSuccess("Order deleted successfully!");
      setShowDeleteModal(false);
      setOrderToDelete(null);
      fetchOrders();
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Delete order error:", err);
      setError(err.message || "Failed to delete order");
      setTimeout(() => setError(""), 3000);
    }
  };

  // ==================== OPEN STATUS MODAL ====================
  const openStatusModal = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.orderStatus || "Pending");
    setShowStatusModal(true);
  };

  // ==================== OPEN DELETE MODAL ====================
  const openDeleteModal = (orderId) => {
    setOrderToDelete(orderId);
    setShowDeleteModal(true);
  };

  // ==================== FORMAT DATE ====================
  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ==================== GET TOTAL ITEMS ====================
  const getTotalItems = (items) => {
    if (!items || !Array.isArray(items)) return 0;
    return items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="admin-layout">
          <Sidebar />
          <main className="admin-content">
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Loading orders...</p>
            </div>
          </main>
        </div>
      </>
    );
  }

  return (
    <>
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
              <h4>📦 Order Management</h4>
              <Button 
                variant="outline-primary" 
                size="sm"
                onClick={fetchOrders}
              >
                🔄 Refresh
              </Button>
            </motion.div>

            {/* Alerts */}
            {error && (
              <Alert variant="danger" onClose={() => setError("")} dismissible>
                <Alert.Heading>Error!</Alert.Heading>
                <p>{error}</p>
              </Alert>
            )}
            {success && (
              <Alert variant="success" onClose={() => setSuccess("")} dismissible>
                <Alert.Heading>Success!</Alert.Heading>
                <p>{success}</p>
              </Alert>
            )}

            {/* Stats Row */}
            <Row className="g-3 mb-4">
              <Col md={3}>
                <Card className="stat-card border-start border-primary border-4">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="text-muted mb-1">Total Orders</h6>
                        <h3 className="mb-0">{stats.totalOrders || orders.length}</h3>
                      </div>
                      <div className="stat-icon bg-primary bg-opacity-10 rounded-circle p-3">
                        <FaBox className="text-primary" size={24} />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={3}>
                <Card className="stat-card border-start border-success border-4">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="text-muted mb-1">Delivered</h6>
                        <h3 className="mb-0 text-success">{stats.deliveredCount || 0}</h3>
                      </div>
                      <div className="stat-icon bg-success bg-opacity-10 rounded-circle p-3">
                        <FaCheckCircle className="text-success" size={24} />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={3}>
                <Card className="stat-card border-start border-warning border-4">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="text-muted mb-1">Pending</h6>
                        <h3 className="mb-0 text-warning">{stats.pendingCount || 0}</h3>
                      </div>
                      <div className="stat-icon bg-warning bg-opacity-10 rounded-circle p-3">
                        <FaClock className="text-warning" size={24} />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={3}>
                <Card className="stat-card border-start border-danger border-4">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="text-muted mb-1">Cancelled</h6>
                        <h3 className="mb-0 text-danger">{stats.cancelledCount || 0}</h3>
                      </div>
                      <div className="stat-icon bg-danger bg-opacity-10 rounded-circle p-3">
                        <FaTimesCircle className="text-danger" size={24} />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Orders Table */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="table-wrapper bg-white p-3 rounded shadow-sm"
            >
              <div className="table-responsive">
                <Table striped bordered hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: "50px" }}>#</th>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Items</th>
                      <th>Payment</th>
                      <th className="text-end">Total</th>
                      <th style={{ width: "180px" }}>Status</th>
                      <th style={{ width: "150px" }} className="text-center">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center py-4">
                          <div className="text-muted">
                            <FaBox size={40} className="mb-2 d-block mx-auto" />
                            No orders found
                          </div>
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
                            <br />
                            <small className="text-muted">{formatDate(order.createdAt)}</small>
                          </td>

                          <td>
                            <div><b>{order.customerName || order.address?.name || "Guest"}</b></div>
                            <div className="text-muted small">
                              {order.customerEmail || order.address?.email || "No email"}
                            </div>
                            <div className="text-muted small">
                              📱 {order.address?.mobile || "No phone"}
                            </div>
                          </td>

                          <td>
                            <Badge bg="secondary" pill>
                              {getTotalItems(order.items)} items
                            </Badge>
                            <div className="small text-muted mt-1">
                              {order.items?.slice(0, 2).map((i) => i.productName || i.name).join(", ")}
                              {order.items?.length > 2 && ` +${order.items.length - 2} more`}
                            </div>
                          </td>

                          <td>
                            <Badge bg="secondary">
                              {order.paymentMethod?.toUpperCase() || "N/A"}
                            </Badge>
                            {order.status && (
                              <div className="small text-muted mt-1">
                                {order.status}
                              </div>
                            )}
                          </td>

                          <td className="text-end fw-bold">
                            ₹{order.totalAmount?.toFixed(2) || "0.00"}
                          </td>

                          <td>
                            <Badge 
                              bg={getStatusColor(order.orderStatus)} 
                              className="d-flex align-items-center gap-1"
                              style={{ fontSize: "12px", padding: "6px 12px", width: "fit-content" }}
                            >
                              {getStatusIcon(order.orderStatus)} {order.orderStatus || "Pending"}
                            </Badge>
                          </td>

                          <td className="text-center">
                            <Button 
                              variant="outline-primary" 
                              size="sm" 
                              className="me-1 mb-1"
                              onClick={() => openStatusModal(order)}
                              title="Update Status"
                            >
                              <FaEdit />
                            </Button>
                            <Button 
                              variant="outline-info" 
                              size="sm" 
                              className="me-1 mb-1"
                              onClick={() => setViewOrder(order)}
                              title="View Details"
                            >
                              <FaEye />
                            </Button>
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              className="mb-1"
                              onClick={() => openDeleteModal(order._id)}
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

              {/* Footer */}
              {orders.length > 0 && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <span className="text-muted">
                    Showing {orders.length} order{orders.length > 1 ? 's' : ''}
                  </span>
                  <span className="text-muted">
                    Total Revenue: <strong>₹{stats.totalRevenue?.toFixed(2) || "0.00"}</strong>
                  </span>
                </div>
              )}
            </motion.div>
          </Container>
        </main>
      </div>

      {/* ================= VIEW ORDER MODAL ================= */}
      <Modal show={!!viewOrder} onHide={() => setViewOrder(null)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Order Details</Modal.Title>
        </Modal.Header>

        {viewOrder && (
          <Modal.Body>
            <Row>
              <Col md={6}>
                <p><b>Order ID:</b> {viewOrder.customOrderId || viewOrder._id}</p>
                <p><b>Date:</b> {formatDate(viewOrder.createdAt)}</p>
                <p>
                  <b>Status:</b>{" "}
                  <Badge bg={getStatusColor(viewOrder.orderStatus)}>
                    {getStatusIcon(viewOrder.orderStatus)} {viewOrder.orderStatus}
                  </Badge>
                </p>
                <p><b>Payment:</b> {viewOrder.paymentMethod?.toUpperCase()}</p>
                <p><b>Total:</b> ₹{viewOrder.totalAmount?.toFixed(2)}</p>
              </Col>
              <Col md={6}>
                <h6>Customer Details</h6>
                <p><b>Name:</b> {viewOrder.customerName || viewOrder.address?.name}</p>
                <p><b>Email:</b> {viewOrder.customerEmail || viewOrder.address?.email}</p>
                <p><b>Phone:</b> {viewOrder.address?.mobile}</p>
              </Col>
            </Row>

            <hr />

            <h6>Shipping Address</h6>
            <p className="mb-0">
              {viewOrder.address?.houseNumber || ""} {viewOrder.address?.buildingName || ""}
            </p>
            <p className="mb-0">
              {viewOrder.address?.road || ""} {viewOrder.address?.landmark ? `(Near: ${viewOrder.address.landmark})` : ""}
            </p>
            <p>
              {viewOrder.address?.city || ""}, {viewOrder.address?.state || ""} - {viewOrder.address?.pincode || ""}
            </p>

            <hr />

            <h6>Products</h6>
            <Table bordered size="sm" responsive>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product</th>
                  <th className="text-center">Qty</th>
                  <th className="text-end">Price</th>
                  <th className="text-end">Total</th>
                </tr>
              </thead>
              <tbody>
                {viewOrder.items?.map((item, idx) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td>
                      {item.productName || item.name}
                      {item.isFree && <Badge bg="success" className="ms-1">FREE</Badge>}
                    </td>
                    <td className="text-center">{item.quantity}</td>
                    <td className="text-end">₹{item.priceAtBuy || item.price || 0}</td>
                    <td className="text-end">₹{((item.priceAtBuy || item.price || 0) * (item.quantity || 0)).toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="table-light">
                  <td colSpan="4" className="text-end fw-bold">Subtotal:</td>
                  <td className="text-end">₹{viewOrder.subtotal?.toFixed(2) || "0.00"}</td>
                </tr>
                {viewOrder.discount > 0 && (
                  <tr>
                    <td colSpan="4" className="text-end fw-bold text-success">Discount:</td>
                    <td className="text-end text-success">-₹{viewOrder.discount?.toFixed(2)}</td>
                  </tr>
                )}
                {viewOrder.shippingCost > 0 && (
                  <tr>
                    <td colSpan="4" className="text-end fw-bold">Shipping:</td>
                    <td className="text-end">₹{viewOrder.shippingCost?.toFixed(2)}</td>
                  </tr>
                )}
                <tr className="table-primary">
                  <td colSpan="4" className="text-end fw-bold fs-6">Total:</td>
                  <td className="text-end fw-bold fs-6">₹{viewOrder.totalAmount?.toFixed(2)}</td>
                </tr>
              </tbody>
            </Table>
          </Modal.Body>
        )}
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setViewOrder(null)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ================= UPDATE STATUS MODAL ================= */}
      <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Update Order Status</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder && (
            <>
              <div className="mb-3">
                <p><b>Order ID:</b> {selectedOrder.customOrderId || selectedOrder._id}</p>
                <p><b>Customer:</b> {selectedOrder.customerName || selectedOrder.address?.name}</p>
                <p>
                  <b>Current Status:</b>{" "}
                  <Badge bg={getStatusColor(selectedOrder.orderStatus)}>
                    {getStatusIcon(selectedOrder.orderStatus)} {selectedOrder.orderStatus || "Pending"}
                  </Badge>
                </p>
              </div>

              <Form.Group>
                <Form.Label>Select New Status</Form.Label>
                <Form.Select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="form-select-lg"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              {selectedOrder.orderStatus === "Delivered" && (
                <Alert variant="info" className="mt-3">
                  ⚠️ This order is already delivered. Changing status may affect delivery records.
                </Alert>
              )}
              {selectedOrder.orderStatus === "Cancelled" && (
                <Alert variant="danger" className="mt-3">
                  ⚠️ This order is cancelled. Changing status will reactivate it.
                </Alert>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStatusModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleStatusChange}
            disabled={updating || !newStatus || newStatus === selectedOrder?.orderStatus}
          >
            {updating ? (
              <>
                <Spinner size="sm" animation="border" className="me-2" />
                Updating...
              </>
            ) : (
              "Update Status"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger">Delete Order</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center py-3">
            <FaTrash size={48} className="text-danger mb-3" />
            <h5>Are you sure you want to delete this order?</h5>
            <p className="text-muted">This action cannot be undone.</p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteOrder}>
            <FaTrash className="me-2" /> Delete Order
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Order;