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
import { FaEdit, FaTrash, FaBoxOpen } from "react-icons/fa";
import Header from "../../component/header/header";
import Sidebar from "../../component/sidebar/sidebar";
import "./product.css";

const Product = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [show, setShow] = useState(false);
  const [editData, setEditData] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(
          "http://localhost:7000/api/admin/products-summary",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await res.json();
        setProducts(data.companies.flatMap((c) => c.products));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [token]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    await fetch(`http://localhost:7000/api/admin/product/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setProducts(products.filter((p) => p._id !== id));
  };

  const handleSave = async () => {
    const res = await fetch(
      `http://localhost:7000/api/admin/product/${editData._id}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editData),
      }
    );
    const data = await res.json();
    setProducts(
      products.map((p) => (p._id === data.product._id ? data.product : p))
    );
    setShow(false);
  };

  if (loading)
    return (
      <div className="loader">
        <Spinner animation="border" />
      </div>
    );

  return (
    <>
      <Header />
      <div className="admin-layout">
        <Sidebar />
      </div>

      <main className="admin-content">
        <Container fluid>
          <motion.h4
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="page-title"
          >
            <FaBoxOpen /> Product Management
          </motion.h4>

          {error && <Alert variant="danger">{error}</Alert>}

          <motion.div
            className="table-wrapper"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Table hover responsive className="product-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price (₹)</th>

                  {/* <th>Actions</th> */}
                </tr>
              </thead>

              <tbody>
                {products.map((p, i) => (
                  <motion.tr
                    key={p._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <td className="fw-semibold">{p.name}</td>
                    <td>
                      <Badge bg="secondary">{p.category}</Badge>
                    </td>
                    <td>₹{p.price}</td>
                    {/* <td>
                      <Badge bg={p.active ? "success" : "warning"}>
                        {p.active ? "Active" : "Inactive"}
                      </Badge>
                    </td> */}
                    {/* <td className="action-buttons">
                      <Button
                        size="sm"
                        variant="outline-primary"
                        onClick={() => {
                          setEditData(p);
                          setShow(true);
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
                    </td> */}
                  </motion.tr>
                ))}
              </tbody>
            </Table>
          </motion.div>
        </Container>
      </main>

      {/* EDIT MODAL */}
      <Modal show={show} onHide={() => setShow(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Product</Modal.Title>
        </Modal.Header>
        {editData && (
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Name</Form.Label>
                <Form.Control
                  value={editData.name}
                  onChange={(e) =>
                    setEditData({ ...editData, name: e.target.value })
                  }
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Price</Form.Label>
                <Form.Control
                  type="number"
                  value={editData.price}
                  onChange={(e) =>
                    setEditData({ ...editData, price: e.target.value })
                  }
                />
              </Form.Group>
            </Form>
          </Modal.Body>
        )}
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShow(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Product;
