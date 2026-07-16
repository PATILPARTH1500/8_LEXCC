import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/common/Layout';
import Home from './pages/Home';
import CustomCursor from './components/animations/CustomCursor';
import GrainOverlay from './components/animations/GrainOverlay';
import CartDrawer from './components/shop/CartDrawer';

// Auth & Protected Routes
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import VerifyEmail from './pages/Auth/VerifyEmail';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import ProtectedRoute from './components/ProtectedRoute';

// Admin Routes
import AdminRoute from './components/AdminRoute';
import AdminLayout from './pages/Admin/AdminLayout';
import AdminDashboard from './pages/Admin/AdminDashboard';

// Public Pages
import Collections from './pages/Public/Collections';
import ProductDetail from './pages/Public/ProductDetail';
import Cart from './pages/Public/Cart';
import Checkout from './pages/Public/Checkout';

// Account Pages
import AccountLayout from './pages/Account/AccountLayout';
import Dashboard from './pages/Account/Dashboard';
import Profile from './pages/Account/Profile';
import Orders from './pages/Account/Orders';
import Wishlist from './pages/Account/Wishlist';
import Addresses from './pages/Account/Addresses';
import Security from './pages/Account/Security';

function App() {
  return (
    <>
      <GrainOverlay />
      <BrowserRouter>
        <CartDrawer />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="collections" element={<Collections />} />
            <Route path="collections/:category" element={<Collections />} />
            <Route path="product/:slug" element={<ProductDetail />} />
            <Route path="cart" element={<Cart />} />
            <Route path="checkout" element={<Checkout />} />
            
            {/* Auth Routes */}
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="verify-email" element={<VerifyEmail />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password" element={<ResetPassword />} />
            
            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="account" element={<AccountLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="profile" element={<Profile />} />
                <Route path="orders" element={<Orders />} />
                <Route path="wishlist" element={<Wishlist />} />
                <Route path="addresses" element={<Addresses />} />
                <Route path="security" element={<Security />} />
              </Route>
            </Route>
          </Route>

          {/* Admin Routes (Outside of main Layout for distinct luxury style) */}
          <Route path="/admin" element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="products" element={<div style={{color: '#fff', padding: '50px'}}>Products Management (WIP)</div>} />
              <Route path="orders" element={<div style={{color: '#fff', padding: '50px'}}>Orders Management (WIP)</div>} />
              <Route path="customers" element={<div style={{color: '#fff', padding: '50px'}}>Customers Management (WIP)</div>} />
            </Route>
          </Route>

        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
