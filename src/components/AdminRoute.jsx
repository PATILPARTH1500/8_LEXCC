import React from 'react';
import { Navigate, Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useResponsive } from '../contexts/ResponsiveContext';
import { motion } from 'framer-motion';
import AdminErrorBoundary from './AdminErrorBoundary';

const AdminRoute = () => {
  const { user, profile, profileLoading } = useAuth();
  const { isMobile } = useResponsive();
  const location = useLocation();

  if (profileLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', color: '#fff' }}>
        <motion.div 
          animate={{ opacity: [0.3, 1, 0.3] }} 
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          style={{ letterSpacing: '0.2em', textTransform: 'uppercase', fontSize: '0.85rem' }}
        >
          Verifying admin access...
        </motion.div>
      </div>
    );
  }

  if (!user || !profile?.is_admin) {
    return <Navigate to="/" replace />;
  }

  const adminLinks = [
    { path: '/account/admin', label: 'Overview', exact: true },
    { path: '/account/admin/products', label: 'Products' },
    { path: '/account/admin/orders', label: 'Orders' },
    { path: '/account/admin/customers', label: 'Customers' }
  ];

  return (
    <div style={{ width: '100%', minWidth: 0 }}>
      <div style={{ 
        display: 'flex', 
        gap: isMobile ? '10px' : '30px', 
        borderBottom: isMobile ? 'none' : '1px solid rgba(255,255,255,0.1)', 
        paddingBottom: '20px', 
        marginBottom: '40px',
        overflowX: isMobile ? 'auto' : 'visible',
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch',
        whiteSpace: isMobile ? 'nowrap' : 'normal'
      }}>
        {adminLinks.map(link => (
          <NavLink
            key={link.path}
            to={link.path}
            end={link.exact}
            style={({ isActive }) => {
              if (isMobile) {
                return {
                  textDecoration: 'none',
                  fontSize: '0.75rem',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  padding: '10px 20px',
                  borderRadius: '30px',
                  border: isActive ? '1px solid rgba(212,175,55,0.5)' : '1px solid rgba(255,255,255,0.14)',
                  color: isActive ? '#D4AF37' : 'rgba(255,255,255,0.6)',
                  background: isActive ? 'rgba(212,175,55,0.1)' : '#0f0f0f',
                  flex: '0 0 auto',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '40px',
                  transition: 'all 0.3s ease'
                };
              }
              return {
                textDecoration: 'none',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.4)',
                fontSize: '0.8rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                position: 'relative'
              };
            }}
          >
            {({ isActive }) => (
              <>
                {link.label}
                {isActive && !isMobile && (
                  <motion.div 
                    layoutId="adminNavBorder" 
                    style={{ position: 'absolute', bottom: '-21px', left: 0, right: 0, height: '2px', background: 'var(--accent-color, #D4AF37)' }} 
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
      <AdminErrorBoundary key={location.pathname}><Outlet /></AdminErrorBoundary>
    </div>
  );
};

export default AdminRoute;
