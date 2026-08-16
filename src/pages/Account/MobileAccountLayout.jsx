import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { NavLink, Outlet } from 'react-router-dom';
import styles from './MobileAccountLayout.module.css';

const MobileAccountLayout = ({ handleLogout, location, navItems, navLinkRefs, navRef, profile }) => {
  const reduceMotion = useReducedMotion();
  const initials = `${profile?.first_name?.charAt(0) || 'U'}${profile?.last_name?.charAt(0) || ''}`;

  return (
    <div className={styles.page}>
      <header className={styles.memberHeader}>
        <div className={styles.avatar}>
          {profile?.avatar_url ? <img src={profile.avatar_url} alt="" /> : <span>{initials}</span>}
        </div>
        <div>
          <p>LEXCC member</p>
          <h1>{profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Your account' : 'Your account'}</h1>
          <span>Active since {profile?.created_at ? new Date(profile.created_at).getFullYear() : new Date().getFullYear()}</span>
        </div>
      </header>

      <nav ref={navRef} className={styles.nav} aria-label="Account sections">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.exact}
            ref={(element) => {
              if (element) navLinkRefs.current.set(item.path, element);
              else navLinkRefs.current.delete(item.path);
            }}
            className={({ isActive }) => isActive ? styles.active : styles.link}
          >
            {item.label}
          </NavLink>
        ))}
        <button type="button" className={styles.logout} onClick={handleLogout}>Log out</button>
      </nav>

      <main className={styles.content} id="main-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.25 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default MobileAccountLayout;
