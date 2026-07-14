import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Account.module.css';

const Wishlist = () => {
  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Wishlist</h1>
        <p className={styles.pageSubtitle}>Curate your favorite pieces.</p>
      </div>

      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>♥</div>
        <h3 className={styles.emptyTitle}>Your Wishlist is Empty</h3>
        <p className={styles.emptyDesc}>Save items you love to revisit them later.</p>
        <Link to="/collections" className={styles.actionBtn} style={{ textDecoration: 'none' }}>
          Discover Pieces
        </Link>
      </div>
    </div>
  );
};

export default Wishlist;
