import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import ProductCommission from './pages/ProductCommission/ProductCommission';
// import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import Home from './pages/home/home';
import "bootstrap/dist/css/bootstrap.min.css";
import Dashboard from './pages/dashboard/dashboard';
import Login from './pages/login/login';
import Product from './pages/product/product';
import Categories from './pages/Categories/Categories';
import Order from './pages/order/order';
import Delivery from './pages/delivery/delivery';
import Customer from './pages/customer/customer';
import Payment from './pages/payment/payment';
import AdminCategories from './pages/AdminCategories/AdminCategories';
import AdminCouponPage from './pages/AdminCouponPage/AdminCouponPage';
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Router basename="/">
    <Routes>
      {/* <Route path="" element={<Home/>} /> */}
        <Route path="/" element={<Login/>} />
         <Route path="/dashboard" element={<Dashboard/>} />
         <Route path="/product" element={<Product/>} />
          <Route path="/categories" element={<Categories/>} />
          <Route path="/order" element={<Order/>} />
          <Route path="/delivery" element={<Delivery/>} />
          <Route path="/customer" element={<Customer/>} />
          <Route path="/ProductCommission" element={<ProductCommission/>} />
          <Route path="/admin-categories" element={<AdminCategories/>} />
          <Route path="/coupon" element={<AdminCouponPage />} />
          {/* <Route path="/payment" element={<Payment/>} /> */}
         
       {/* <Route path="*" element={<Error/>} /> */}
    </Routes>
  </Router>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
