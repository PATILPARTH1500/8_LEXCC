import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import styles from '../Account/Account.module.css';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data: ords, error: err } = await supabase
        .from('orders')
        .select(`
          *,
          profiles ( first_name, last_name, email ),
          order_items ( id, quantity, price_at_time, products(name) )
        `)
        .order('created_at', { ascending: false });
        
      if (err) throw err;
      setOrders(ords || []);
    } catch (err) {
      console.error(err);
      setError(`Failed to load orders: ${err.message || JSON.stringify(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (id, newStatus) => {
    // Optimistic Update
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
    
    // DB Update
    try {
      const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('Failed to update order status', err);
      fetchOrders(); // Re-fetch to correct UI
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  if (loading) {
    return (
      <div style={{ height: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 2 }} style={{ color: 'rgba(255,255,255,0.5)', letterSpacing: '0.2em', fontSize: '0.8rem', textTransform: 'uppercase' }}>
          Retrieving Global Orders...
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
        <motion.div variants={itemVariants}>
          <h1 style={{ fontSize: '1.8rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 300, color: '#fff', marginBottom: '10px' }}>Order Fulfillment</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', letterSpacing: '0.05em' }}>Process shipments and manage order statuses.</p>
        </motion.div>
      </div>

      {error && <div style={{ color: '#ef4444', marginBottom: '20px', fontSize: '0.85rem' }}>{error}</div>}

      <motion.div variants={itemVariants} className={styles.card} style={{ padding: 0, overflow: 'hidden', margin: 0 }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                <th style={{ padding: '20px 30px', fontWeight: 400 }}>Order #</th>
                <th style={{ padding: '20px 30px', fontWeight: 400 }}>Date</th>
                <th style={{ padding: '20px 30px', fontWeight: 400 }}>Customer</th>
                <th style={{ padding: '20px 30px', fontWeight: 400 }}>Total</th>
                <th style={{ padding: '20px 30px', fontWeight: 400 }}>Status</th>
                <th style={{ padding: '20px 30px', fontWeight: 400, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>No orders found.</td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <motion.tr 
                      key={order.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', transition: 'background 0.2s', ':hover': { background: 'rgba(255,255,255,0.02)' } }}
                    >
                      <td style={{ padding: '20px 30px', color: '#fff', fontSize: '0.85rem', fontWeight: 500 }}>
                        {order.order_number}
                      </td>
                      <td style={{ padding: '20px 30px', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '20px 30px' }}>
                        <p style={{ color: '#fff', fontSize: '0.85rem', marginBottom: '2px' }}>{order.profiles?.first_name} {order.profiles?.last_name}</p>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>{order.profiles?.email}</p>
                      </td>
                      <td style={{ padding: '20px 30px', color: '#fff', fontSize: '0.85rem' }}>
                        ${order.total_amount?.toFixed(2)}
                      </td>
                      <td style={{ padding: '20px 30px' }}>
                        <select 
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: order.status === 'delivered' ? '#22c55e' : (order.status === 'cancelled' ? '#ef4444' : '#fff'),
                            padding: '6px 12px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="pending" style={{ color: '#000' }}>Pending</option>
                          <option value="processing" style={{ color: '#000' }}>Processing</option>
                          <option value="shipped" style={{ color: '#000' }}>Shipped</option>
                          <option value="delivered" style={{ color: '#000' }}>Delivered</option>
                          <option value="cancelled" style={{ color: '#000' }}>Cancelled</option>
                        </select>
                      </td>
                      <td style={{ padding: '20px 30px', textAlign: 'right' }}>
                        <button style={{ background: 'transparent', border: 'none', color: 'var(--accent-color, #D4AF37)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }}>
                          View
                        </button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AdminOrders;
