import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import CustomSelect from '../../components/ui/CustomSelect';
import ShipmentTrackingModal from '../../components/admin/ShipmentTrackingModal';
import { useAccountStyles } from '../Account/useAccountStyles';
import { formatINR } from '../../utils/currency';
import { generateInvoice } from '../../utils/invoiceGenerator';

const AdminOrders = () => {
  const styles = useAccountStyles();
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
          
        if (!profErr && profiles) {
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

  const handleDeleteOrder = async (order) => {
    // If order is paid, we archive it
    if (order.payment_status === 'paid') {
      if (!window.confirm(`Archive paid order ${order.order_number}?\n\nPaid orders must be retained for transaction history. They will be hidden from this view but remain in the database.`)) {
        return;
      }
      try {
        const { error: archiveErr } = await supabase.from('orders').update({ is_archived: true }).eq('id', order.id);
        if (archiveErr) throw archiveErr;
        setOrders(prev => prev.filter(o => o.id !== order.id));
        logAdminActivity('ORDER_ARCHIVED', { order_id: order.id, order_number: order.order_number });
      } catch (err) {
        console.error('Failed to archive order', err);
        alert('Failed to archive order.');
      }
      return;
    }

    // Otherwise, unpaid/test order: we can hard delete
    if (!window.confirm(`Delete this order permanently?\n\nOrder Number: ${order.order_number}\nCustomer: ${order.profiles?.first_name} ${order.profiles?.last_name}\nAmount: ${formatINR(order.total_amount)}\nPayment Status: ${order.payment_status}`)) {
      return;
    }

    try {
      // First delete notifications if they exist (though cascade might handle it, doing it to be safe)
      await supabase.from('order_notifications').delete().eq('order_id', order.id);
      
      const { error: delErr } = await supabase.from('orders').delete().eq('id', order.id);
      if (delErr) throw delErr;
      
      setOrders(prev => prev.filter(o => o.id !== order.id));
      logAdminActivity('TEST_ORDER_DELETED', { order_number: order.order_number, previous_status: order.status });
    } catch (err) {
      console.error('Failed to delete order', err);
      alert('Failed to delete order.');
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
      const now = new Date().toISOString();
      const updates = { status: 'shipped', carrier, tracking_number: trackingNumber, shipped_at: now };
      
      const { error } = await supabase.from('orders').update(updates).eq('id', id);
      if (error) throw error;
      
      // Attempt to invoke edge function (fail silently for UI but log it)
      const order = orders.find(o => o.id === id);
      if (order && order.profiles?.email) {
        supabase.functions.invoke('send-transactional-email', {
          body: {
            type: 'order_shipped',
            order: order.order_number,
            customerName: order.profiles.first_name || 'Customer',
            email: order.profiles.email,
            trackingNumber,
            carrier
          }
        }).catch(e => console.error('Edge function error:', e));
      }

      setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
      setIsModalOpen(false);
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

      {error && <div style={{ color: '#ef4444', marginBottom: '20px', fontSize: '0.85rem' }}>{error}</div>}

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
                        {formatINR(order.total_amount)}
                      </td>
                      <td style={{ padding: '20px 30px' }} data-label="Status">
                        <CustomSelect 
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className={styles.inputField}
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
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
                          {order.payment_status === 'paid' ? (
                            <button 
                              onClick={() => handleDeleteOrder(order)}
                              style={{ background: 'transparent', border: 'none', color: '#6b7280', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }}
                            >
                              Archive
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleDeleteOrder(order)}
                              style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }}
                            >
                              Delete
                            </button>
                          )}
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
