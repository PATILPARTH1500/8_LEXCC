import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Account.module.css';

const AccountLayout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const navItems = [
    { path: '/account', label: 'My Account', exact: true },
    { path: '/account/profile', label: 'Profile' },
    { path: '/account/addresses', label: 'Addresses' },
    { path: '/account/security', label: 'Security' },
    { path: '/account/wishlist', label: 'Wishlist' },
    { path: '/account/orders', label: 'Orders' },
  ];

  return (
    <div className={styles.accountContainer}>
      <motion.aside 
        className={styles.sidebar}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.exact}
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.activeLink : ''}`}
          >
            {item.label}
          </NavLink>
        ))}
        <button onClick={handleLogout} className={styles.logoutBtn}>
          Log Out
        </button>
      </motion.aside>

      <motion.main 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      >
        <Outlet />
      </motion.main>
    </div>
  );
};

export default AccountLayout;
