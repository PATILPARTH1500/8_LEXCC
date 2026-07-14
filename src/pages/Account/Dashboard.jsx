import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import styles from './Account.module.css';

const Dashboard = () => {
  const { profile } = useAuth();
  
  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>WELCOME BACK,<br/>{profile?.first_name ? profile.first_name.toUpperCase() : 'MEMBER'}</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
        <div className={styles.card} style={{ margin: 0 }}>
          <h2 className={styles.cardTitle}>Recent Order</h2>
          <div className={styles.emptyState} style={{ padding: '40px 20px', border: 'none' }}>
            <p className={styles.emptyDesc} style={{ margin: 0 }}>No recent orders.</p>
          </div>
        </div>

        <div className={styles.card} style={{ margin: 0 }}>
          <h2 className={styles.cardTitle}>Wishlist</h2>
          <div className={styles.emptyState} style={{ padding: '40px 20px', border: 'none' }}>
            <p className={styles.emptyDesc} style={{ margin: 0 }}>0 Items Saved.</p>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Account Status</h2>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div>
            <span className={styles.formLabel}>Status</span>
            <span className={`${styles.badge} ${styles.badgeSuccess}`}>Active</span>
          </div>
          <div>
            <span className={styles.formLabel}>Member Since</span>
            <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
              {profile?.created_at ? new Date(profile.created_at).getFullYear() : new Date().getFullYear()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
