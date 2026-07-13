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

function App() {
  return (
    <>
      <GrainOverlay />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="shop" element={<div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px'}}>Shop - Coming Soon</div>} />
            
            {/* Auth Routes */}
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="verify-email" element={<VerifyEmail />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password" element={<ResetPassword />} />
            
            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="account" element={<div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: 'var(--accent-color)'}}>Account Dashboard - Coming Soon</div>} />
              <Route path="checkout" element={<div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px'}}>Checkout - Coming Soon</div>} />
              <Route path="wishlist" element={<div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px'}}>Wishlist - Coming Soon</div>} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
