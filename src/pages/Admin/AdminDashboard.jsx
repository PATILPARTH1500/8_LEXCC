import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import styles from '../Account/Account.module.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    activeProducts: 0,
    lowStock: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch Orders for Revenue & Count & Recent Feed
        const { data: orders } = await supabase.from('orders').select('id, order_number, created_at, total_amount, status').order('created_at', { ascending: false });
        
        // Fetch Products for Count & Stock
        const { data: products } = await supabase.from('products').select('id, status, product_variants(stock)');
        
        let totalRev = 0;
        let totalOrd = 0;
        if (orders) {
          totalOrd = orders.length;
          totalRev = orders.reduce((sum, ord) => sum + (ord.total_amount || 0), 0);
        }

        let activeProd = 0;
        let lowStockCount = 0;
        if (products) {
          activeProd = products.filter(p => p.status === 'active').length;
          products.forEach(p => {
            const totalStock = p.product_variants?.reduce((sum, v) => sum + v.stock, 0) || 0;
            if (totalStock > 0 && totalStock <= 5) {
              lowStockCount++;
            } else if (totalStock === 0) {
              lowStockCount++;
            }
          });
        }

        setStats({
          totalOrders: totalOrd,
          totalRevenue: totalRev,
          activeProducts: activeProd,
          lowStock: lowStockCount,
          recentOrders: orders ? orders.slice(0, 5) : []
        });
      } catch (err) {
        console.error("Error fetching admin stats:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
  };

  if (loading) {
    return (
      <div style={{ height: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 2 }} style={{ color: 'rgba(255,255,255,0.5)', letterSpacing: '0.2em', fontSize: '0.8rem', textTransform: 'uppercase' }}>
          Syncing Metrics...
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants} style={{ marginBottom: '50px' }}>
        <h1 style={{ fontSize: '2rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 300, color: '#fff', marginBottom: '10px' }}>System Overview</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', letterSpacing: '0.05em' }}>Real-time metrics for LEXCC commerce engine.</p>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '25px', marginBottom: '50px' }}>
        {/* Revenue */}
        <motion.div variants={itemVariants} className={styles.card} style={{ padding: '30px', margin: 0 }}>
          <h3 style={{ fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: '15px' }}>Total Revenue</h3>
          <p style={{ fontSize: '2.5rem', color: '#fff', fontWeight: 300, letterSpacing: '0.05em' }}>${stats.totalRevenue.toFixed(2)}</p>
        </motion.div>

        {/* Orders */}
        <motion.div variants={itemVariants} className={styles.card} style={{ padding: '30px', margin: 0 }}>
          <h3 style={{ fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: '15px' }}>Total Orders</h3>
          <p style={{ fontSize: '2.5rem', color: '#fff', fontWeight: 300, letterSpacing: '0.05em' }}>{stats.totalOrders}</p>
        </motion.div>

        {/* Products */}
        <motion.div variants={itemVariants} className={styles.card} style={{ padding: '30px', margin: 0 }}>
          <h3 style={{ fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: '15px' }}>Active Products</h3>
          <p style={{ fontSize: '2.5rem', color: '#fff', fontWeight: 300, letterSpacing: '0.05em' }}>{stats.activeProducts}</p>
        </motion.div>

        {/* Inventory Warning */}
        <motion.div variants={itemVariants} className={styles.card} style={{ padding: '30px', margin: 0, border: stats.lowStock > 0 ? '1px solid rgba(212,175,55,0.5)' : '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: stats.lowStock > 0 ? 'var(--accent-color, #D4AF37)' : 'rgba(255,255,255,0.5)', marginBottom: '15px' }}>Low Stock Items</h3>
          <p style={{ fontSize: '2.5rem', color: stats.lowStock > 0 ? 'var(--accent-color, #D4AF37)' : '#fff', fontWeight: 300, letterSpacing: '0.05em' }}>{stats.lowStock}</p>
        </motion.div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '25px' }}>
        <motion.div variants={itemVariants} className={styles.card} style={{ padding: '40px', margin: 0, minHeight: '300px' }}>
          <h3 style={{ fontSize: '0.9rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#fff', marginBottom: '20px' }}>Recent Orders</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {stats.recentOrders && stats.recentOrders.length > 0 ? (
              stats.recentOrders.map(order => (
                <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '15px' }}>
                  <div>
                    <p style={{ fontSize: '0.85rem', color: '#fff', marginBottom: '4px' }}>{order.order_number}</p>
                    <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--accent-color, #D4AF37)' }}>${order.total_amount?.toFixed(2)}</p>
                    <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>{order.status}</p>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center', marginTop: '40px' }}>
                No recent orders found.
              </div>
            )}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className={styles.card} style={{ padding: '40px', margin: 0, minHeight: '300px' }}>
          <h3 style={{ fontSize: '0.9rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#fff', marginBottom: '20px' }}>System Status</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.05em' }}>Database</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.1em' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }}/> Connected</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.05em' }}>Authentication</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.1em' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }}/> Active</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.05em' }}>Storage Buckets</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.1em' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }}/> Online</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.05em' }}>Payment Gateway</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.1em' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }}/> Simulated</span>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AdminDashboard;
