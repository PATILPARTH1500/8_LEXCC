import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/common/Layout';
import Home from './pages/Home';
import CustomCursor from './components/animations/CustomCursor';
import GrainOverlay from './components/animations/GrainOverlay';
import CartDrawer from './components/shop/CartDrawer';
import WhatsAppConcierge from './components/ui/WhatsAppConcierge';
import BotpressChat from './components/ui/BotpressChat';

// Auth & Protected Routes
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import VerifyEmail from './pages/Auth/VerifyEmail';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import ProtectedRoute from './components/ProtectedRoute';

import AdminRoute from './components/AdminRoute';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminProducts from './pages/Admin/AdminProducts';
import AdminProductForm from './pages/Admin/AdminProductForm';
import AdminOrders from './pages/Admin/AdminOrders';
import AdminCustomers from './pages/Admin/AdminCustomers';

// Public Pages
import Collections from './pages/Public/Collections';
import ProductDetail from './pages/Public/ProductDetail';
import Cart from './pages/Public/Cart';
import Checkout from './pages/Public/Checkout';
import NotFound from './pages/Public/NotFound';
import SupportPage from './pages/Public/SupportPage';

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
      <WhatsAppConcierge />
      <BrowserRouter>
        <BotpressChat />
        <CartDrawer />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="shop" element={<Collections />} />
            <Route path="shop/:category" element={<Collections />} />
            <Route path="product/:slug" element={<ProductDetail />} />
            <Route path="cart" element={<Cart />} />
            <Route path="faq" element={<SupportPage page="faq" />} />
            <Route path="shipping-returns" element={<SupportPage page="shipping" />} />
            <Route path="privacy-policy" element={<SupportPage page="privacy" />} />
            <Route path="terms" element={<SupportPage page="terms" />} />
            
            {/* Auth Routes */}
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="verify-email" element={<VerifyEmail />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password" element={<ResetPassword />} />
            
            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="checkout" element={<Checkout />} />
              <Route path="account" element={<AccountLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="profile" element={<Profile />} />
                <Route path="orders" element={<Orders />} />
                <Route path="wishlist" element={<Wishlist />} />
                <Route path="addresses" element={<Addresses />} />
                <Route path="security" element={<Security />} />
                
                <Route path="admin" element={<AdminRoute />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="products/new" element={<AdminProductForm />} />
                  <Route path="products/:productId/edit" element={<AdminProductForm />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="customers" element={<AdminCustomers />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
