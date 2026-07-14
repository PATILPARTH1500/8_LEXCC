import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/common/Layout';
import Home from './pages/Home';
import CustomCursor from './components/animations/CustomCursor';
import GrainOverlay from './components/animations/GrainOverlay';

// Auth & Protected Routes
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import VerifyEmail from './pages/Auth/VerifyEmail';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import Collections from './pages/Public/Collections';
import ProductDetail from './pages/Public/ProductDetail';

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
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="collections" element={<Collections />} />
            <Route path="collections/:category" element={<Collections />} />
            <Route path="product/:slug" element={<ProductDetail />} />
            <Route path="shop" element={<div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px'}}>Shop - Coming Soon</div>} />
            
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
              
              <Route path="checkout" element={<div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px'}}>Checkout - Coming Soon</div>} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
