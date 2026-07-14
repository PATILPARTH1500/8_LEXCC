import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
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
              product:products(name, images:product_images(image_url))
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

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Order History</h1>
        <p className={styles.pageSubtitle}>View and track your previous purchases.</p>
      </div>

      {isLoading ? (
        <div style={{ padding: '40px', color: 'rgba(255,255,255,0.5)' }}>LOADING ORDERS...</div>
      ) : orders.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>⚑</div>
          <h3 className={styles.emptyTitle}>No Orders Found</h3>
          <p className={styles.emptyDesc}>You haven't placed any orders yet. Discover our latest collection.</p>
          <Link to="/collections" className={styles.actionBtn} style={{ textDecoration: 'none' }}>
            Shop Collection
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {orders.map(order => (
            <motion.div 
              key={order.id} 
              className={styles.card} 
              style={{ margin: 0 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <div>
                  <h3 style={{ fontSize: '0.9rem', letterSpacing: '0.1em', fontWeight: 600, marginBottom: '5px' }}>ORDER #{order.order_number}</h3>
                  <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '1.1rem', fontWeight: 500, marginBottom: '5px' }}>${order.total_amount.toFixed(2)}</p>
                  <span className={`${styles.badge} ${order.status === 'delivered' ? styles.badgeSuccess : styles.badgeWarning}`}>{order.status}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {order.items?.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div style={{ width: '60px', height: '80px', background: '#111' }}>
                      <img 
                        src={item.product?.images?.[0]?.image_url || 'https://via.placeholder.com/60x80/111/fff?text=No+Image'} 
                        alt={item.product?.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.85rem', letterSpacing: '0.05em', marginBottom: '5px' }}>{item.product?.name}</h4>
                      <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Qty: {item.quantity} x ${item.price_at_time.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
