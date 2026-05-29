import { useState, useEffect } from "react";
import {
  Container,
  Table,
  Button,
  Modal,
  Form,
  Spinner,
  Alert,
  Badge,
} from "react-bootstrap";
import { motion } from "framer-motion";
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaImage, 
  FaEye, 
  FaEyeSlash,
  FaTags 
} from "react-icons/fa";
import axios from "axios";
import Header from "../../component/header/header";
import Sidebar from "../../component/sidebar/sidebar";
import "./categories.css";

const API_URL = "http://localhost:7000/api/category";

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "active",
    image: null
  });
  const [imagePreview, setImagePreview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [failedImages, setFailedImages] = useState({});

  const token = localStorage.getItem("token");

  // ✅ IMAGE URL FUNCTION
  const getImageUrl = (image) => {
    if (!image) return null;
    if (image.startsWith("http")) return image;
    if (image.startsWith("/images")) return `http://localhost:7000${image}`;
    return `http://localhost:7000/images/categories/${image}`;
  };

  // Generate placeholder image with text
  const getPlaceholderUrl = (name) => {
    return `https://via.placeholder.com/50x50/FF6B6B/FFFFFF?text=${name?.charAt(0).toUpperCase() || '?'}`;
  };

  // Fetch all categories
  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(res.data.categories || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const openModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || "",
        status: category.status,
        image: null
      });
      if (category.image) {
        setImagePreview(getImageUrl(category.image));
      } else {
        setImagePreview("");
      }
    } else {
      setEditingCategory(null);
      setFormData({
        name: "",
        description: "",
        status: "active",
        image: null
      });
      setImagePreview("");
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("status", formData.status);
      if (formData.image) {
        formDataToSend.append("image", formData.image);
      }

      if (editingCategory) {
        await axios.put(`${API_URL}/category/${editingCategory._id}`, formDataToSend, {
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          }
        });
        setSuccess("Category updated successfully!");
      } else {
        await axios.post(`${API_URL}/category`, formDataToSend, {
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          }
        });
        setSuccess("Category created successfully!");
      }

      fetchCategories();
      setShowModal(false);
      setImagePreview("");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;

    try {
      await axios.delete(`${API_URL}/category/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess("Category deleted successfully!");
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete category");
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    try {
      await axios.patch(`${API_URL}/category/${id}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess(`Category ${newStatus === "active" ? "activated" : "deactivated"}!`);
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update status");
    }
  };

  if (loading) {
    return (
      <div className="loader">
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="admin-layout">
        <Sidebar />
      </div>

      <main className="admin-content">
        <Container fluid>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="d-flex justify-content-between align-items-center mb-4"
          >
            <h4 className="page-title">
              <FaTags className="me-2" /> Category Management
            </h4>
            <Button variant="primary" onClick={() => openModal()}>
              <FaPlus className="me-2" /> Add Category
            </Button>
          </motion.div>

          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <motion.div
            className="table-wrapper"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Table hover responsive className="category-table">
              <thead>
                <tr>
                  <th style={{ width: "15%" }}>Image</th>
                  <th style={{ width: "25%" }}>Name</th>
                  <th style={{ width: "30%" }}>Description</th>
                  <th style={{ width: "10%" }}>Status</th>
                  <th style={{ width: "20%" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center">No categories found</td>
                  </tr>
                ) : (
                  categories.map((category, idx) => {
                    const imageUrl = getImageUrl(category.image);
                    const usePlaceholder = failedImages[category._id] || !imageUrl;
                    
                    return (
                      <motion.tr
                        key={category._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <td style={{ textAlign: "center" }}>
                          {usePlaceholder ? (
                            <div style={{
                              height: "50px",
                              width: "50px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: "#FF6B6B",
                              borderRadius: "8px",
                              color: "white",
                              fontSize: "20px",
                              fontWeight: "bold"
                            }}>
                              {category.name?.charAt(0).toUpperCase()}
                            </div>
                          ) : (
                            <img
                              src={imageUrl}
                              alt={category.name}
                              style={{ 
                                height: "50px", 
                                width: "50px",
                                objectFit: "cover",
                                borderRadius: "8px"
                              }}
                              onError={() => {
                                console.log(`Image failed: ${imageUrl}`);
                                setFailedImages(prev => ({ ...prev, [category._id]: true }));
                              }}
                            />
                          )}
                        </td>
                        <td className="fw-semibold">{category.name}</td>
                        <td className="text-muted">{category.description || "—"}</td>
                        <td>
                          <Badge bg={category.status === "active" ? "success" : "danger"}>
                            {category.status === "active" ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="action-buttons">
                          <Button
                            size="sm"
                            variant="outline-primary"
                            onClick={() => openModal(category)}
                            title="Edit"
                          >
                            <FaEdit />
                          </Button>
                          <Button
                            size="sm"
                            variant={category.status === "active" ? "outline-warning" : "outline-success"}
                            onClick={() => toggleStatus(category._id, category.status)}
                            title={category.status === "active" ? "Deactivate" : "Activate"}
                          >
                            {category.status === "active" ? <FaEyeSlash /> : <FaEye />}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={() => handleDelete(category._id)}
                            title="Delete"
                          >
                            <FaTrash />
                          </Button>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </Table>
          </motion.div>
        </Container>
      </main>

      <Modal show={showModal} onHide={() => {
        setShowModal(false);
        setImagePreview("");
        setFormData({
          name: "",
          description: "",
          status: "active",
          image: null
        });
      }} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingCategory ? "Edit Category" : "Add New Category"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Category Name *</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter category name"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter category description"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Category Image</Form.Label>
              <Form.Control
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
              {imagePreview && (
                <div className="mt-2">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    style={{ 
                      maxHeight: "100px", 
                      maxWidth: "100px",
                      objectFit: "cover",
                      borderRadius: "8px"
                    }}
                  />
                </div>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? <Spinner size="sm" /> : (editingCategory ? "Update" : "Create")}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AdminCategories;