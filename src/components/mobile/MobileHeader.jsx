import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FiMenu, FiSearch, FiShoppingBag, FiUser, FiX } from 'react-icons/fi';
import styles from './MobileHeader.module.css';

const MobileHeader = ({
  cartCount,
  isMenuOpen,
  isScrolled,
  onCartOpen,
  onCloseMenu,
  onLogout,
  onSearchOpen,
  onToggleMenu,
  profile,
}) => {
  useEffect(() => {
    if (!isMenuOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMenuOpen]);

  const closeThen = (callback) => () => {
    onCloseMenu();
    callback?.();
  };

  return (
    <>
      <header className={`${styles.header} ${isScrolled ? styles.scrolled : ''}`}>
        <div className={styles.bar}>
          <button
            type="button"
            className={styles.iconButton}
            onClick={onToggleMenu}
            aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-controls="lexcc-mobile-navigation"
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <FiX aria-hidden="true" /> : <FiMenu aria-hidden="true" />}
          </button>

          <Link to="/" className={styles.logo} aria-label="LEXCC home">
            LEXCC
          </Link>

          <div className={styles.actions}>
            <Link to="/account" className={styles.iconButton} aria-label="Open account">
              <FiUser aria-hidden="true" />
            </Link>
            <button type="button" className={styles.iconButton} onClick={onCartOpen} aria-label={`Open cart with ${cartCount} items`}>
              <FiShoppingBag aria-hidden="true" />
              {cartCount > 0 && <span className={styles.cartBadge}>{cartCount > 99 ? '99+' : cartCount}</span>}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close navigation menu"
              className={styles.backdrop}
              onClick={onCloseMenu}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
            <motion.nav
              id="lexcc-mobile-navigation"
              className={styles.drawer}
              aria-label="Mobile navigation"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className={styles.drawerHeader}>
                <span className={styles.drawerEyebrow}>Navigation</span>
                <button type="button" className={styles.iconButton} onClick={onCloseMenu} aria-label="Close navigation menu">
                  <FiX aria-hidden="true" />
                </button>
              </div>

              <div className={styles.drawerLinks}>
                <Link to="/shop?filter=new" onClick={onCloseMenu} className={styles.primaryLink}>New Arrivals</Link>
                <Link to="/shop?category=men" onClick={onCloseMenu} className={styles.primaryLink}>Men</Link>
                <Link to="/shop?category=footwear" onClick={onCloseMenu} className={styles.primaryLink}>Footwear</Link>
                <Link to="/shop" onClick={onCloseMenu} className={styles.primaryLink}>Collections</Link>
              </div>

              <div className={styles.drawerUtilities}>
                <button type="button" className={styles.utilityLink} onClick={closeThen(onSearchOpen)}>
                  <FiSearch aria-hidden="true" /> Search
                </button>
                <Link to="/account" onClick={onCloseMenu} className={styles.utilityLink}>
                  <FiUser aria-hidden="true" /> {profile ? 'My Account' : 'Sign In'}
                </Link>
                {profile && (
                  <button type="button" className={`${styles.utilityLink} ${styles.logoutLink}`} onClick={closeThen(onLogout)}>
                    Log Out
                  </button>
                )}
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileHeader;
