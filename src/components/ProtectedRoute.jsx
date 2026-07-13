import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = () => {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--primary-color)' }}>
        <div style={{ color: 'var(--accent-color)', fontSize: '0.9rem', letterSpacing: '0.2em', fontWeight: 600 }}>AUTHENTICATING...</div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if email is verified
  const isVerified = session.user?.email_confirmed_at != null;
  
  if (!isVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
