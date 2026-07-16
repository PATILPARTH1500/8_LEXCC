import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import styles from '../Account/Account.module.css'; // Reusing luxury dashboard styles

const AdminLayout = () => {
  const location = useLocation();
  const { signOut, profile } = useAuth();

  const getBackgroundText = () => {
    const path = location.pathname;
    if (path.includes('products')) return 'PRODUCTS';
    if (path.includes('orders')) return 'ORDERS';
    if (path.includes('customers')) return 'CUSTOMERS';
    return 'SYSTEM';
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: 'var(--secondary-color, #0a0a0a)', overflow: 'hidden' }}>
      {/* Background Typography */}
      <AnimatePresence mode="wait">
        <motion.div
          key={getBackgroundText()}
          className={styles.bgTextAccount}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          style={{ zIndex: 0, pointerEvents: 'none' }}
        >
          {getBackgroundText()}
        </motion.div>
      </AnimatePresence>

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', minHeight: '100vh', paddingTop: '80px' }}>
        
        {/* Sidebar */}
        <aside style={{ width: '280px', padding: '40px', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '50px' }}>
            <h2 style={{ fontSize: '0.8rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent-color, #D4AF37)', marginBottom: '10px' }}>LEXCC</h2>
            <p style={{ fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>Command Center</p>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
            {[
              { path: '/admin', label: 'Dashboard' },
              { path: '/admin/products', label: 'Products' },
              { path: '/admin/orders', label: 'Orders' },
              { path: '/admin/customers', label: 'Customers' },
            ].map(link => {
              const isActive = location.pathname === link.path || (link.path !== '/admin' && location.pathname.startsWith(link.path));
              return (
                <Link 
                  key={link.path} 
                  to={link.path} 
                  style={{ 
                    textDecoration: 'none', 
                    color: isActive ? '#fff' : 'rgba(255,255,255,0.5)', 
                    fontSize: '0.85rem', 
                    letterSpacing: '0.15em', 
                    textTransform: 'uppercase',
                    transition: 'color 0.3s',
                    position: 'relative'
                  }}
                >
                  {isActive && <motion.div layoutId="adminNavIndicator" style={{ position: 'absolute', left: '-15px', top: '50%', transform: 'translateY(-50%)', width: '4px', height: '4px', background: 'var(--accent-color, #D4AF37)', borderRadius: '50%' }} />}
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
              <div style={{ width: '35px', height: '35px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: 'var(--accent-color, #D4AF37)' }}>
                {profile?.first_name?.charAt(0) || 'A'}
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{profile?.first_name} {profile?.last_name}</p>
                <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Administrator</p>
              </div>
            </div>
            <button onClick={signOut} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', padding: 0 }}>
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main style={{ flex: 1, padding: '60px', overflowY: 'auto' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
