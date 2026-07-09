import { useState, useEffect } from "react";
import {
  Container,
  Table,
  Badge,
  Button,
  Image,
  Spinner,
  Modal,
  Form,
} from "react-bootstrap";
import { motion } from "framer-motion";
import { FaTrash } from "react-icons/fa";
import axios from "axios";

import Header from "../../component/header/header";
import Sidebar from "../../component/sidebar/sidebar";

const Categories = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);

  const [newCompany, setNewCompany] = useState({
    name: "",
    status: "Active",
    logo: null,
  });

  const [adding, setAdding] = useState(false);

  const API = "http://localhost:7000/api/admin/companies";

  // ---------------- FETCH COMPANIES ----------------
  const fetchCompanies = async () => {
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      const { data } = await axios.get(API, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setCompanies(data.companies);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch companies");
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  // ---------------- IMAGE NORMALIZER ----------------
  const normalizeImages = (image) => {
    if (!image) {
      return ["/images/default-logo.png"];
    }

    const imagesArray = Array.isArray(image) ? image : [image];

    return imagesArray.map((img) => {
      if (!img || typeof img !== "string") {
        return "/images/default-logo.png";
      }

      // already full URL
      if (img.startsWith("http")) {
        return img;
      }

      // uploaded backend image
      if (img.includes("Screenshot") || img.includes("-")) {
        return `http://localhost:7000${img}`;
      }

      // old frontend/public image
      return img;
    });
  };

  // ---------------- DELETE COMPANY ----------------
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this company?"))
      return;

    try {
      const token = localStorage.getItem("token");

      await axios.delete(`${API}/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setCompanies(companies.filter((c) => c._id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete company");
    }
  };

  // ---------------- MODAL HANDLERS ----------------
  const handleShow = () => setShowModal(true);

  const handleClose = () => {
    setShowModal(false);

    setNewCompany({
      name: "",
      status: "Active",
      logo: null,
    });
  };

  const handleFileChange = (e) => {
    setNewCompany({
      ...newCompany,
      logo: e.target.files[0],
    });
  };

  // ---------------- ADD COMPANY ----------------
  const handleAddCompany = async () => {
    if (!newCompany.name) {
      return alert("Name is required");
    }

    setAdding(true);

    try {
      const token = localStorage.getItem("token");

      const formData = new FormData();

      formData.append("name", newCompany.name);
      formData.append("status", newCompany.status);

      if (newCompany.logo) {
        formData.append("logo", newCompany.logo);
      }

      const { data } = await axios.post(API, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setCompanies([...companies, data.company]);

      handleClose();
    } catch (err) {
      console.error(err);
      alert("Failed to add company");
    }

    setAdding(false);
  };

  // ---------------- LOADING ----------------
  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" /> Loading companies...
      </div>
    );
  }

  return (
    <div>
      <Header />
      <Sidebar />

      <div className="admin-layout">
        <main className="admin-content">
          <Container fluid>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <motion.h4
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                Companies
              </motion.h4>

              <Button onClick={handleShow}>
                Add Company
              </Button>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="table-wrapper"
            >
              <Table responsive bordered hover>
                <thead>
                  <tr>
                    <th>Company Name</th>
                    <th>Logo</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {companies.map((company, index) => (
                    <motion.tr
                      key={company._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <td>{company.name}</td>

                      <td>
                        {normalizeImages(company.logo).map((img, idx) => (
                          <Image
                            key={idx}
                            src={img}
                            rounded
                            style={{ maxHeight: "80px" }}
                            className="me-1 mb-1"
                          />
                        ))}
                      </td>

                      <td>
                        <Badge
                          bg={
                            company.status === "Active"
                              ? "success"
                              : "secondary"
                          }
                        >
                          {company.status}
                        </Badge>
                      </td>

                      <td>
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => handleDelete(company._id)}
                        >
                          <FaTrash />
                        </Button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </Table>
            </motion.div>

            {/* ---------------- ADD COMPANY MODAL ---------------- */}

            <Modal show={showModal} onHide={handleClose}>
              <Modal.Header closeButton>
                <Modal.Title>
                  Add Company
                </Modal.Title>
              </Modal.Header>

              <Modal.Body>
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Company Name
                    </Form.Label>

                    <Form.Control
                      type="text"
                      value={newCompany.name}
                      onChange={(e) =>
                        setNewCompany({
                          ...newCompany,
                          name: e.target.value,
                        })
                      }
                      placeholder="Enter company name"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Status</Form.Label>

                    <Form.Select
                      value={newCompany.status}
                      onChange={(e) =>
                        setNewCompany({
                          ...newCompany,
                          status: e.target.value,
                        })
                      }
                    >
                      <option value="Active">
                        Active
                      </option>

                      <option value="Inactive">
                        Inactive
                      </option>
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Logo</Form.Label>

                    <Form.Control
                      type="file"
                      onChange={handleFileChange}
                    />
                  </Form.Group>
                </Form>
              </Modal.Body>

              <Modal.Footer>
                <Button
                  variant="secondary"
                  onClick={handleClose}
                >
                  Cancel
                </Button>

                <Button
                  variant="primary"
                  onClick={handleAddCompany}
                  disabled={adding}
                >
                  {adding ? "Adding..." : "Add Company"}
                </Button>
              </Modal.Footer>
            </Modal>
          </Container>
        </main>
      </div>
    </div>
  );
};

export default Categories;