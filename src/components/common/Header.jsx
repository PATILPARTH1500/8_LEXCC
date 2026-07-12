import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiShoppingBag, FiUser, FiMenu, FiX, FiSearch } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './Header.module.css';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

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

  return (
    <header className={`${styles.header} ${isScrolled ? styles.headerScrolled : ''}`}>
      <div className={styles.headerContainer}>
        {/* Mobile Menu Toggle */}
        <button 
          className={styles.menuButton}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>

        {/* Navigation - Desktop */}
        <nav className={styles.nav}>
          <Link to="/shop" className={styles.navLink}>New Arrivals</Link>
          <Link to="/shop?category=men" className={styles.navLink}>Men</Link>
          <Link to="/shop?category=footwear" className={styles.navLink}>Footwear</Link>
          <Link to="/collections" className={styles.navLink}>Collections</Link>
          <Link to="/about" className={styles.navLink}>Brand</Link>
        </nav>

        {/* Logo */}
        <Link to="/" className={styles.logo}>
          LEXCC
        </Link>

        {/* Actions */}
        <div className={styles.actions}>
          <button className={`${styles.iconButton} ${styles.searchBtn}`}>
            <FiSearch size={20} />
          </button>
          <Link to="/login" className={styles.iconButton}>
            <FiUser size={20} />
          </Link>
          <button className={styles.iconButton}>
            <FiShoppingBag size={20} />
            <span className={styles.cartBadge}>
              0
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={styles.mobileMenu}
          >
            <Link to="/shop" className={styles.mobileMenuLink}>Shop All</Link>
            <Link to="/collections" className={styles.mobileMenuLink}>Collections</Link>
            <Link to="/about" className={styles.mobileMenuLink}>The Brand</Link>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
