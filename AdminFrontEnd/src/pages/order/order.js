import { useEffect, useState } from "react";
import { Container, Table, Badge, Button, Modal, Spinner } from "react-bootstrap";
import { motion } from "framer-motion";
import { FaEye } from "react-icons/fa";

import "./order.css";
import Header from "../../component/header/header";
import Sidebar from "../../component/sidebar/sidebar";

const Order = () => {
  const [orders, setOrders] = useState([]);
  const [viewOrder, setViewOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");
  const API = "http://localhost:7000/api/admin";

  /* ================= FETCH ORDERS ================= */
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch(`${API}/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        setOrders(data.orders);
      } catch (err) {
        alert(err.message || "Failed to load orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [token]);

  /* ================= UPDATE STATUS ================= */
  const handleStatusChange = async (orderId, status) => {
    try {
      const res = await fetch(`${API}/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? data.order : o))
      );
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading)
    return (
      <div className="text-center py-5">
        <Spinner animation="border" /> Loading orders...
      </div>
    );

  return (
    <>
      <Header />
      <div className="admin-layout">
        <Sidebar />

        <main className="admin-content">
          <Container fluid>
            <motion.h4 className="mb-4">Orders</motion.h4>

            <Table responsive bordered hover>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Products</th>
                  <th>Payment</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>View</th>
                </tr>
              </thead>

              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td>{order._id}</td>

                    {/* ✅ NAME + EMAIL + PHONE */}
                    <td>
                      <div><b>{order.shippingAddress?.name || "Guest"}</b></div>
                      <div className="text-muted small">
                        {order.shippingAddress?.email}
                      </div>
                      <div className="text-muted small">
                        {order.shippingAddress?.phone}
                      </div>
                    </td>

                    <td>
                      {order.items?.map((i) => i.name).join(", ")}
                    </td>

                    <td>
                      <Badge bg="success">{order.paymentMethod}</Badge>
                    </td>

                    <td>₹{order.totalPrice}</td>

                    <td>
                      <select
                        className="form-select form-select-sm"
                        value={order.orderStatus}
                        disabled={
                          order.orderStatus === "Cancelled" ||
                          order.orderStatus === "Delivered"
                        }
                        onChange={(e) =>
                          handleStatusChange(order._id, e.target.value)
                        }
                      >
                        <option value="Pending">Pending</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>


                    </td>

                    <td>
                      <Button size="sm" onClick={() => setViewOrder(order)}>
                        <FaEye />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Container>
        </main>
      </div>

      {/* ================= VIEW ORDER MODAL ================= */}
        <Modal show={!!viewOrder} onHide={() => setViewOrder(null)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Order Details</Modal.Title>
          </Modal.Header>

          {viewOrder && (
            <Modal.Body>
              <p><b>Order ID:</b> {viewOrder._id}</p>

              <hr />

              <p><b>Name:</b> {viewOrder.shippingAddress?.name}</p>
              <p><b>Email:</b> {viewOrder.shippingAddress?.email}</p>
              <p><b>Phone:</b> {viewOrder.shippingAddress?.phone}</p>

              <hr />

              <p><b>Address:</b><br />
                {viewOrder.shippingAddress?.address},<br />
                {viewOrder.shippingAddress?.city}, {viewOrder.shippingAddress?.state} - {viewOrder.shippingAddress?.pincode}<br />
                {viewOrder.shippingAddress?.country}
              </p>

              <hr />

              <p><b>Products:</b></p>
              <ul>
                {viewOrder.items.map((item) => (
                  <li key={item._id}>
                    {item.name} × {item.quantity} — ₹{item.price}
                  </li>
                ))}
              </ul>

              <p><b>Status:</b> {viewOrder.orderStatus}</p>
              <p><b>Total:</b> ₹{viewOrder.totalPrice}</p>
            </Modal.Body>
          )}

        </Modal>
    </>
  );
};

export default Order;
