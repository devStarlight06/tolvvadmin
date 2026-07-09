import { useEffect, useState } from "react";
import { Container, Table, Spinner } from "react-bootstrap";
import Header from "../../component/header/header";
import Sidebar from "../../component/sidebar/sidebar";
import "./ProductCommission.css";
const ProductCommission = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetch("http://localhost:7000/api/dashboard/product-wise-commission", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((res) => {
        setData(res);
        setLoading(false);
      });
  }, [token]);

  if (loading)
    return <div className="text-center py-5"><Spinner /></div>;

  return (
    <>
      <Header />
      <div className="admin-layout">
        <Sidebar />
        <main className="admin-content">
          <Container fluid>
            <h4 className="mb-4">Product Wise Commission</h4>
          <Table responsive hover className="modern-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Company</th>
                <th>Qty Sold</th>
                <th>Total Sales (₹)</th>
                <th>Admin Commission (₹)</th>
                <th>Vendor Earning (₹)</th>
              </tr>
            </thead>
            <tbody>
              {data.map((p, i) => (
                <tr key={i}>
                  <td>{p.name}</td>
                  <td>{p.company}</td>
                  <td>{p.totalQty}</td>
                  <td>{p.totalSales}</td>
                  <td className="text-success fw-bold">{p.adminCommission}</td>
                  <td>{p.vendorEarning}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Container>
      </main>
    </div>
    </>
  );
};

export default ProductCommission;
