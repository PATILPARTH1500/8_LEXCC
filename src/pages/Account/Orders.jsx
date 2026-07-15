import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Account.module.css';

const Orders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            items:order_items(
              quantity,
              price_at_time,
              product:products(name, image_url)
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setOrders(data || []);
      } catch (err) {
        console.error('Error fetching orders:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { staggerChildren: 0.1, delayChildren: 0.2 } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants} className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Order History</h1>
        <p className={styles.pageSubtitle}>View and track your previous purchases.</p>
      </motion.div>

      {isLoading ? (
        <motion.div variants={itemVariants} style={{ padding: '40px', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em' }}>LOADING ORDERS...</motion.div>
      ) : orders.length === 0 ? (
        <motion.div variants={itemVariants} className={styles.emptyState}>
          <div className={styles.emptyIcon} style={{ fontSize: '4rem', opacity: 0.8 }}>✧</div>
          <h3 className={styles.emptyTitle}>No Orders Found</h3>
          <p className={styles.emptyDesc}>Your history is a blank canvas. Discover our latest collection and define your legacy.</p>
          <Link to="/collections" className={styles.actionBtn} style={{ textDecoration: 'none', marginTop: '20px' }}>
            Shop Collection
          </Link>
        </motion.div>
      ) : (
        <motion.div variants={itemVariants} style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          {orders.map((order, index) => (
            <motion.div 
              key={order.id} 
              className={styles.card} 
              style={{ margin: 0 }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', paddingBottom: '30px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', letterSpacing: '0.15em', fontWeight: 500, marginBottom: '8px' }}>ORDER #{order.order_number}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.05em' }}>Placed on {new Date(order.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '1.4rem', fontWeight: 300, marginBottom: '10px' }}>${order.total_amount.toFixed(2)}</p>
                  <span className={`${styles.badge} ${order.status === 'delivered' ? styles.badgeSuccess : styles.badgeWarning}`} style={{ display: 'inline-block' }}>
                    {order.status}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {order.items?.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '25px', alignItems: 'center' }}>
                    <div style={{ width: '80px', height: '100px', background: '#050505', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <img 
                        src={item.product?.image_url || 'https://via.placeholder.com/80x100/111/fff?text=No+Image'} 
                        alt={item.product?.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', letterSpacing: '0.1em', marginBottom: '8px', fontWeight: 400 }}>{item.product?.name}</h4>
                      <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.05em' }}>Qty: {item.quantity} × ${item.price_at_time.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};

export default Orders;
