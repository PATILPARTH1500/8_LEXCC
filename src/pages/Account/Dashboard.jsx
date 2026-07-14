import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import styles from './Account.module.css';

const Dashboard = () => {
  const { profile, user } = useAuth();
  const [stats, setStats] = useState({ orders: 0, wishlist: 0, addresses: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      try {
        const [ordersRes, wishlistRes, addressesRes] = await Promise.all([
          supabase.from('orders').select('id', { count: 'exact' }).eq('user_id', user.id),
          supabase.from('wishlist').select('id', { count: 'exact' }).eq('user_id', user.id),
          supabase.from('addresses').select('id', { count: 'exact' }).eq('user_id', user.id)
        ]);

        setStats({
          orders: ordersRes.count || 0,
          wishlist: wishlistRes.count || 0,
          addresses: addressesRes.count || 0
        });
      } catch (err) {
        console.error('Failed to load dashboard stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user]);

  return (
    <div>
      <div className={styles.pageHeader}>
        <motion.h1 
          className={styles.pageTitle}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          WELCOME BACK,<br/>{profile?.first_name ? profile.first_name.toUpperCase() : 'MEMBER'}
        </motion.h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '30px', marginBottom: '40px' }}>
        <motion.div className={styles.card} style={{ margin: 0 }} whileHover={{ scale: 1.02 }}>
          <h3 style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '15px' }}>Orders</h3>
          <div style={{ fontSize: '3rem', fontWeight: '300', marginBottom: '20px' }}>{loading ? '-' : stats.orders}</div>
          <Link to="/account/orders" style={{ color: 'var(--accent-color)', fontSize: '0.8rem', textDecoration: 'none', letterSpacing: '0.1em' }}>VIEW ORDER HISTORY &rarr;</Link>
        </motion.div>

        <motion.div className={styles.card} style={{ margin: 0 }} whileHover={{ scale: 1.02 }}>
          <h3 style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '15px' }}>Wishlist</h3>
          <div style={{ fontSize: '3rem', fontWeight: '300', marginBottom: '20px' }}>{loading ? '-' : stats.wishlist}</div>
          <Link to="/account/wishlist" style={{ color: 'var(--accent-color)', fontSize: '0.8rem', textDecoration: 'none', letterSpacing: '0.1em' }}>VIEW SAVED ITEMS &rarr;</Link>
        </motion.div>

        <motion.div className={styles.card} style={{ margin: 0 }} whileHover={{ scale: 1.02 }}>
          <h3 style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '15px' }}>Addresses</h3>
          <div style={{ fontSize: '3rem', fontWeight: '300', marginBottom: '20px' }}>{loading ? '-' : stats.addresses}</div>
          <Link to="/account/addresses" style={{ color: 'var(--accent-color)', fontSize: '0.8rem', textDecoration: 'none', letterSpacing: '0.1em' }}>MANAGE ADDRESSES &rarr;</Link>
        </motion.div>
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
