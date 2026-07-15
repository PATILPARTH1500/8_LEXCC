import React from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Account.module.css';

const AccountLayout = () => {
  const { logout, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const navItems = [
    { path: '/account', label: 'Dashboard', exact: true },
    { path: '/account/profile', label: 'Profile' },
    { path: '/account/addresses', label: 'Addresses' },
    { path: '/account/security', label: 'Security' },
    { path: '/account/wishlist', label: 'Wishlist' },
    { path: '/account/orders', label: 'Orders' },
  ];

  return (
    <>
      <div className={styles.accountBackground}>
        <div className={styles.noiseOverlay}></div>
        <div className={styles.radialGlow}></div>
      </div>
      
      <div className={styles.accountContainer}>
        <motion.aside 
          className={styles.sidebar}
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          {profile && (
            <div className={styles.sidebarUserArea}>
              <div className={styles.sidebarAvatar}>
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="User Avatar" />
                ) : (
                  <span>{profile.first_name?.charAt(0) || 'U'}</span>
                )}
              </div>
              <div className={styles.sidebarUserInfo}>
                <h3 className={styles.sidebarUserName}>{profile.first_name} {profile.last_name}</h3>
                <div className={styles.sidebarUserMeta}>
                  <span className={styles.sidebarUserStatus}>Active Member</span>
                  <span className={styles.sidebarUserDate}>Since {profile.created_at ? new Date(profile.created_at).getFullYear() : new Date().getFullYear()}</span>
                </div>
              </div>
            </div>
          )}

          <div className={styles.sidebarNav}>
            {navItems.map((item, index) => (
              <motion.div
                key={item.path}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
              >
                <NavLink
                  to={item.path}
                  end={item.exact}
                  className={({ isActive }) => `${styles.navLink} ${isActive ? styles.activeLink : ''}`}
                >
                  {item.label}
                </NavLink>
              </motion.div>
            ))}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: navItems.length * 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <button onClick={handleLogout} className={styles.logoutBtn}>
                Log Out
              </button>
            </motion.div>
          </div>
        </motion.aside>

        <motion.main 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </motion.main>
      </div>
    </>
  );
};

export default AccountLayout;
