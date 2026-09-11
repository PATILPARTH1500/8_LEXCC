import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useAccountStyles } from './useAccountStyles';
import { formatINR } from '../../utils/currency';
import { generateInvoice } from '../../utils/invoiceGenerator';

const Orders = () => {
  const styles = useAccountStyles();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
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
              product:products(name, image_url),
              variant:product_variants(size, color)
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
      transition: { staggerChildren: 0.1, delayChildren: 0.1 } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
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
          <Link to="/shop" className={styles.actionBtn} style={{ textDecoration: 'none', marginTop: '20px' }}>
            Shop Collection
          </Link>
        </motion.div>
      ) : (
        <motion.div variants={itemVariants} className={styles.ordersList}>
          {orders.map((order, index) => (
            <motion.div 
              key={order.id} 
              className={styles.card} 
              style={{ margin: 0 }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className={styles.orderHeader}>
                <div className={styles.orderIdentity}>
                  <h3 className={styles.orderNumber}>ORDER #{order.order_number}</h3>
                  <p className={styles.orderDate}>Placed on {new Date(order.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div className={styles.orderSummary}>
                  <p className={styles.orderTotal}>{formatINR(order.total_amount)}</p>
                  {(() => {
                    let displayText = order.status;
                    let badgeClass = styles.badgeWarning;
                    
                    if (order.payment_status === 'failed') {
                      displayText = 'PAYMENT FAILED';
                      badgeClass = styles.badgeDanger || styles.badgeWarning;
                    } else if (order.payment_status === 'cancelled') {
                      displayText = 'PAYMENT CANCELLED';
                      badgeClass = styles.badgeNeutral || styles.badgeWarning;
                    } else if (order.payment_status === 'pending') {
                      displayText = 'PENDING PAYMENT';
                      badgeClass = styles.badgeWarning;
                    } else if (order.status === 'delivered') {
                      displayText = 'DELIVERED';
                      badgeClass = styles.badgeSuccess;
                    } else if (order.status === 'shipped') {
                      displayText = 'SHIPPED';
                      badgeClass = styles.badgeInfo || styles.badgeSuccess;
                    } else if (order.status === 'processing') {
                      displayText = 'PROCESSING';
                      badgeClass = styles.badgeInfo || styles.badgeSuccess;
                    } else if (order.payment_status === 'paid') {
                      displayText = 'PAID';
                      badgeClass = styles.badgeSuccess;
                    } else if (order.status === 'cancelled') {
                      displayText = 'CANCELLED';
                      badgeClass = styles.badgeNeutral || styles.badgeWarning;
                    }

                    return (
                      <span className={`${styles.badge} ${badgeClass}`} style={{ display: 'inline-block', marginBottom: '10px' }}>
                        {displayText}
                      </span>
                    );
                  })()}
                  <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.05em', marginBottom: '10px', textTransform: 'uppercase' }}>
                    {order.payment_method === 'cod' ? 'CASH ON DELIVERY' : 'ONLINE PAYMENT'}
                  </p>
                  <div>
                    <button 
                      onClick={() => handleDownloadInvoice(order.id)}
                      disabled={downloadingOrderId === order.id}
                      className={styles.invoiceBtn}
                    >
                      {downloadingOrderId === order.id ? 'GENERATING...' : 'DOWNLOAD INVOICE'}
                    </button>
                  </div>
                </div>
              </div>

              {(order.tracking_number || order.carrier) && (
                <div className={styles.shipmentDetails}>
                  <div className={styles.shipmentCopy}>
                    <h4 className={styles.shipmentTitle}>Shipment Details</h4>
                    <p className={styles.shipmentLine}>
                      Carrier: <span className={styles.shipmentValue}>{order.carrier || 'N/A'}</span>
                    </p>
                    <p className={styles.shipmentLine}>
                      Tracking ID: <span className={styles.shipmentValue}>{order.tracking_number || 'N/A'}</span>
                    </p>
                  </div>
                  {order.tracking_number && (
                    <a 
                      href={order.carrier?.toLowerCase().includes('blue dart') || order.carrier?.toLowerCase().includes('bluedart') ? `https://www.bluedart.com/tracking?track=${order.tracking_number}` : `https://www.google.com/search?q=${order.tracking_number}+tracking`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.trackingLink}
                    >
                      Track Package
                    </a>
                  )}
                </div>
              )}

              <div className={styles.orderItems}>
                {order.items?.map((item, idx) => (
                  <div key={idx} className={styles.orderItem}>
                    <div className={styles.orderItemImage}>
                      <img 
                        src={item.product?.image_url || 'https://via.placeholder.com/80x100/111/fff?text=No+Image'} 
                        alt={item.product?.name} 
                      />
                    </div>
                    <div className={styles.orderItemContent}>
                      <h4 className={styles.orderItemName}>{item.product?.name}</h4>
                      {item.variant && <p className={styles.orderItemMeta} style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Size: {item.variant.size} {item.variant.color ? `· ${item.variant.color}` : ''}</p>}
                      <p className={styles.orderItemMeta}>Qty: {item.quantity} × {formatINR(item.price_at_time)}</p>
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
