import { useEffect, useState } from "react";
import { Container, Table, Spinner, Button, Modal, Form, Alert, Tabs, Tab, Badge } from "react-bootstrap";
import { motion } from "framer-motion";
import { FaUserPlus, FaEdit, FaTrash, FaUsers, FaStore, FaEye } from "react-icons/fa";
import Header from "../../component/header/header";
import Sidebar from "../../component/sidebar/sidebar";
import "./customer.css";

const API_BASE = "http://localhost:7000/api/customers";

const Customer = () => {
  const [customers, setCustomers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("customers");
  const [authError, setAuthError] = useState("");
  
  // Modal states
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [vendorForm, setVendorForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    company: ""
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Get token and user role (case-insensitive)
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
      console.log("Grouped customers:", data);
      setCustomers(Array.isArray(data) ? data : []);
      setAuthError("");
    } catch (err) {
      console.error("Fetch customers error:", err);
      setAuthError("Failed to fetch customers. Please check your connection.");
    }
  };

  // Fetch Vendors
  const fetchVendors = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const res = await fetch(`${API_BASE}/vendors`, {
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });

      if (res.status === 403) {
        console.log("Admin access required for vendors");
        return;
      }

      const data = await res.json();
      setVendors(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch vendors error:", err);
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
      
      await Promise.all([fetchCustomers(), fetchVendors()]);
      setLoading(false);
    };
    loadData();
  }, []);

  // Handle Vendor Form Input
  const handleVendorInput = (e) => {
    setVendorForm({
      ...vendorForm,
      [e.target.name]: e.target.value
    });
  };

  // Open Add Vendor Modal
  const handleAddVendor = () => {
    setEditingVendor(null);
    setVendorForm({
      name: "",
      email: "",
      password: "",
      phone: "",
      company: ""
    });
    setShowVendorModal(true);
  };

  // Open Edit Vendor Modal
  const handleEditVendor = (vendor) => {
    setEditingVendor(vendor);
    setVendorForm({
      name: vendor.name,
      email: vendor.email,
      password: "",
      phone: vendor.phone || "",
      company: vendor.company || ""
    });
    setShowVendorModal(true);
  };

  // Save Vendor (Add or Update)
  const handleSaveVendor = async () => {
    if (!vendorForm.name || !vendorForm.email) {
      setMessage({ type: "error", text: "Name and email are required" });
      return;
    }

    if (!editingVendor && !vendorForm.password) {
      setMessage({ type: "error", text: "Password is required for new vendor" });
      return;
    }

    setModalLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const token = getToken();
      const url = editingVendor 
        ? `${API_BASE}/vendors/${editingVendor._id}`
        : `${API_BASE}/vendors`;
      
      const method = editingVendor ? "PUT" : "POST";
      
      const data = { ...vendorForm };
      if (editingVendor && !data.password) {
        delete data.password;
      }

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      const result = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: result.message });
        await fetchVendors();
        setTimeout(() => {
          setShowVendorModal(false);
          setMessage({ type: "", text: "" });
        }, 1500);
      } else {
        setMessage({ type: "error", text: result.message || "Failed to save vendor" });
      }
    } catch (err) {
      console.error("Save vendor error:", err);
      setMessage({ type: "error", text: "Server error" });
    } finally {
      setModalLoading(false);
    }
  };

  // Delete Vendor
  const handleDeleteVendor = async (vendorId) => {
    if (!window.confirm("Are you sure you want to delete this vendor?")) return;

    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/vendors/${vendorId}`, {
        method: "DELETE",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      const result = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: result.message });
        await fetchVendors();
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      } else {
        setMessage({ type: "error", text: result.message });
      }
    } catch (err) {
      console.error("Delete vendor error:", err);
      setMessage({ type: "error", text: "Failed to delete vendor" });
    }
  };

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
              <h4>Customer & Vendor Management</h4>
              {activeTab === "vendors" && (
                <Button variant="primary" onClick={handleAddVendor}>
                  <FaUserPlus className="me-2" /> Add Vendor
                </Button>
              )}
            </motion.div>

            {/* Message Alert */}
            {message.text && (
              <Alert 
                variant={message.type === "success" ? "success" : "danger"} 
                className="mb-3"
                dismissible
                onClose={() => setMessage({ type: "", text: "" })}
              >
                {message.text}
              </Alert>
            )}

            <Tabs
              activeKey={activeTab}
              onSelect={(k) => setActiveTab(k)}
              className="mb-4"
            >
              {/* Customers Tab - Grouped by email */}
              <Tab eventKey="customers" title={<span><FaUsers className="me-2" />Customers</span>}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="table-wrapper"
                >
                  <Table responsive bordered hover className="customers-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Orders</th>
                        <th>Total Spent</th>
                        <th>Last Order</th>
                        <th>Avg. Order Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="text-center">No customers found</td>
                        </tr>
                      ) : (
                        customers.map((customer, idx) => (
                          <motion.tr
                            key={customer.email || idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                          >
                            <td>{customer.name || "N/A"}</td>
                            <td>{customer.email || "N/A"}</td>
                            <td>{customer.phone || "N/A"}</td>
                            <td>
                              <Badge bg="primary" pill>
                                {customer.orderCount || 0}
                              </Badge>
                            </td>
                            <td className="fw-bold text-success">
                              ₹{(customer.totalSpent || 0).toFixed(2)}
                            </td>
                            <td>
                              {customer.lastOrderDate 
                                ? new Date(customer.lastOrderDate).toLocaleDateString() 
                                : "N/A"}
                            </td>
                            <td>
                              ₹{((customer.totalSpent || 0) / (customer.orderCount || 1)).toFixed(2)}
                            </td>
                          </motion.tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                  
                  {/* Summary Cards */}
                  <div className="row mt-4">
                    <div className="col-md-3">
                      <div className="summary-card p-3 border rounded">
                        <h6>Total Customers</h6>
                        <h3>{customers.length}</h3>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="summary-card p-3 border rounded">
                        <h6>Total Revenue</h6>
                        <h3 className="text-success">
                          ₹{customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0).toFixed(2)}
                        </h3>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="summary-card p-3 border rounded">
                        <h6>Total Orders</h6>
                        <h3>{customers.reduce((sum, c) => sum + (c.orderCount || 0), 0)}</h3>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="summary-card p-3 border rounded">
                        <h6>Avg. Order Value</h6>
                        <h3>
                          ₹{(customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0) / 
                            customers.reduce((sum, c) => sum + (c.orderCount || 0), 1)).toFixed(2)}
                        </h3>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Tab>

              {/* Vendors Tab */}
              <Tab eventKey="vendors" title={<span><FaStore className="me-2" />Vendors</span>}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="table-wrapper"
                >
                  <Table responsive bordered hover className="customers-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Company</th>
                        <th>Joined Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendors.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center">No vendors found</td>
                        </tr>
                      ) : (
                        vendors.map((vendor, idx) => (
                          <motion.tr
                            key={vendor._id || idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                          >
                            <td>{vendor.name}</td>
                            <td>{vendor.email}</td>
                            <td>{vendor.phone || "N/A"}</td>
                            <td>{vendor.company || "N/A"}</td>
                            <td>{vendor.createdAt ? new Date(vendor.createdAt).toLocaleDateString() : "N/A"}</td>
                            <td>
                              <Button 
                                variant="outline-primary" 
                                size="sm" 
                                className="me-2"
                                onClick={() => handleEditVendor(vendor)}
                              >
                                <FaEdit /> Edit
                              </Button>
                              <Button 
                                variant="outline-danger" 
                                size="sm"
                                onClick={() => handleDeleteVendor(vendor._id)}
                              >
                                <FaTrash /> Delete
                              </Button>
                            </td>
                          </motion.tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </motion.div>
              </Tab>
            </Tabs>
          </Container>
        </main>
      </div>

      {/* Add/Edit Vendor Modal */}
      <Modal show={showVendorModal} onHide={() => setShowVendorModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingVendor ? "Edit Vendor" : "Add New Vendor"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Name *</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={vendorForm.name}
                onChange={handleVendorInput}
                placeholder="Enter vendor name"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email *</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={vendorForm.email}
                onChange={handleVendorInput}
                placeholder="Enter vendor email"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                {editingVendor ? "Password (leave blank to keep current)" : "Password *"}
              </Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={vendorForm.password}
                onChange={handleVendorInput}
                placeholder={editingVendor ? "Enter new password" : "Enter password"}
                required={!editingVendor}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Phone</Form.Label>
              <Form.Control
                type="tel"
                name="phone"
                value={vendorForm.phone}
                onChange={handleVendorInput}
                placeholder="Enter phone number"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Company</Form.Label>
              <Form.Control
                type="text"
                name="company"
                value={vendorForm.company}
                onChange={handleVendorInput}
                placeholder="Enter company name"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowVendorModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveVendor} disabled={modalLoading}>
            {modalLoading ? <Spinner size="sm" className="me-2" /> : null}
            {editingVendor ? "Update" : "Add"} Vendor
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Customer;