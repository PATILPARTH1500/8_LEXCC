import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAccountStyles } from '../Account/useAccountStyles';
import { formatINR } from '../../utils/currency';
import { useResponsive } from '../../contexts/ResponsiveContext';

const AdminCustomers = () => {
  const styles = useAccountStyles();
  const { isMobile } = useResponsive();
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
      <div className={styles.adminHeader}>
        <motion.div variants={itemVariants}>
          <h1 style={{ fontSize: '1.8rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 300, color: '#fff', marginBottom: '10px' }}>Customer Management</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', letterSpacing: '0.05em' }}>View account details and lifetime value metrics.</p>
        </motion.div>
      </div>

      {error && <div style={{ color: '#ef4444', marginBottom: '20px', fontSize: '0.85rem' }}>{error}</div>}

      {isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <AnimatePresence>
            {customers.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>No customers found.</div>
            ) : (
              customers.map((customer) => (
                <motion.div 
                  key={customer.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ fontSize: '1rem', color: '#fff', margin: '0 0 4px', fontWeight: 500 }}>{customer.first_name || 'Anonymous'} {customer.last_name || 'User'}</h3>
                      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', margin: 0 }}>{customer.email}</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 0', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px' }}>Joined</p>
                      <p style={{ color: '#fff', fontSize: '0.85rem', margin: 0 }}>{new Date(customer.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px' }}>Orders</p>
                      <p style={{ color: '#fff', fontSize: '0.85rem', margin: 0 }}>{customer.total_orders}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px' }}>LTV</p>
                      <p style={{ color: 'var(--accent-color, #D4AF37)', fontSize: '0.85rem', margin: 0 }}>{formatINR(customer.lifetime_spend)}</p>
                    </div>
                  </div>

                  <button style={{ background: 'rgba(212,175,55,0.1)', border: 'none', color: 'var(--accent-color, #D4AF37)', padding: '10px', borderRadius: '4px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', width: '100%', cursor: 'pointer' }}>
                    View Details
                  </button>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      ) : (
      <motion.div variants={itemVariants} className={styles.card} style={{ padding: 0, overflow: 'hidden', margin: 0 }}>
        <div className={styles.responsiveTable} style={{ overflowX: 'auto' }}>
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
                      <td style={{ padding: '20px 30px' }} data-label="Customer">
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                          <p style={{ color: '#fff', fontSize: '0.85rem', marginBottom: '2px', fontWeight: 500 }}>{customer.first_name || 'Anonymous'} {customer.last_name || 'User'}</p>
                          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>{customer.email}</p>
                        </div>
                      </td>
                      <td style={{ padding: '20px 30px', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }} data-label="Joined">
                        {new Date(customer.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '20px 30px', color: '#fff', fontSize: '0.85rem' }} data-label="Orders">
                        {customer.total_orders}
                      </td>
                      <td style={{ padding: '20px 30px', color: 'var(--accent-color, #D4AF37)', fontSize: '0.85rem' }} data-label="LTV">
                        {formatINR(customer.lifetime_spend)}
                      </td>
                      <td style={{ padding: '20px 30px', textAlign: 'right' }} data-label="Actions">
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
      )}
    </motion.div>
  );
};

export default AdminCustomers;
