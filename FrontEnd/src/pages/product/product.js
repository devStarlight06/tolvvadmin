// src/pages/Product/Product.js

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
  Row,
  Col,
  Card,
} from "react-bootstrap";
import { motion } from "framer-motion";
import { 
  FaEdit, 
  FaTrash, 
  FaBoxOpen, 
  FaPlus, 
  FaSearch,
  FaImage,
  FaUpload,
  FaTimes
} from "react-icons/fa";
import Header from "../../component/header/header";
import Sidebar from "../../component/sidebar/sidebar";
import "./product.css";

const Product = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [addData, setAddData] = useState({
    ProductName: "",
    ProductPrice: "",
    Category: "",
    Zodiac: "",
    Description: "",
    Image: "",
    size: "",
    color: "",
    stock: "",
    isActive: true,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterZodiac, setFilterZodiac] = useState("");

  const token = localStorage.getItem("token");
  const API = "http://localhost:7000/api/admin";

  // Sun signs/Zodiac signs
  const zodiacSigns = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
  ];

  // Categories
  const categories = [
    "Bath Gel",
    "Body Lotion",
    "Soap",
    "Perfume",
    "Essential Oil",
    "Hamper",
    "Other"
  ];

  // ==================== FETCH PRODUCTS (ALL) ====================
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");
      
      const res = await fetch(`${API}/products?limit=10000`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch products");
      }
      
      console.log("API Response:", data);

      let productList = [];
      
      if (data.success && data.data) {
        productList = data.data;
      } else if (data.companies) {
        productList = data.companies.flatMap((c) => c.products);
      } else if (Array.isArray(data)) {
        productList = data;
      } else if (data.products) {
        productList = data.products;
      } else {
        for (const key in data) {
          if (Array.isArray(data[key])) {
            productList = data[key];
            break;
          }
        }
      }

      console.log(`✅ Loaded ${productList.length} products`);
      setProducts(productList || []);
      
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message || "Failed to load products.");
      setProducts([]);
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
    fetchProducts();
  }, [token]);

  // ==================== GET UNIQUE CATEGORIES ====================
  const getUniqueCategories = () => {
    const cats = new Set();
    products.forEach(p => {
      const cat = p.Category || p.category;
      if (cat) cats.add(cat);
    });
    if (cats.size === 0) {
      categories.forEach(cat => cats.add(cat));
    }
    return Array.from(cats).sort();
  };

  const uniqueCategories = getUniqueCategories();

  // ==================== HANDLE MULTIPLE IMAGE UPLOAD ====================
  const handleMultipleImageUpload = (e, isEdit = false) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Validate each file
    const validFiles = [];
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        setError(`"${file.name}" is not a valid image type`);
        setTimeout(() => setError(""), 3000);
        continue;
      }
      if (file.size > maxSize) {
        setError(`"${file.name}" exceeds 5MB limit`);
        setTimeout(() => setError(""), 3000);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    // Create previews
    const previews = [];
    const readers = validFiles.map((file, index) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          previews[index] = reader.result;
          resolve();
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then(() => {
      if (isEdit) {
        const currentImages = editData.images || [];
        const newImages = validFiles.map(file => file);
        setEditData({ 
          ...editData, 
          images: [...currentImages, ...newImages],
          Image: [...currentImages, ...newImages].length > 0 ? previews[0] : ""
        });
        setImagePreviews([...imagePreviews, ...previews]);
      } else {
        const currentImages = addData.images || [];
        const newImages = validFiles.map(file => file);
        setAddData({ 
          ...addData, 
          images: [...currentImages, ...newImages],
          Image: [...currentImages, ...newImages].length > 0 ? previews[0] : ""
        });
        setImagePreviews([...imagePreviews, ...previews]);
      }
      setSelectedImages([...selectedImages, ...validFiles]);
    });
  };

  // ==================== REMOVE IMAGE ====================
  const removeImage = (index, isEdit = false) => {
    if (isEdit) {
      const newImages = [...(editData.images || [])];
      newImages.splice(index, 1);
      const newPreviews = [...imagePreviews];
      newPreviews.splice(index, 1);
      setEditData({ 
        ...editData, 
        images: newImages,
        Image: newImages.length > 0 ? newPreviews[0] : ""
      });
      setImagePreviews(newPreviews);
    } else {
      const newImages = [...(addData.images || [])];
      newImages.splice(index, 1);
      const newPreviews = [...imagePreviews];
      newPreviews.splice(index, 1);
      setAddData({ 
        ...addData, 
        images: newImages,
        Image: newImages.length > 0 ? newPreviews[0] : ""
      });
      setImagePreviews(newPreviews);
    }
  };

  // ==================== DELETE PRODUCT ====================
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    
    try {
      const res = await fetch(`${API}/product/${id}`, {
        method: "DELETE",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || "Failed to delete product");
      
      setSuccess("Product deleted successfully!");
      fetchProducts();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(""), 3000);
    }
  };

  // ==================== UPDATE PRODUCT ====================
  const handleUpdate = async () => {
    try {
      // If there are new image files, upload them
      let imageData = editData.Image || "";
      
      // For multiple images, we'll store as JSON string or use the first image
      if (editData.images && editData.images.length > 0) {
        // Store the first image as main Image
        imageData = editData.Image || "";
      }

      const productData = {
        ProductName: editData.ProductName,
        ProductPrice: parseFloat(editData.ProductPrice),
        Category: editData.Category || editData.category,
        Zodiac: editData.Zodiac || editData.sunSign,
        Description: editData.Description || editData.description || "",
        Image: imageData,
        size: editData.size || "",
        color: editData.color || "",
        stock: parseInt(editData.stock) || 0,
        isActive: editData.isActive !== false,
      };

      const res = await fetch(`${API}/product/${editData._id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || "Failed to update product");
      
      setSuccess("Product updated successfully!");
      setShowEditModal(false);
      setImagePreviews([]);
      setSelectedImages([]);
      fetchProducts();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(""), 3000);
    }
  };

  // ==================== ADD PRODUCT ====================
  const handleAdd = async () => {
    try {
      let imageData = addData.Image || "";

      const productData = {
        ProductName: addData.ProductName,
        ProductPrice: parseFloat(addData.ProductPrice),
        Category: addData.Category,
        Zodiac: addData.Zodiac,
        Description: addData.Description || "",
        Image: imageData,
        size: addData.size || "",
        color: addData.color || "",
        stock: parseInt(addData.stock) || 0,
        isActive: addData.isActive !== false,
      };

      const res = await fetch(`${API}/product`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        console.error("Error response:", data);
        throw new Error(data.message || "Failed to add product");
      }
      
      setSuccess("Product added successfully!");
      setShowAddModal(false);
      setImagePreviews([]);
      setSelectedImages([]);
      setAddData({
        ProductName: "",
        ProductPrice: "",
        Category: "",
        Zodiac: "",
        Description: "",
        Image: "",
        size: "",
        color: "",
        stock: "",
        isActive: true,
      });
      fetchProducts();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Add error:", err);
      setError(err.message || "Failed to add product");
      setTimeout(() => setError(""), 3000);
    }
  };

  // ==================== TOGGLE STATUS ====================
  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const res = await fetch(`${API}/product/${id}/toggle-status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || "Failed to toggle status");
      
      setSuccess(`Product ${currentStatus ? "deactivated" : "activated"} successfully!`);
      fetchProducts();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(""), 3000);
    }
  };

  // ==================== FILTERED PRODUCTS ====================
  const filteredProducts = products.filter(product => {
    const productName = (product.ProductName || "").toLowerCase();
    const productDesc = (product.Description || product.description || "").toLowerCase();
    const productCategory = product.Category || product.category || "";
    const productZodiac = product.Zodiac || product.sunSign || "";
    
    const matchesSearch = productName.includes(searchTerm.toLowerCase()) ||
                         productDesc.includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || productCategory === filterCategory;
    const matchesZodiac = !filterZodiac || productZodiac === filterZodiac;
    return matchesSearch && matchesCategory && matchesZodiac;
  });

  // ==================== GET PRODUCT NAME ====================
  const getProductName = (product) => {
    return product.ProductName || product.name || "Unnamed Product";
  };

  // ==================== GET PRODUCT PRICE ====================
  const getProductPrice = (product) => {
    return product.ProductPrice || product.price || 0;
  };

  // ==================== GET PRODUCT CATEGORY ====================
  const getProductCategory = (product) => {
    return product.Category || product.category || "N/A";
  };

  // ==================== GET PRODUCT ZODIAC ====================
  const getProductZodiac = (product) => {
    return product.Zodiac || product.sunSign || "N/A";
  };

  // ==================== GET PRODUCT SIZE ====================
  const getProductSize = (product) => {
    return product.size || "N/A";
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
              <p className="mt-3">Loading products...</p>
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
              <h4>
                <FaBoxOpen className="me-2" /> Product Management
                <Badge bg="secondary" className="ms-2">{products.length} Products</Badge>
              </h4>
              <Button variant="primary" onClick={() => setShowAddModal(true)}>
                <FaPlus className="me-2" /> Add Product
              </Button>
            </motion.div>

            {/* Alerts */}
            {error && (
              <Alert variant="danger" onClose={() => setError("")} dismissible>
                {error}
              </Alert>
            )}
            {success && (
              <Alert variant="success" onClose={() => setSuccess("")} dismissible>
                {success}
              </Alert>
            )}

            {/* Stats Cards */}
            <Row className="g-3 mb-4">
              <Col md={4}>
                <Card className="stat-card border-start border-primary border-4">
                  <Card.Body>
                    <h6 className="text-muted">Total Products</h6>
                    <h3>{products.length}</h3>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="stat-card border-start border-success border-4">
                  <Card.Body>
                    <h6 className="text-muted">Active</h6>
                    <h3 className="text-success">
                      {products.filter(p => p.isActive !== false).length}
                    </h3>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="stat-card border-start border-danger border-4">
                  <Card.Body>
                    <h6 className="text-muted">Inactive</h6>
                    <h3 className="text-danger">
                      {products.filter(p => p.isActive === false).length}
                    </h3>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Search and Filters */}
            <Row className="mb-3">
              <Col md={4}>
                <div className="search-box">
                  <FaSearch className="search-icon" />
                  <Form.Control
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </Col>
              <Col md={3}>
                <Form.Select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {uniqueCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={3}>
                <Form.Select
                  value={filterZodiac}
                  onChange={(e) => setFilterZodiac(e.target.value)}
                >
                  <option value="">All Zodiac Signs</option>
                  {zodiacSigns.map(sign => (
                    <option key={sign} value={sign}>{sign}</option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={2}>
                <Button variant="outline-secondary" onClick={fetchProducts}>
                  Refresh
                </Button>
              </Col>
            </Row>

            {/* Products Table */}
            <motion.div
              className="table-wrapper bg-white p-3 rounded shadow-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="table-responsive">
                <Table hover className="product-table mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Zodiac</th>
                      <th>Size</th>
                      <th className="text-end">Price</th>
                      <th className="text-center">Status</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center py-4 text-muted">
                          No products found
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((p, i) => (
                        <motion.tr
                          key={p._id || i}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.02 }}
                        >
                          <td>{i + 1}</td>
                          <td>
                            <div className="fw-semibold">{getProductName(p)}</div>
                            {p.Image && (
                              <small className="text-muted">🖼️ Has image</small>
                            )}
                            {p.color && (
                              <small className="text-muted ms-2">🎨 {p.color}</small>
                            )}
                          </td>
                          <td>
                            <Badge bg="secondary">{getProductCategory(p)}</Badge>
                          </td>
                          <td>
                            <Badge bg="info">{getProductZodiac(p)}</Badge>
                          </td>
                          <td>
                            <small>{getProductSize(p)}</small>
                          </td>
                          <td className="text-end fw-bold">
                            ₹{parseFloat(getProductPrice(p)).toFixed(2)}
                          </td>
                          <td className="text-center">
                            <Badge 
                              bg={p.isActive !== false ? "success" : "danger"}
                              style={{ cursor: "pointer" }}
                              onClick={() => handleToggleStatus(p._id, p.isActive)}
                            >
                              {p.isActive !== false ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                          <td className="text-center">
                            <Button
                              size="sm"
                              variant="outline-primary"
                              className="me-1"
                              onClick={() => {
                                setEditData(p);
                                setImagePreviews(p.Image ? [p.Image] : []);
                                setShowEditModal(true);
                              }}
                            >
                              <FaEdit />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-danger"
                              onClick={() => handleDelete(p._id)}
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
            </motion.div>
          </Container>
        </main>
      </div>

      {/* ================= ADD PRODUCT MODAL ================= */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Add New Product</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Product Name *</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter product name"
                    value={addData.ProductName}
                    onChange={(e) => setAddData({ ...addData, ProductName: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Price (₹) *</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="0.00"
                    value={addData.ProductPrice}
                    onChange={(e) => setAddData({ ...addData, ProductPrice: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Category</Form.Label>
                  <Form.Select
                    value={addData.Category}
                    onChange={(e) => setAddData({ ...addData, Category: e.target.value })}
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Zodiac Sign</Form.Label>
                  <Form.Select
                    value={addData.Zodiac}
                    onChange={(e) => setAddData({ ...addData, Zodiac: e.target.value })}
                  >
                    <option value="">Select Zodiac Sign</option>
                    {zodiacSigns.map(sign => (
                      <option key={sign} value={sign}>{sign}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Size</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g., 200 ML, 100 GM"
                    value={addData.size}
                    onChange={(e) => setAddData({ ...addData, size: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Color</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g., Red, Blue"
                    value={addData.color}
                    onChange={(e) => setAddData({ ...addData, color: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Stock</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="0"
                    value={addData.stock}
                    onChange={(e) => setAddData({ ...addData, stock: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Images</Form.Label>
                  <div className="image-upload-wrapper">
                    <Form.Control
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleMultipleImageUpload(e, false)}
                      className="image-upload-input"
                    />
                    <div className="image-upload-icon">
                      <FaUpload /> Choose Images (Multiple)
                    </div>
                  </div>
                  
                  {/* Image Previews */}
                  {imagePreviews.length > 0 && (
                    <div className="image-preview-container mt-2">
                      <div className="d-flex flex-wrap gap-2">
                        {imagePreviews.map((preview, index) => (
                          <div key={index} className="image-preview-item position-relative">
                            <img 
                              src={preview} 
                              alt={`Preview ${index + 1}`} 
                              className="img-fluid rounded"
                              style={{ maxHeight: "80px", maxWidth: "80px", objectFit: "cover" }}
                            />
                            <Button 
                              variant="danger" 
                              size="sm" 
                              className="position-absolute top-0 end-0 p-0 rounded-circle"
                              style={{ width: "20px", height: "20px", fontSize: "10px", lineHeight: "20px" }}
                              onClick={() => removeImage(index, false)}
                            >
                              <FaTimes />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <small className="text-muted">{imagePreviews.length} image(s) selected</small>
                    </div>
                  )}
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Product description..."
                value={addData.Description}
                onChange={(e) => setAddData({ ...addData, Description: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Active"
                checked={addData.isActive}
                onChange={(e) => setAddData({ ...addData, isActive: e.target.checked })}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => {
            setShowAddModal(false);
            setImagePreviews([]);
          }}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAdd}>
            Add Product
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ================= EDIT PRODUCT MODAL ================= */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Product</Modal.Title>
        </Modal.Header>
        {editData && (
          <Modal.Body>
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Product Name *</Form.Label>
                    <Form.Control
                      type="text"
                      value={editData.ProductName || ""}
                      onChange={(e) => setEditData({ ...editData, ProductName: e.target.value })}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Price (₹) *</Form.Label>
                    <Form.Control
                      type="number"
                      value={editData.ProductPrice || 0}
                      onChange={(e) => setEditData({ ...editData, ProductPrice: e.target.value })}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Category</Form.Label>
                    <Form.Select
                      value={editData.Category || editData.category || ""}
                      onChange={(e) => setEditData({ ...editData, Category: e.target.value })}
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Zodiac Sign</Form.Label>
                    <Form.Select
                      value={editData.Zodiac || editData.sunSign || ""}
                      onChange={(e) => setEditData({ ...editData, Zodiac: e.target.value })}
                    >
                      <option value="">Select Zodiac Sign</option>
                      {zodiacSigns.map(sign => (
                        <option key={sign} value={sign}>{sign}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Size</Form.Label>
                    <Form.Control
                      type="text"
                      value={editData.size || ""}
                      onChange={(e) => setEditData({ ...editData, size: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Color</Form.Label>
                    <Form.Control
                      type="text"
                      value={editData.color || ""}
                      onChange={(e) => setEditData({ ...editData, color: e.target.value })}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Stock</Form.Label>
                    <Form.Control
                      type="number"
                      value={editData.stock || 0}
                      onChange={(e) => setEditData({ ...editData, stock: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Images</Form.Label>
                    <div className="image-upload-wrapper">
                      <Form.Control
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleMultipleImageUpload(e, true)}
                        className="image-upload-input"
                      />
                      <div className="image-upload-icon">
                        <FaUpload /> Add More Images
                      </div>
                    </div>
                    
                    {/* Existing Image */}
                    {editData.Image && imagePreviews.length === 0 && (
                      <div className="image-preview-container mt-2">
                        <div className="d-flex flex-wrap gap-2">
                          <div className="image-preview-item">
                            <img 
                              src={editData.Image} 
                              alt="Current product" 
                              className="img-fluid rounded"
                              style={{ maxHeight: "80px", maxWidth: "80px", objectFit: "cover" }}
                            />
                          </div>
                        </div>
                        <small className="text-muted">Current image</small>
                      </div>
                    )}
                    
                    {/* New Image Previews */}
                    {imagePreviews.length > 0 && (
                      <div className="image-preview-container mt-2">
                        <div className="d-flex flex-wrap gap-2">
                          {imagePreviews.map((preview, index) => (
                            <div key={index} className="image-preview-item position-relative">
                              <img 
                                src={preview} 
                                alt={`Preview ${index + 1}`} 
                                className="img-fluid rounded"
                                style={{ maxHeight: "80px", maxWidth: "80px", objectFit: "cover" }}
                              />
                              <Button 
                                variant="danger" 
                                size="sm" 
                                className="position-absolute top-0 end-0 p-0 rounded-circle"
                                style={{ width: "20px", height: "20px", fontSize: "10px", lineHeight: "20px" }}
                                onClick={() => removeImage(index, true)}
                              >
                                <FaTimes />
                              </Button>
                            </div>
                          ))}
                        </div>
                        <small className="text-muted">{imagePreviews.length} new image(s)</small>
                      </div>
                    )}
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={editData.Description || editData.description || ""}
                  onChange={(e) => setEditData({ ...editData, Description: e.target.value })}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="Active"
                  checked={editData.isActive !== false}
                  onChange={(e) => setEditData({ ...editData, isActive: e.target.checked })}
                />
              </Form.Group>
            </Form>
          </Modal.Body>
        )}
        <Modal.Footer>
          <Button variant="secondary" onClick={() => {
            setShowEditModal(false);
            setImagePreviews([]);
          }}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleUpdate}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Product;