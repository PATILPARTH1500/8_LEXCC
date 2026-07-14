import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import styles from './Shop.module.css';
import accountStyles from '../Account/Account.module.css';

const Checkout = () => {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user, fetchAddresses } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1); // 1: Shipping, 2: Review, 3: Payment, 4: Confirmation
  
  // Addresses
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  
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
      });
    }
  }, [user, cartItems.length, navigate, step]);

  const handleNextStep = () => {
    if (step === 1 && !selectedAddressId) {
      alert("Please select a shipping address");
      return;
    }
    setStep(prev => prev + 1);
  };

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    try {
      // Mock payment delay
      await new Promise(res => setTimeout(res, 2000));
      
      const orderNumber = `LEX-${Math.floor(Math.random() * 1000000)}`;
      const selectedAddress = addresses.find(a => a.id === selectedAddressId) || {};
      
      let newOrderId = null;

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
        newOrderId = order.id;

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

  if (step === 4) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ textAlign: 'center', maxWidth: '600px', width: '100%' }}
        >
          <div style={{ fontSize: '4rem', marginBottom: '20px', color: 'var(--accent-color, #D4AF37)' }}>✓</div>
          <h1 style={{ fontSize: '2.5rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '20px', fontFamily: 'var(--font-heading)' }}>Order Confirmed</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '10px', fontSize: '1.1rem' }}>Thank you for your purchase.</p>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '40px' }}>Order Number: <strong style={{ color: '#fff' }}>{orderId}</strong></p>
          
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '30px', marginBottom: '40px', textAlign: 'left' }}>
            <h3 style={{ fontSize: '1rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '15px' }}>Tracking Information</h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', lineHeight: '1.6' }}>
              Your order is currently processing. You will receive an email with tracking details once your items have shipped.
            </p>
          </div>

          <Link to="/collections" className={styles.primaryBtn} style={{ textDecoration: 'none', display: 'inline-block' }}>CONTINUE SHOPPING</Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '120px 40px 80px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 450px', gap: '80px' }}>
        
        {/* Left: Checkout Flow */}
        <div>
          <div style={{ display: 'flex', gap: '20px', marginBottom: '60px', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            <span style={{ color: step >= 1 ? '#fff' : 'inherit', borderBottom: step === 1 ? '1px solid #fff' : 'none', paddingBottom: '5px' }}>Shipping</span>
            <span>&mdash;</span>
            <span style={{ color: step >= 2 ? '#fff' : 'inherit', borderBottom: step === 2 ? '1px solid #fff' : 'none', paddingBottom: '5px' }}>Review</span>
            <span>&mdash;</span>
            <span style={{ color: step >= 3 ? '#fff' : 'inherit', borderBottom: step === 3 ? '1px solid #fff' : 'none', paddingBottom: '5px' }}>Payment</span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {/* STEP 1: SHIPPING */}
              {step === 1 && (
                <div>
                  <h2 style={{ fontSize: '1.5rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '30px' }}>Shipping Address</h2>
                  
                  {!user ? (
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '30px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <p style={{ marginBottom: '20px' }}>Please log in to use your saved addresses or checkout as a guest.</p>
                      <Link to="/login" className={styles.secondaryBtn} style={{ textDecoration: 'none', display: 'inline-block' }}>Log In</Link>
                      <button onClick={handleNextStep} className={styles.primaryBtn} style={{ marginLeft: '15px' }}>Guest Checkout</button>
                    </div>
                  ) : addresses.length === 0 ? (
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '30px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <p style={{ marginBottom: '20px' }}>You don't have any saved addresses.</p>
                      <Link to="/account/addresses" className={styles.secondaryBtn} style={{ textDecoration: 'none', display: 'inline-block' }}>Add Address</Link>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px' }}>
                      {addresses.map(addr => (
                        <div 
                          key={addr.id}
                          onClick={() => setSelectedAddressId(addr.id)}
                          style={{
                            padding: '25px',
                            background: selectedAddressId === addr.id ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                            border: `1px solid ${selectedAddressId === addr.id ? '#fff' : 'rgba(255,255,255,0.05)'}`,
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <h4 style={{ fontSize: '0.9rem', letterSpacing: '0.1em', marginBottom: '15px' }}>{addr.title}</h4>
                          <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', lineHeight: '1.6' }}>
                            <p>{addr.first_name} {addr.last_name}</p>
                            <p>{addr.street}</p>
                            <p>{addr.city}, {addr.state} {addr.postal_code}</p>
                            <p>{addr.country}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {(user && addresses.length > 0) && (
                    <button onClick={handleNextStep} className={styles.primaryBtn}>CONTINUE TO REVIEW</button>
                  )}
                </div>
              )}

              {/* STEP 2: REVIEW */}
              {step === 2 && (
                <div>
                  <h2 style={{ fontSize: '1.5rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '30px' }}>Review Order</h2>
                  
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '30px', marginBottom: '40px' }}>
                    <h3 style={{ fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '20px', color: 'rgba(255,255,255,0.5)' }}>Shipping To</h3>
                    {selectedAddressId ? (() => {
                      const addr = addresses.find(a => a.id === selectedAddressId);
                      return addr ? (
                        <div style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
                          <p>{addr.first_name} {addr.last_name}</p>
                          <p>{addr.street}, {addr.city}, {addr.state} {addr.postal_code}</p>
                          <p>{addr.country}</p>
                        </div>
                      ) : <p>Guest Address (Not implemented in mock)</p>;
                    })() : <p>Guest Address (Not implemented in mock)</p>}
                    <button onClick={() => setStep(1)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-color, #D4AF37)', marginTop: '15px', cursor: 'pointer', fontSize: '0.85rem' }}>Edit Address</button>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '30px', marginBottom: '40px' }}>
                    <h3 style={{ fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '20px', color: 'rgba(255,255,255,0.5)' }}>Shipping Method</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontSize: '1rem', marginBottom: '5px' }}>Standard Shipping</p>
                        <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>3-5 Business Days</p>
                      </div>
                      <p style={{ fontSize: '1rem' }}>Free</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '20px' }}>
                    <button onClick={handleNextStep} className={styles.primaryBtn}>CONTINUE TO PAYMENT</button>
                    <button onClick={() => setStep(1)} className={styles.secondaryBtn}>BACK</button>
                  </div>
                </div>
              )}

              {/* STEP 3: PAYMENT */}
              {step === 3 && (
                <div>
                  <h2 style={{ fontSize: '1.5rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '30px' }}>Payment Method</h2>
                  
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '30px', marginBottom: '40px' }}>
                    <div className={accountStyles.formGroup}>
                      <label className={accountStyles.formLabel}>Name on Card</label>
                      <input type="text" className={accountStyles.formInput} placeholder="JOHN DOE" />
                    </div>
                    <div className={accountStyles.formGroup}>
                      <label className={accountStyles.formLabel}>Card Number</label>
                      <input type="text" className={accountStyles.formInput} placeholder="**** **** **** ****" />
                    </div>
                    <div className={accountStyles.formGrid}>
                      <div className={accountStyles.formGroup}>
                        <label className={accountStyles.formLabel}>Expiration Date</label>
                        <input type="text" className={accountStyles.formInput} placeholder="MM/YY" />
                      </div>
                      <div className={accountStyles.formGroup}>
                        <label className={accountStyles.formLabel}>Security Code</label>
                        <input type="text" className={accountStyles.formInput} placeholder="CVC" />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '20px' }}>
                    <button onClick={handlePlaceOrder} className={styles.primaryBtn} disabled={isProcessing}>
                      {isProcessing ? 'PROCESSING...' : 'PLACE ORDER'}
                    </button>
                    <button onClick={() => setStep(2)} className={styles.secondaryBtn} disabled={isProcessing}>BACK</button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

        </div>

        {/* Right: Order Summary */}
        <div>
          <div style={{ position: 'sticky', top: '120px' }}>
            <h2 style={{ fontSize: '1.2rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '30px' }}>Order Summary</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '40px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '30px' }}>
              {cartItems.map(item => (
                <div key={item.id} style={{ display: 'flex', gap: '20px' }}>
                  <div style={{ width: '60px', height: '80px', background: '#111', flexShrink: 0 }}>
                    <img src={item.product.images?.[0]?.image_url || 'https://via.placeholder.com/60x80/111/fff?text=No+Image'} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.85rem', letterSpacing: '0.05em', marginBottom: '5px' }}>{item.product.name}</p>
                    {item.variant?.size && <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '5px' }}>Size: {item.variant.size}</p>}
                    <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Qty: {item.quantity}</p>
                  </div>
                  <div style={{ fontSize: '0.9rem' }}>
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Estimated Tax</span>
                <span>$0.00</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px', marginTop: '5px', color: '#fff', fontSize: '1.2rem' }}>
                <span>Total</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Checkout;
