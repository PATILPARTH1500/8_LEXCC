import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Account.module.css';

const Orders = () => {
  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Order History</h1>
        <p className={styles.pageSubtitle}>View and track your previous purchases.</p>
      </div>

      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>⚑</div>
        <h3 className={styles.emptyTitle}>No Orders Found</h3>
        <p className={styles.emptyDesc}>You haven't placed any orders yet. Discover our latest collection.</p>
        <Link to="/collections" className={styles.actionBtn} style={{ textDecoration: 'none' }}>
          Shop Collection
        </Link>
      </div>
    </div>
  );
};

export default Orders;
