import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiShoppingBag, FiUser, FiSearch } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import SearchOverlay from '../layout/SearchOverlay';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Header.module.css';
import MobileHeader from '../mobile/MobileHeader';
import { useResponsive } from '../../contexts/ResponsiveContext';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const location = useLocation();
  const { cartCount, setIsCartOpen } = useCart();
  const { profile, logout } = useAuth();
  const { isMobile } = useResponsive();
  const [bumpBadge, setBumpBadge] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  useEffect(() => {
    if (cartCount > 0) {
      setBumpBadge(true);
      const timer = setTimeout(() => setBumpBadge(false), 300);
      return () => clearTimeout(timer);
    }
  }, [cartCount]);

  if (isMobile) {
    return (
      <>
        <MobileHeader
          cartCount={cartCount}
          isMenuOpen={isMobileMenuOpen}
          isScrolled={isScrolled}
          onCartOpen={() => setIsCartOpen(true)}
          onCloseMenu={() => setIsMobileMenuOpen(false)}
          onLogout={logout}
          onSearchOpen={() => setIsSearchOpen(true)}
          onToggleMenu={() => setIsMobileMenuOpen((open) => !open)}
          profile={profile}
        />
        <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      </>
    );
  }

  return (
    <header className={`${styles.header} ${isScrolled ? styles.headerScrolled : ''}`}>
      <div className={styles.headerContainer}>
        {/* Mobile Menu Toggle */}
        <span className={styles.menuButton} aria-hidden="true" />

        {/* Navigation - Desktop */}
        <nav className={styles.nav}>
          <Link to="/shop?filter=new" className={styles.navLink}>New Arrivals</Link>
          <Link to="/shop?category=men" className={styles.navLink}>Men</Link>
          <Link to="/shop?category=footwear" className={styles.navLink}>Footwear</Link>
          <Link to="/shop" className={styles.navLink}>Collections</Link>
        </nav>

        {/* Logo */}
        <Link to="/" className={styles.logo}>
          LEXCC
        </Link>

        {/* Actions */}
        <div className={styles.actions}>
          <button className={`${styles.iconButton} ${styles.searchBtn}`} onClick={() => setIsSearchOpen(true)}>
            <FiSearch size={20} />
          </button>
          <Link to="/account" className={styles.iconButton}>
            <FiUser size={20} />
          </Link>
          <button className={styles.iconButton} onClick={() => setIsCartOpen(true)}>
            <FiShoppingBag size={20} />
            <AnimatePresence>
              {cartCount > 0 && (
                <motion.span 
                  className={`${styles.cartBadge} will-change-transform`}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: bumpBadge ? 1.2 : 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  style={{
                    position: 'absolute',
                    top: '-5px',
                    right: '-5px',
                    background: 'var(--accent-color, #D4AF37)',
                    color: '#000',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1
                  }}
                >
                  {cartCount > 99 ? '99+' : cartCount}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>

      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </header>
  );
};

export default Header;
