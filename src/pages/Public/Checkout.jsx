import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import styles from './Shop.module.css';
import accountStyles from '../Account/Account.module.css';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1200&auto=format&fit=crop';

const Checkout = () => {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user, fetchAddresses } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1); // 1: Shipping, 2: Review, 3: Payment, 4: Confirmation
  
  // Addresses
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  
  // Final Order Info
  const [orderId, setOrderId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (cartItems.length === 0 && step !== 4) {
      navigate('/cart');
    }
    
    if (user) {
      fetchAddresses().then(data => {
        setAddresses(data || []);
        const defaultAddr = data?.find(a => a.is_default);
        if (defaultAddr) setSelectedAddressId(defaultAddr.id);
        else if (data?.length > 0) setSelectedAddressId(data[0].id);
        setLoadingAddresses(false);
      });
    } else {
      setLoadingAddresses(false);
    }
  }, [user, cartItems.length, navigate, step]);

  const handleNextStep = () => {
    if (step === 1 && !selectedAddressId && user) {
      alert("Please select a shipping address");
      return;
    }
    setStep(prev => prev + 1);
  };

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    try {
      // Mock payment delay
      await new Promise(res => setTimeout(res, 2500));
      
      const orderNumber = `LEX-${Math.floor(Math.random() * 1000000)}`;
      const selectedAddress = addresses.find(a => a.id === selectedAddressId) || {};
      
      if (user) {
        // Insert order
        const { data: order, error: orderErr } = await supabase
          .from('orders')
          .insert([{
            user_id: user.id,
            order_number: orderNumber,
            total_amount: cartTotal,
            shipping_address: selectedAddress,
            status: 'processing'
          }])
          .select('id')
          .single();
          
        if (orderErr) throw orderErr;

        // Insert order items
        const orderItemsData = cartItems.map(item => ({
          order_id: order.id,
          product_id: item.product.id,
          quantity: item.quantity,
          price_at_time: item.product.price
        }));

        const { error: itemsErr } = await supabase.from('order_items').insert(orderItemsData);
        if (itemsErr) throw itemsErr;
      }
      
      setOrderId(orderNumber);
      clearCart();
      setStep(4);
    } catch (err) {
      console.error(err);
      alert("Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const getBackgroundText = () => {
    if (step === 1) return 'SHIPPING';
    if (step === 2) return 'REVIEW';
    if (step === 3) return 'PAYMENT';
    if (step === 4) return 'CONFIRMED';
    return '';
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: 'var(--secondary-color, #0a0a0a)', overflow: 'hidden' }}>
      {/* Background Typography */}
      <AnimatePresence mode="wait">
        <motion.div
          key={getBackgroundText()}
          className={accountStyles.bgTextAccount}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {getBackgroundText()}
        </motion.div>
      </AnimatePresence>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1500px', margin: '0 auto', padding: '140px 40px 100px' }}>
        
        {step === 4 ? (
          <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              style={{ textAlign: 'center', maxWidth: '600px', width: '100%' }}
            >
              <motion.div 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }} 
                transition={{ type: 'spring', damping: 15, delay: 0.2 }}
                style={{ fontSize: '4rem', marginBottom: '30px', color: 'var(--accent-color, #D4AF37)', display: 'flex', justifyContent: 'center' }}
              >
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', border: '2px solid var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  ✓
                </div>
              </motion.div>
              <h1 style={{ fontSize: '2.5rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '20px', fontFamily: 'var(--font-heading)', fontWeight: 300 }}>Order Confirmed</h1>
              <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '10px', fontSize: '1.1rem', letterSpacing: '0.05em' }}>Thank you for your purchase.</p>
              <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '40px', letterSpacing: '0.05em' }}>Order Number: <strong style={{ color: '#fff', fontWeight: 500 }}>{orderId}</strong></p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className={accountStyles.card}
                style={{ padding: '40px', marginBottom: '40px', textAlign: 'left', margin: 0 }}
              >
                <h3 style={{ fontSize: '0.9rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '15px', color: '#fff' }}>Tracking Information</h3>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', lineHeight: '1.8' }}>
                  Your order is currently processing. You will receive an email with tracking details once your items have shipped.
                </p>
              </motion.div>

              <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                <Link to="/collections" className={styles.primaryBtn} style={{ textDecoration: 'none' }}>CONTINUE SHOPPING</Link>
                {user && <Link to="/account/orders" className={styles.wishlistBtn} style={{ textDecoration: 'none' }}>VIEW ORDERS</Link>}
              </div>
            </motion.div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 450px', gap: '80px' }}>
            
            {/* Left: Checkout Flow */}
            <div>
              <div style={{ display: 'flex', gap: '20px', marginBottom: '60px', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                <motion.span animate={{ color: step >= 1 ? '#fff' : 'rgba(255,255,255,0.4)' }} style={{ borderBottom: step === 1 ? '1px solid #fff' : 'none', paddingBottom: '5px' }}>Shipping</motion.span>
                <span>&mdash;</span>
                <motion.span animate={{ color: step >= 2 ? '#fff' : 'rgba(255,255,255,0.4)' }} style={{ borderBottom: step === 2 ? '1px solid #fff' : 'none', paddingBottom: '5px' }}>Review</motion.span>
                <span>&mdash;</span>
                <motion.span animate={{ color: step >= 3 ? '#fff' : 'rgba(255,255,255,0.4)' }} style={{ borderBottom: step === 3 ? '1px solid #fff' : 'none', paddingBottom: '5px' }}>Payment</motion.span>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  {/* STEP 1: SHIPPING */}
                  {step === 1 && (
                    <div>
                      <h2 style={{ fontSize: '1.8rem', fontWeight: 300, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '40px' }}>Shipping Address</h2>
                      
                      {loadingAddresses ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', marginBottom: '40px' }}>
                          <div className={accountStyles.card} style={{ height: '160px', animation: 'pulse 2s infinite', margin: 0 }} />
                          <div className={accountStyles.card} style={{ height: '160px', animation: 'pulse 2s infinite', margin: 0 }} />
                        </div>
                      ) : !user ? (
                        <div className={accountStyles.card} style={{ padding: '40px', margin: '0 0 40px 0' }}>
                          <p style={{ marginBottom: '30px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.6' }}>Please log in to use your saved addresses or checkout as a guest.</p>
                          <div style={{ display: 'flex', gap: '20px' }}>
                            <Link to="/login" className={styles.secondaryBtn} style={{ textDecoration: 'none' }}>Log In</Link>
                            <button onClick={handleNextStep} className={styles.primaryBtn}>Guest Checkout</button>
                          </div>
                        </div>
                      ) : addresses.length === 0 ? (
                        <div className={accountStyles.card} style={{ padding: '40px', margin: '0 0 40px 0' }}>
                          <p style={{ marginBottom: '30px', color: 'rgba(255,255,255,0.7)' }}>You don't have any saved addresses.</p>
                          <Link to="/account/addresses" className={styles.secondaryBtn} style={{ textDecoration: 'none' }}>Add Address</Link>
                        </div>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', marginBottom: '50px' }}>
                          {addresses.map(addr => (
                            <motion.div 
                              key={addr.id}
                              whileHover={{ y: -4 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setSelectedAddressId(addr.id)}
                              className={accountStyles.card}
                              style={{
                                padding: '30px',
                                margin: 0,
                                border: `1px solid ${selectedAddressId === addr.id ? 'var(--accent-color, #D4AF37)' : 'rgba(255,255,255,0.05)'}`,
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                              }}
                            >
                              {selectedAddressId === addr.id && (
                                <motion.div layoutId="selectedAddress" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'var(--accent-color, #D4AF37)' }} />
                              )}
                              <h4 style={{ fontSize: '0.9rem', letterSpacing: '0.1em', marginBottom: '15px', color: '#fff' }}>{addr.title || 'Address'}</h4>
                              <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', lineHeight: '1.8' }}>
                                <p>{addr.first_name} {addr.last_name}</p>
                                <p>{addr.street}</p>
                                <p>{addr.city}, {addr.state} {addr.postal_code}</p>
                                <p>{addr.country}</p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}

                      {(user && addresses.length > 0) && (
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleNextStep} className={styles.primaryBtn} style={{ width: '100%', maxWidth: '300px' }}>CONTINUE TO REVIEW</motion.button>
                      )}
                    </div>
                  )}

                  {/* STEP 2: REVIEW */}
                  {step === 2 && (
                    <div>
                      <h2 style={{ fontSize: '1.8rem', fontWeight: 300, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '40px' }}>Review Order</h2>
                      
                      <div className={accountStyles.card} style={{ padding: '40px', margin: '0 0 30px 0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                          <h3 style={{ fontSize: '0.8rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>Shipping To</h3>
                          <button onClick={() => setStep(1)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-color, #D4AF37)', cursor: 'pointer', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Edit</button>
                        </div>
                        {selectedAddressId ? (() => {
                          const addr = addresses.find(a => a.id === selectedAddressId);
                          return addr ? (
                            <div style={{ fontSize: '0.9rem', lineHeight: '1.8', color: '#fff' }}>
                              <p>{addr.first_name} {addr.last_name}</p>
                              <p>{addr.street}, {addr.city}, {addr.state} {addr.postal_code}</p>
                              <p>{addr.country}</p>
                            </div>
                          ) : <p style={{ color: '#fff' }}>Guest Address</p>;
                        })() : <p style={{ color: '#fff' }}>Guest Address</p>}
                      </div>

                      <div className={accountStyles.card} style={{ padding: '40px', margin: '0 0 50px 0' }}>
                        <h3 style={{ fontSize: '0.8rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '25px', color: 'rgba(255,255,255,0.5)' }}>Shipping Method</h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <p style={{ fontSize: '1rem', marginBottom: '8px', color: '#fff' }}>Standard Delivery</p>
                            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>3-5 Business Days</p>
                          </div>
                          <p style={{ fontSize: '1rem', color: '#fff' }}>Complimentary</p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '20px' }}>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleNextStep} className={styles.primaryBtn} style={{ flex: 1, maxWidth: '300px' }}>CONTINUE TO PAYMENT</motion.button>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setStep(1)} className={styles.secondaryBtn}>BACK</motion.button>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: PAYMENT */}
                  {step === 3 && (
                    <div>
                      <h2 style={{ fontSize: '1.8rem', fontWeight: 300, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '40px' }}>Payment Method</h2>
                      
                      <div className={accountStyles.card} style={{ padding: '40px', margin: '0 0 50px 0' }}>
                        <div className={accountStyles.formGroup}>
                          <label className={accountStyles.formLabel}>Name on Card</label>
                          <input type="text" className={accountStyles.formInput} placeholder="JOHN DOE" disabled={isProcessing} />
                        </div>
                        <div className={accountStyles.formGroup}>
                          <label className={accountStyles.formLabel}>Card Number</label>
                          <input type="text" className={accountStyles.formInput} placeholder="**** **** **** ****" disabled={isProcessing} />
                        </div>
                        <div className={accountStyles.formGrid}>
                          <div className={accountStyles.formGroup}>
                            <label className={accountStyles.formLabel}>Expiration Date</label>
                            <input type="text" className={accountStyles.formInput} placeholder="MM/YY" disabled={isProcessing} />
                          </div>
                          <div className={accountStyles.formGroup}>
                            <label className={accountStyles.formLabel}>Security Code</label>
                            <input type="text" className={accountStyles.formInput} placeholder="CVC" disabled={isProcessing} />
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '20px' }}>
                        <motion.button 
                          whileHover={!isProcessing ? { scale: 1.02 } : {}} 
                          whileTap={!isProcessing ? { scale: 0.98 } : {}} 
                          onClick={handlePlaceOrder} 
                          className={styles.primaryBtn} 
                          disabled={isProcessing}
                          style={{ flex: 1, maxWidth: '300px', position: 'relative', overflow: 'hidden' }}
                        >
                          <AnimatePresence mode="wait">
                            {isProcessing ? (
                              <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                <div style={{ width: '16px', height: '16px', border: '2px solid #000', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                                <span>PROCESSING</span>
                              </motion.div>
                            ) : (
                              <motion.span key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>AUTHORIZE & PAY</motion.span>
                            )}
                          </AnimatePresence>
                        </motion.button>
                        <motion.button whileHover={!isProcessing ? { scale: 1.02 } : {}} whileTap={!isProcessing ? { scale: 0.98 } : {}} onClick={() => setStep(2)} className={styles.secondaryBtn} disabled={isProcessing}>BACK</motion.button>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

            </div>

            {/* Right: Order Summary */}
            <div>
              <div className={accountStyles.card} style={{ position: 'sticky', top: '140px', padding: '40px', margin: 0 }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 400, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '40px' }}>Order Summary</h2>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', marginBottom: '40px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '40px' }}>
                  {cartItems.map(item => (
                    <div key={item.id} style={{ display: 'flex', gap: '20px' }}>
                      <div style={{ width: '70px', height: '90px', background: '#050505', flexShrink: 0, border: '1px solid rgba(255,255,255,0.05)' }}>
                        <img src={item.product.image_url || DEFAULT_IMAGE} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <p style={{ fontSize: '0.85rem', letterSpacing: '0.05em', marginBottom: '8px', color: '#fff', lineHeight: '1.4' }}>{item.product.name}</p>
                        {item.variant?.size && <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '5px', textTransform: 'uppercase' }}>Size: {item.variant.size}</p>}
                        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Qty: {item.quantity}</p>
                      </div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 300, color: '#fff' }}>
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', letterSpacing: '0.05em' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Subtotal</span>
                    <span style={{ color: '#fff' }}>${cartTotal.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Shipping</span>
                    <span style={{ color: '#fff' }}>Complimentary</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Estimated Tax</span>
                    <span style={{ color: '#fff' }}>$0.00</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '25px', marginTop: '10px', color: '#fff', fontSize: '1.2rem', fontWeight: 300, letterSpacing: '0.1em' }}>
                    <span>Total</span>
                    <span>${cartTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default Checkout;
