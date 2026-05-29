import { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Badge,
  Spinner,
} from "react-bootstrap";
import { motion } from "framer-motion";
import { FaTruck, FaClock } from "react-icons/fa";

import Header from "../../component/header/header";
import Sidebar from "../../component/sidebar/sidebar";
import "./delivery.css";

const Delivery = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ---------------- LOAD REAL ORDERS ---------------- */
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch("http://localhost:7000/api/admin/orders", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const data = await res.json();
        setOrders(data.orders || []);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const deliveredCount = orders.filter(
    (o) => o.orderStatus === "Delivered"
  ).length;

  const pendingCount = orders.filter(
    (o) => o.orderStatus === "Pending"
  ).length;
  const CancelledCount = orders.filter(
    (o) => o.orderStatus === "Cancelled"
  ).length;

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
              Delivery Status
            </motion.h4>

            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" /> Loading orders...
              </div>
            ) : (
              <>
                {/* ===== STATS ===== */}
                <Row className="g-4 mb-4">
                  <Col md={6}>
                    <motion.div whileHover={{ scale: 1.04 }}>
                      <Card className="delivery-card delivered">
                        <FaTruck className="icon" />
                        <h6>Delivered Orders</h6>
                        <h3>{deliveredCount}</h3>
                      </Card>
                    </motion.div>
                  </Col>

                  <Col md={6}>
                    <motion.div whileHover={{ scale: 1.04 }}>
                      <Card className="delivery-card pending">
                        <FaClock className="icon" />
                        <h6>Pending Orders</h6>
                        <h3>{pendingCount}</h3>
                      </Card>
                    </motion.div>
                  </Col>

                  <Col md={6}>
                    <motion.div whileHover={{ scale: 1.04 }}>
                      <Card className="delivery-card canceled">
                        <FaClock className="icon" />
                        <h6>Cancelled Orders</h6>
                        <h3>{CancelledCount}</h3>
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
                  <Table responsive bordered hover>
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>

                    <tbody>
                      {orders.map((order, index) => (
                        <motion.tr
                          key={order._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <td>{order._id}</td>
                          <td>
                            {order.shippingAddress?.name || "Guest Customer"}
                          </td>

                          <td>
                            <Badge
                              bg={
                                order.orderStatus === "Delivered"
                                  ? "success"
                                  : order.orderStatus === "Cancelled"
                                    ? "danger"
                                    : "warning"
                              }
                            >
                              {order.orderStatus}
                            </Badge>
                          </td>
                          <td>
                            {new Date(order.createdAt).toLocaleDateString(
                              "en-GB",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </Table>
                </motion.div>
              </>
            )}
          </Container>
        </main>
      </div>
    </div>
  );
};

export default Delivery;
