import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import styles from '../Account/Account.module.css';

const AdminCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      // Fetch profiles separately
      const { data: profiles, error: err } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          email,
          created_at
        `)
        .order('created_at', { ascending: false });
        
      if (err) throw err;
      
      // Fetch all orders
      const { data: orders, error: ordersErr } = await supabase
        .from('orders')
        .select('user_id, total_amount');
        
      if (ordersErr) throw ordersErr;
      
      const ordersByUser = {};
      if (orders) {
        orders.forEach(o => {
          if (!ordersByUser[o.user_id]) ordersByUser[o.user_id] = [];
          ordersByUser[o.user_id].push(o);
        });
      }
      
      const enrichedCustomers = (profiles || []).map(p => {
        const userOrders = ordersByUser[p.id] || [];
        return {
          ...p,
          total_orders: userOrders.length,
          lifetime_spend: userOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0)
        };
      });

      setCustomers(enrichedCustomers);
    } catch (err) {
      console.error(err);
      setError(`Failed to load customers: ${err.message || JSON.stringify(err)}`);
    } finally {
      setLoading(false);
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
          Retrieving Customer Data...
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
        <motion.div variants={itemVariants}>
          <h1 style={{ fontSize: '1.8rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 300, color: '#fff', marginBottom: '10px' }}>Customer Management</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', letterSpacing: '0.05em' }}>View account details and lifetime value metrics.</p>
        </motion.div>
      </div>

      {error && <div style={{ color: '#ef4444', marginBottom: '20px', fontSize: '0.85rem' }}>{error}</div>}

      <motion.div variants={itemVariants} className={styles.card} style={{ padding: 0, overflow: 'hidden', margin: 0 }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                <th style={{ padding: '20px 30px', fontWeight: 400 }}>Customer</th>
                <th style={{ padding: '20px 30px', fontWeight: 400 }}>Joined</th>
                <th style={{ padding: '20px 30px', fontWeight: 400 }}>Orders</th>
                <th style={{ padding: '20px 30px', fontWeight: 400 }}>LTV</th>
                <th style={{ padding: '20px 30px', fontWeight: 400, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>No customers found.</td>
                  </tr>
                ) : (
                  customers.map((customer) => (
                    <motion.tr 
                      key={customer.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', transition: 'background 0.2s', ':hover': { background: 'rgba(255,255,255,0.02)' } }}
                    >
                      <td style={{ padding: '20px 30px' }}>
                        <p style={{ color: '#fff', fontSize: '0.85rem', marginBottom: '2px', fontWeight: 500 }}>{customer.first_name || 'Anonymous'} {customer.last_name || 'User'}</p>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>{customer.email}</p>
                      </td>
                      <td style={{ padding: '20px 30px', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
                        {new Date(customer.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '20px 30px', color: '#fff', fontSize: '0.85rem' }}>
                        {customer.total_orders}
                      </td>
                      <td style={{ padding: '20px 30px', color: 'var(--accent-color, #D4AF37)', fontSize: '0.85rem' }}>
                        ${customer.lifetime_spend.toFixed(2)}
                      </td>
                      <td style={{ padding: '20px 30px', textAlign: 'right' }}>
                        <button style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', opacity: 0.7, transition: 'opacity 0.2s', ':hover': { opacity: 1 } }}>
                          View Details
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

export default AdminCustomers;
