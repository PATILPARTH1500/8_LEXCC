import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import CustomSelect from '../../components/ui/CustomSelect';
import ShipmentTrackingModal from '../../components/admin/ShipmentTrackingModal';
import { useAccountStyles } from '../Account/useAccountStyles';
import { formatINR } from '../../utils/currency';
import { generateInvoice } from '../../utils/invoiceGenerator';
import { useResponsive } from '../../contexts/ResponsiveContext';

const allowedNextStatuses = (order) => {
  const next = { pending: ['processing'], processing: ['shipped'], shipped: ['delivered'] }[order.status] || [];
  if (order.payment_method === 'cod' && order.payment_status === 'pending' && ['pending', 'processing'].includes(order.status)) next.push('cancelled');
  return next;
};

const AdminOrders = () => {
  const styles = useAccountStyles();
  const { isMobile } = useResponsive();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [downloadingOrderId, setDownloadingOrderId] = useState(null);

  const handleDownloadInvoice = async (orderId) => {
    setDownloadingOrderId(orderId);
    try {
      await generateInvoice(orderId);
    } catch (err) {
      console.error('Failed to generate invoice', err);
      alert('Failed to generate invoice. Please try again.');
    } finally {
      setDownloadingOrderId(null);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: ords, error: err } = await supabase
        .from('orders')
        .select(`
          *,
          order_items ( id, quantity, price_at_time, products(name) )
        `)
        .is('is_archived', false)
        .order('created_at', { ascending: false });
        
      if (err) throw err;

      // Fetch profiles separately due to foreign key relationship caching issues
      const userIds = [...new Set((ords || []).map(o => o.user_id).filter(Boolean))];
      let profilesMap = {};
      
      if (userIds.length > 0) {
        const { data: profiles, error: profErr } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email')
          .in('id', userIds);
          
        if (profErr) throw profErr;
        if (profiles) {
          profiles.forEach(p => {
            profilesMap[p.id] = p;
          });
        }
      }

      const enrichedOrders = (ords || []).map(o => ({
        ...o,
        profiles: profilesMap[o.user_id] || null
      }));

      setOrders(enrichedOrders);
    } catch (err) {
      console.error(err);
      setError(`Failed to load orders: ${err.message || JSON.stringify(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (id, newStatus) => {
    const order = orders.find((item) => item.id === id);
    if (!order || !allowedNextStatuses(order).includes(newStatus)) {
      setError('This order status change is not allowed.');
      return;
    }
    try {
      const { data, error } = newStatus === 'cancelled'
        ? await supabase.rpc('cancel_cod_order', { p_order_id: id })
        : await supabase.from('orders').update({ status: newStatus }).eq('id', id).eq('status', order.status).select('id').single();
      if (error) throw error;
      if (newStatus === 'cancelled' && data !== true) throw new Error('Order was already cancelled.');
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus, ...(newStatus === 'cancelled' ? { payment_status: 'cancelled' } : {}) } : o));
    } catch (err) {
      console.error('Failed to update order status', err);
      await fetchOrders();
      setError('Could not update order status. The previous status was kept.');
    }
  };

  const handleDeleteOrder = async (order) => {
    if (!window.confirm(`Archive order ${order.order_number}? It will be hidden here but retained in the database.`)) return;
    try {
      const { error: archiveError } = await supabase.from('orders').update({ is_archived: true }).eq('id', order.id);
      if (archiveError) throw archiveError;
      setOrders(prev => prev.filter(o => o.id !== order.id));
      await logAdminActivity('ORDER_ARCHIVED', { order_id: order.id, order_number: order.order_number });
    } catch (err) {
      console.error('Failed to archive order', err);
      setError('Failed to archive order.');
    }
  };

  const logAdminActivity = async (action, details) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).single();
      if (!profile) return;
      
      await supabase.from('admin_activity_logs').insert([{
        admin_id: profile.id,
        action,
        details,
        ip_address: '127.0.0.1',
        user_agent: navigator.userAgent
      }]);
    } catch (err) {
      console.error('Failed to log admin activity', err);
    }
  };

  const handleSaveShipment = async (id, carrier, trackingNumber) => {
    try {
      const updates = { carrier, tracking_number: trackingNumber };
      const { error } = await supabase.from('orders').update(updates).eq('id', id);
      if (error) throw error;
      setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save shipment', err);
      setError('Failed to save shipment details.');
    }
  };

  const handleMarkShipped = async (id, carrier, trackingNumber) => {
    try {
      const order = orders.find((item) => item.id === id);
      if (!order || !allowedNextStatuses(order).includes('shipped')) throw new Error('Order must be processing before shipment.');
      const now = new Date().toISOString();
      const updates = { status: 'shipped', carrier, tracking_number: trackingNumber, shipped_at: now };
      
      const { error } = await supabase.from('orders').update(updates).eq('id', id);
      if (error) throw error;
      
      setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
      setIsModalOpen(false);
      setError('Shipment saved. Email notification is unavailable.');
    } catch (err) {
      console.error('Failed to mark as shipped', err);
      setError('Failed to mark as shipped.');
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
      <div className={styles.adminHeader}>
        <motion.div variants={itemVariants}>
          <h1 style={{ fontSize: '1.8rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 300, color: '#fff', marginBottom: '10px' }}>Order Fulfillment</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', letterSpacing: '0.05em' }}>Process shipments and manage order statuses.</p>
        </motion.div>
      </div>

      {error && <div role="alert" style={{ color: '#ef4444', marginBottom: '20px', fontSize: '0.85rem' }}>{error} <button type="button" onClick={fetchOrders}>Retry</button></div>}
      {error && orders.length === 0 ? null : <>

      {isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <AnimatePresence>
            {orders.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>No orders found.</div>
            ) : (
              orders.map((order) => (
                <motion.div 
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ fontSize: '1rem', color: '#fff', margin: '0 0 4px', fontWeight: 500 }}>{order.order_number}</h3>
                      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', margin: 0 }}>{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ color: 'var(--accent-color, #D4AF37)', fontSize: '1rem', margin: '0 0 4px', fontWeight: 500 }}>{formatINR(order.total_amount)}</p>
                      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', margin: 0, textTransform: 'uppercase' }}>
                        {order.payment_status} • {order.payment_method === 'cod' ? 'COD' : 'ONLINE'}
                      </p>
                    </div>
                  </div>

                  <div style={{ padding: '15px 0', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <p style={{ color: '#fff', fontSize: '0.85rem', margin: '0 0 2px' }}>{order.profiles?.first_name} {order.profiles?.last_name}</p>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', margin: '0 0 10px' }}>{order.profiles?.email}</p>
                    
                    <CustomSelect 
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                      className={styles.inputField}
                      style={{ padding: '8px 12px', fontSize: '0.8rem', height: 'auto', minHeight: '36px' }}
                    >
                      <option value={order.status}>{order.status}</option>
                      {allowedNextStatuses(order).map((status) => <option key={status} value={status}>{status}</option>)}
                    </CustomSelect>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      onClick={() => handleDownloadInvoice(order.id)}
                      disabled={downloadingOrderId === order.id}
                      style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', padding: '10px', borderRadius: '4px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', flex: 1, cursor: downloadingOrderId === order.id ? 'not-allowed' : 'pointer', opacity: downloadingOrderId === order.id ? 0.5 : 1 }}
                    >
                      {downloadingOrderId === order.id ? '...' : 'PDF'}
                    </button>
                    <button 
                      onClick={() => { setSelectedOrder(order); setIsModalOpen(true); }}
                      style={{ background: 'rgba(212,175,55,0.1)', border: 'none', color: 'var(--accent-color, #D4AF37)', padding: '10px', borderRadius: '4px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', flex: 1, cursor: 'pointer' }}
                    >
                      View
                    </button>
                    <button onClick={() => handleDeleteOrder(order)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#6b7280', padding: '10px', borderRadius: '4px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', flex: 1, cursor: 'pointer' }}>Archive</button>
                  </div>
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
                      <td style={{ padding: '20px 30px', color: '#fff', fontSize: '0.85rem', fontWeight: 500 }} data-label="Order #">
                        {order.order_number}
                      </td>
                      <td style={{ padding: '20px 30px', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }} data-label="Date">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '20px 30px' }} data-label="Customer">
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                          <p style={{ color: '#fff', fontSize: '0.85rem', marginBottom: '2px' }}>{order.profiles?.first_name} {order.profiles?.last_name}</p>
                          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>{order.profiles?.email}</p>
                        </div>
                      </td>
                      <td style={{ padding: '20px 30px', color: '#fff', fontSize: '0.85rem' }} data-label="Total">
                        <div>{formatINR(order.total_amount)}</div>
                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginTop: '4px', textTransform: 'uppercase' }}>
                          {order.payment_method === 'cod' ? 'COD' : 'ONLINE'}
                        </div>
                      </td>
                      <td style={{ padding: '20px 30px' }} data-label="Status">
                        <CustomSelect 
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className={styles.inputField}
                        >
                          <option value={order.status}>{order.status}</option>
                          {allowedNextStatuses(order).map((status) => <option key={status} value={status}>{status}</option>)}
                        </CustomSelect>
                      </td>
                      <td style={{ padding: '20px 30px', textAlign: 'right' }} data-label="Actions">
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                          <button 
                            onClick={() => handleDownloadInvoice(order.id)}
                            disabled={downloadingOrderId === order.id}
                            style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', cursor: downloadingOrderId === order.id ? 'not-allowed' : 'pointer', opacity: downloadingOrderId === order.id ? 0.5 : 1 }}
                          >
                            {downloadingOrderId === order.id ? '...' : 'PDF'}
                          </button>
                          <button 
                            onClick={() => { setSelectedOrder(order); setIsModalOpen(true); }}
                            style={{ background: 'transparent', border: 'none', color: 'var(--accent-color, #D4AF37)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }}
                          >
                            View
                          </button>
                          <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
                          <button onClick={() => handleDeleteOrder(order)} style={{ background: 'transparent', border: 'none', color: '#6b7280', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }}>Archive</button>
                        </div>
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
      </>}

      <ShipmentTrackingModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        order={selectedOrder}
        onSave={handleSaveShipment}
        onMarkShipped={handleMarkShipped}
      />
    </motion.div>
  );
};

export default AdminOrders;
