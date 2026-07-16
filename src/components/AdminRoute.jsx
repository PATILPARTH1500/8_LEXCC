import React from 'react';
import { Navigate, Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

const AdminRoute = () => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', color: '#fff' }}>
        <motion.div 
          animate={{ opacity: [0.3, 1, 0.3] }} 
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          style={{ letterSpacing: '0.2em', textTransform: 'uppercase', fontSize: '0.85rem' }}
        >
          Verifying Credentials...
        </motion.div>
      </div>
    );
  }

  if (!user || !profile?.is_admin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', gap: '30px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '20px', marginBottom: '40px' }}>
        {[
          { path: '/account/admin', label: 'Overview', exact: true },
          { path: '/account/admin/products', label: 'Products' },
          { path: '/account/admin/orders', label: 'Orders' },
          { path: '/account/admin/customers', label: 'Customers' }
        ].map(link => (
          <NavLink
            key={link.path}
            to={link.path}
            end={link.exact}
            style={({ isActive }) => ({
              textDecoration: 'none',
              color: isActive ? '#fff' : 'rgba(255,255,255,0.4)',
              fontSize: '0.8rem',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              position: 'relative'
            })}
          >
            {({ isActive }) => (
              <>
                {link.label}
                {isActive && (
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
      <Outlet />
    </div>
  );
};

export default AdminRoute;
