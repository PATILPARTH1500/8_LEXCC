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

        // Small animation delay simulation for luxury feel
        setTimeout(() => {
          setStats({
            orders: ordersRes.count || 0,
            wishlist: wishlistRes.count || 0,
            addresses: addressesRes.count || 0
          });
          setLoading(false);
        }, 600);
      } catch (err) {
        console.error('Failed to load dashboard stats', err);
        setLoading(false);
      }
    };
    fetchStats();
  }, [user]);

  const firstName = profile?.first_name ? profile.first_name.toUpperCase() : 'MEMBER';
  const lastName = profile?.last_name ? profile.last_name.toUpperCase() : '';

  // Counter animation component
  const AnimatedCounter = ({ value }) => {
    const [count, setCount] = useState(0);
    
    useEffect(() => {
      if (loading) return;
      let start = 0;
      const end = parseInt(value);
      if (start === end) {
        setCount(end);
        return;
      }
      let totalMilSecDur = 1000;
      let incrementTime = (totalMilSecDur / end);
      
      let timer = setInterval(() => {
        start += 1;
        setCount(start);
        if (start === end) clearInterval(timer);
      }, incrementTime);
      
      return () => clearInterval(timer);
    }, [value, loading]);
    
    return <span>{loading ? '-' : count}</span>;
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <motion.h1 
          className={styles.pageTitle}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          WELCOME BACK,<br/>
          <span>{firstName} {lastName}</span>
        </motion.h1>
        <motion.p
          className={styles.pageSubtitle}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          Manage your account, orders, wishlist and preferences.
        </motion.p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px', marginBottom: '60px' }}>
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <Link to="/account/orders" style={{ textDecoration: 'none' }}>
            <div className={styles.statCard}>
              <h3 className={styles.statCardTitle}>Total Orders</h3>
              <div className={styles.statCardValue}>
                <AnimatedCounter value={stats.orders} />
              </div>
              <span className={styles.statCardLink}>View Order History &rarr;</span>
            </div>
          </Link>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <Link to="/account/wishlist" style={{ textDecoration: 'none' }}>
            <div className={styles.statCard}>
              <h3 className={styles.statCardTitle}>Saved Items</h3>
              <div className={styles.statCardValue}>
                <AnimatedCounter value={stats.wishlist} />
              </div>
              <span className={styles.statCardLink}>View Wishlist &rarr;</span>
            </div>
          </Link>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <Link to="/account/addresses" style={{ textDecoration: 'none' }}>
            <div className={styles.statCard}>
              <h3 className={styles.statCardTitle}>Saved Addresses</h3>
              <div className={styles.statCardValue}>
                <AnimatedCounter value={stats.addresses} />
              </div>
              <span className={styles.statCardLink}>Manage Addresses &rarr;</span>
            </div>
          </Link>
        </motion.div>
      </div>

      <motion.div 
        className={styles.card}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <h2 className={styles.cardTitle}>Account Status</h2>
        <div style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
          <div>
            <span className={styles.formLabel}>Status</span>
            <span className={`${styles.badge} ${styles.badgeSuccess}`}>Active Member</span>
          </div>
          <div>
            <span className={styles.formLabel}>Member Since</span>
            <span style={{ fontSize: '1rem', color: '#fff', letterSpacing: '0.1em' }}>
              {profile?.created_at ? new Date(profile.created_at).getFullYear() : new Date().getFullYear()}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
