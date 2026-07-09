import { useState, useEffect } from "react";
import { Nav } from "react-bootstrap";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTachometerAlt,
  FaBox,
  FaList,
  FaShoppingCart,
  FaUsers,
  FaMoneyBill,
  FaWarehouse,
  FaBars,
  FaTimes,
  FaGift,
} from "react-icons/fa";
import { NavLink } from "react-router-dom";
import "./sidebar.css";

const Sidebar = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 991);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 991);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleClose = () => {
    if (isMobile) setOpen(false);
  };

  return (
    <>
      {/* ===== MOBILE HEADER ===== */}
      {isMobile && (
        <div className="mobile-header">
          <div className="logo">LOGO</div>
          <FaBars className="menu-icon" onClick={() => setOpen(true)} />
        </div>
      )}

      {/* ===== OVERLAY ===== */}
      <AnimatePresence>
        {open && isMobile && (
          <motion.div
            className="sidebar-overlay"
            onClick={() => setOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>

      {/* ===== SIDEBAR ===== */}
      <AnimatePresence>
        {(open || !isMobile) && (
          <motion.aside
            className={`sidebar ${isMobile ? "mobile" : ""}`}
            initial={{ x: isMobile ? 320 : 0 }}
            animate={{ x: 0 }}
            exit={{ x: 320 }}
            transition={{ duration: 0.3 }}
          >
            <div className="sidebar-header">
              {isMobile && (
                <FaTimes
                  className="close-btn"
                  onClick={() => setOpen(false)}
                />
              )}
            </div>

            <div className="sidebar-menu flex-column">
              <NavLink to="/dashboard" className="nav-link" onClick={handleClose}>
                <FaTachometerAlt /> Dashboard
              </NavLink>
              <NavLink to="/ProductCommission" className="nav-link" onClick={handleClose}>
                <FaUsers /> Product Commission
              </NavLink>
              <NavLink to="/delivery" className="nav-link" onClick={handleClose}>
                <FaWarehouse /> Delivery
              </NavLink>
              <NavLink to="/order" className="nav-link" onClick={handleClose}>
                <FaShoppingCart /> Orders
              </NavLink>
              <NavLink to="/product" className="nav-link" onClick={handleClose}>
                <FaBox /> Products
              </NavLink>

              <NavLink to="/coupon" className="nav-link" onClick={handleClose}>
                <FaGift /> Coupons
              </NavLink>

              {/* <NavLink to="/categories" className="nav-link" onClick={handleClose}>
                <FaList /> Companies
              </NavLink> */}
              {/* <NavLink to="/admin-categories" className="nav-link" onClick={handleClose}>
                <FaList /> Categories
              </NavLink> */}
              <NavLink to="/customer" className="nav-link" onClick={handleClose}>
                <FaUsers /> Customers
              </NavLink>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
