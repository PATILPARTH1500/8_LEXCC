import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import styles from './Shop.module.css';
import accountStyles from '../Account/Account.module.css';
import { initiatePayment } from '../../services/PaymentProvider';
import { formatINR } from '../../utils/currency';
import { generateInvoice } from '../../utils/invoiceGenerator';
import SEO from '../../components/common/SEO';
import MobileCheckoutView from '../../components/mobile/MobileCheckoutView';
import { useResponsive } from '../../contexts/ResponsiveContext';
import { INDIAN_STATES, isValidPinCode, isValidIndianPhone, normalizePhone, getEmptyAddress } from '../../utils/address';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1200&auto=format&fit=crop';
const EMPTY_GUEST_ADDRESS = {
  ...getEmptyAddress(),
  email: ''
};

const Checkout = () => {
  const { isMobile } = useResponsive();
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user, profile, fetchAddresses } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1); // 1: Shipping, 2: Review, 3: Payment, 4: Confirmation
  
  // Addresses
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [guestAddress, setGuestAddress] = useState(EMPTY_GUEST_ADDRESS);
  const [checkoutError, setCheckoutError] = useState('');
  
  // Final Order Info
  const [orderId, setOrderId] = useState(null);
  const [internalOrderId, setInternalOrderId] = useState(null);
  const [guestAccessToken, setGuestAccessToken] = useState(null);
  
  // Payment State
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [downloadingOrderId, setDownloadingOrderId] = useState(null);

  const handleDownloadInvoice = async () => {
    if (!internalOrderId) return;
    setDownloadingOrderId(internalOrderId);
    try {
      await generateInvoice(internalOrderId, guestAccessToken);
    } catch (err) {
      console.error('Failed to generate invoice', err);
      alert('Failed to generate invoice. Please try again.');
    } finally {
      setDownloadingOrderId(null);
    }
  };

  useEffect(() => {
    if (cartItems.length === 0 && step !== 4 && !paymentVerified) {
      navigate('/cart');
    }
    
    if (user) {
      fetchAddresses()
        .then(data => {
          setAddresses(data || []);
          const defaultAddr = data?.find(a => a.is_default);
          if (defaultAddr) setSelectedAddressId(defaultAddr.id);
          else if (data?.length > 0) setSelectedAddressId(data[0].id);
        })
        .catch((error) => {
          console.error('Unable to load shipping addresses:', error);
          setCheckoutError('Your saved addresses could not be loaded. Please try again.');
        })
        .finally(() => setLoadingAddresses(false));
    } else {
      setLoadingAddresses(false);
    }
  }, [user, cartItems.length, navigate, step, paymentVerified]);

  const handleNextStep = async () => {
    setCheckoutError('');

    if (step === 1) {
      if (user && !selectedAddressId) {
        setCheckoutError('Please select a shipping address.');
        return;
      }

      if (!user) {
        const requiredFields = ['first_name', 'last_name', 'street', 'city', 'state', 'postal_code', 'country', 'email', 'phone'];
        if (requiredFields.some((field) => !guestAddress[field]?.trim())) {
          setCheckoutError('Please complete every guest shipping field.');
          return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestAddress.email)) {
          setCheckoutError('Please enter a valid email address.');
          return;
        }
        if (!isValidIndianPhone(guestAddress.phone)) {
          setCheckoutError('Please enter a valid 10-digit Indian phone number.');
          return;
        }
        if (!isValidPinCode(guestAddress.postal_code)) {
          setCheckoutError('Please enter a valid 6-digit PIN code.');
          return;
        }
      }
    }
    setStep(prev => prev + 1);
  };

  const handleGuestAddressChange = (event) => {
    const { name, value } = event.target;
    setGuestAddress((current) => ({ ...current, [name]: value }));
  };

  const selectedShippingAddress = user
    ? addresses.find((address) => address.id === selectedAddressId)
    : guestAddress;

  const handlePaymentInit = async () => {
    setIsProcessingPayment(true);
    setCheckoutError('');
    try {
      if (!selectedShippingAddress) throw new Error('Please select a shipping address.');

      const shippingAddress = {
        ...selectedShippingAddress,
        email: selectedShippingAddress.email || user?.email || '',
        phone: normalizePhone(selectedShippingAddress.phone || profile?.phone || ''),
        country: 'India'
      };

      // Convert cartItems to send to backend for validation
      const itemsPayload = cartItems.map(item => ({
        product_id: item.product.id,
        variant_id: item.variant?.id || null,
        size: item.variant?.size || '',
        color: item.variant?.color || '',
        quantity: item.quantity
      }));
      
      const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
        body: { 
          items: itemsPayload,
          shippingAddress
        }
      });
      
      if (error) throw error;
      if (!data?.orderId || !data?.razorpayOrderId) throw new Error('The payment order response was incomplete.');
      
      setOrderId(data.orderNumber); // For display
      setInternalOrderId(data.orderId); // The UUID for generating invoice
      setGuestAccessToken(data.guestAccessToken || null);

      await initiatePayment({
        amount: data.amount,
        currency: "INR",
        razorpayOrderId: data.razorpayOrderId,
        customerName: `${shippingAddress.first_name || ''} ${shippingAddress.last_name || ''}`.trim(),
        customerEmail: shippingAddress.email,
        customerPhone: shippingAddress.phone
      }, {
        onSuccess: async (response) => {
          const { data: verification, error: verificationError } = await supabase.functions.invoke('verify-razorpay-payment', {
            body: {
              orderId: data.orderId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              guestAccessToken: data.guestAccessToken || null
            }
          });

          if (verificationError) throw verificationError;
          if (!verification?.verified) throw new Error('Payment could not be verified.');

          setPaymentVerified(true);
          try {
            await clearCart();
          } catch (cartCleanupError) {
            console.error('Payment verified, but cart cleanup failed:', cartCleanupError);
            setCheckoutError('Payment was verified, but the cart could not be cleared automatically.');
          }
          setStep(4);
        },
        onFailure: async (err) => {
          console.error(err);
          if (err.message === 'Payment was cancelled.') {
            try {
              await supabase.rpc('cancel_razorpay_order', {
                p_order_id: data.orderId,
                p_guest_token: data.guestAccessToken || null
              });
              setCheckoutError('Payment was cancelled. You can review your order and try again.');
            } catch (cancelErr) {
              console.error('Failed to cancel order status:', cancelErr);
              setCheckoutError('Payment was cancelled.');
            }
          } else {
            setCheckoutError(err.message || 'Payment failed.');
          }
        }
      });

    } catch (error) {
      console.error("Failed to initialize payment:", error);
      setCheckoutError(error.message || 'Secure payment could not be completed. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const getBackgroundText = () => {
    if (step === 1) return 'SHIPPING';
    if (step === 2) return 'REVIEW';
    if (step === 3) return 'PAYMENT';
    if (step === 4) return 'CONFIRMED';
    return '';
  };

  if (isMobile) {
    return (
      <MobileCheckoutView
        addresses={addresses}
        cartItems={cartItems}
        cartTotal={cartTotal}
        checkoutError={checkoutError}
        downloadingOrderId={downloadingOrderId}
        guestAddress={guestAddress}
        internalOrderId={internalOrderId}
        isProcessingPayment={isProcessingPayment}
        loadingAddresses={loadingAddresses}
        onAddressSelect={setSelectedAddressId}
        onDownloadInvoice={handleDownloadInvoice}
        onGuestAddressChange={handleGuestAddressChange}
        onNext={handleNextStep}
        onPayment={handlePaymentInit}
        onStepChange={setStep}
        orderId={orderId}
        selectedAddressId={selectedAddressId}
        selectedShippingAddress={selectedShippingAddress}
        step={step}
        user={user}
      />
    );
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: 'var(--secondary-color, #0a0a0a)', overflow: 'hidden' }}>
      <SEO title="Checkout" />
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

      <div className={styles.checkoutPageContainer}>
        
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
              {checkoutError && <p role="status" style={{ color: '#facc15', marginBottom: '30px', fontSize: '0.85rem' }}>{checkoutError}</p>}
              
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

              <div className={styles.checkoutConfirmationActions}>
                <Link to="/shop" className={styles.primaryBtn} style={{ textDecoration: 'none' }}>CONTINUE SHOPPING</Link>
                {user && <Link to="/account/orders" className={styles.wishlistBtn} style={{ textDecoration: 'none' }}>VIEW ORDERS</Link>}
                {internalOrderId && (
                  <button 
                    onClick={handleDownloadInvoice}
                    disabled={downloadingOrderId === internalOrderId}
                    className={styles.wishlistBtn}
                    style={{ cursor: downloadingOrderId === internalOrderId ? 'not-allowed' : 'pointer' }}
                  >
                    {downloadingOrderId === internalOrderId ? 'GENERATING...' : 'DOWNLOAD INVOICE'}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        ) : (
          <div className={styles.checkoutGrid}>
            
            {/* Left: Checkout Flow */}
            <div>
              <div style={{ display: 'flex', gap: '20px', marginBottom: '60px', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                <motion.span animate={{ color: step >= 1 ? '#fff' : 'rgba(255,255,255,0.4)' }} style={{ borderBottom: step === 1 ? '1px solid #fff' : 'none', paddingBottom: '5px' }}>Shipping</motion.span>
                <span>&mdash;</span>
                <motion.span animate={{ color: step >= 2 ? '#fff' : 'rgba(255,255,255,0.4)' }} style={{ borderBottom: step === 2 ? '1px solid #fff' : 'none', paddingBottom: '5px' }}>Review</motion.span>
                <span>&mdash;</span>
                <motion.span animate={{ color: step >= 3 ? '#fff' : 'rgba(255,255,255,0.4)' }} style={{ borderBottom: step === 3 ? '1px solid #fff' : 'none', paddingBottom: '5px' }}>Payment</motion.span>
              </div>

              {checkoutError && (
                <p role="alert" className={styles.checkoutError}>{checkoutError}</p>
              )}

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
                        <div className={accountStyles.addressGrid} style={{ marginBottom: '40px' }}>
                          <div className={accountStyles.card} style={{ height: '160px', animation: 'pulse 2s infinite', margin: 0 }} />
                          <div className={accountStyles.card} style={{ height: '160px', animation: 'pulse 2s infinite', margin: 0 }} />
                        </div>
                      ) : !user ? (
                        <div className={accountStyles.card} style={{ padding: '40px', margin: '0 0 40px 0' }}>
                          <p style={{ marginBottom: '30px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.6' }}>
                            Enter the delivery details below, or <Link to="/login" style={{ color: 'var(--accent-color, #D4AF37)' }}>log in</Link> to use a saved address.
                          </p>
                          <div className={accountStyles.formGrid}>
                            <div className={accountStyles.formGroup} style={{ marginBottom: 0 }}>
                              <label htmlFor="guest-first_name" className={accountStyles.formLabel}>First Name</label>
                              <input id="guest-first_name" name="first_name" type="text" value={guestAddress.first_name} onChange={handleGuestAddressChange} className={accountStyles.formInput} required />
                            </div>
                            <div className={accountStyles.formGroup} style={{ marginBottom: 0 }}>
                              <label htmlFor="guest-last_name" className={accountStyles.formLabel}>Last Name</label>
                              <input id="guest-last_name" name="last_name" type="text" value={guestAddress.last_name} onChange={handleGuestAddressChange} className={accountStyles.formInput} required />
                            </div>
                            <div className={accountStyles.formGroup} style={{ marginBottom: 0 }}>
                              <label htmlFor="guest-email" className={accountStyles.formLabel}>Email Address</label>
                              <input id="guest-email" name="email" type="email" value={guestAddress.email} onChange={handleGuestAddressChange} className={accountStyles.formInput} required />
                            </div>
                            <div className={accountStyles.formGroup} style={{ marginBottom: 0 }}>
                              <label htmlFor="guest-phone" className={accountStyles.formLabel}>Phone Number</label>
                              <input id="guest-phone" name="phone" type="tel" value={guestAddress.phone} onChange={handleGuestAddressChange} className={accountStyles.formInput} required />
                            </div>
                            <div className={accountStyles.formGroup} style={{ marginBottom: 0 }}>
                              <label htmlFor="guest-street" className={accountStyles.formLabel}>Address Line 1 (Street)</label>
                              <input id="guest-street" name="street" type="text" value={guestAddress.street} onChange={handleGuestAddressChange} className={accountStyles.formInput} maxLength={180} required />
                            </div>
                            <div className={accountStyles.formGroup} style={{ marginBottom: 0 }}>
                              <label htmlFor="guest-address_line_2" className={accountStyles.formLabel}>Address Line 2 (Optional)</label>
                              <input id="guest-address_line_2" name="address_line_2" type="text" value={guestAddress.address_line_2} onChange={handleGuestAddressChange} className={accountStyles.formInput} maxLength={180} />
                            </div>
                            <div className={accountStyles.formGroup} style={{ marginBottom: 0 }}>
                              <label htmlFor="guest-city" className={accountStyles.formLabel}>City</label>
                              <input id="guest-city" name="city" type="text" value={guestAddress.city} onChange={handleGuestAddressChange} className={accountStyles.formInput} required />
                            </div>
                            <div className={accountStyles.formGroup} style={{ marginBottom: 0 }}>
                              <label htmlFor="guest-state" className={accountStyles.formLabel}>State</label>
                              <select id="guest-state" name="state" value={guestAddress.state} onChange={handleGuestAddressChange} className={accountStyles.formInput} required>
                                <option value="">Select State</option>
                                {INDIAN_STATES.map(state => <option key={state} value={state}>{state}</option>)}
                              </select>
                            </div>
                            <div className={accountStyles.formGroup} style={{ marginBottom: 0 }}>
                              <label htmlFor="guest-postal_code" className={accountStyles.formLabel}>PIN Code</label>
                              <input id="guest-postal_code" name="postal_code" type="text" value={guestAddress.postal_code} onChange={handleGuestAddressChange} className={accountStyles.formInput} maxLength="6" required />
                            </div>
                            <div className={accountStyles.formGroup} style={{ marginBottom: 0 }}>
                              <label htmlFor="guest-country" className={accountStyles.formLabel}>Country</label>
                              <input id="guest-country" name="country" type="text" value="India" className={accountStyles.formInput} readOnly />
                            </div>
                          </div>
                          <button onClick={handleNextStep} className={styles.primaryBtn} style={{ marginTop: '30px', width: '100%', maxWidth: '300px' }}>
                            CONTINUE AS GUEST
                          </button>
                        </div>
                      ) : addresses.length === 0 ? (
                        <div className={accountStyles.card} style={{ padding: '40px', margin: '0 0 40px 0' }}>
                          <p style={{ marginBottom: '30px', color: 'rgba(255,255,255,0.7)' }}>You don't have any saved addresses.</p>
                          <Link to="/account/addresses" className={styles.secondaryBtn} style={{ textDecoration: 'none' }}>Add Address</Link>
                        </div>
                      ) : (
                        <div className={accountStyles.addressGrid} style={{ marginBottom: '50px' }}>
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
                                {addr.phone && <p>{addr.phone}</p>}
                                <p>{addr.street}</p>
                                {addr.address_line_2 && <p>{addr.address_line_2}</p>}
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
                        {selectedShippingAddress ? (
                          <div style={{ fontSize: '0.9rem', lineHeight: '1.8', color: '#fff' }}>
                            <p>{selectedShippingAddress.first_name} {selectedShippingAddress.last_name}</p>
                            {!user && <p>{selectedShippingAddress.email}</p>}
                            <p>{selectedShippingAddress.phone}</p>
                            <p>{selectedShippingAddress.street}</p>
                            {selectedShippingAddress.address_line_2 && <p>{selectedShippingAddress.address_line_2}</p>}
                            <p>{selectedShippingAddress.city}, {selectedShippingAddress.state} {selectedShippingAddress.postal_code}</p>
                            <p>{selectedShippingAddress.country}</p>
                          </div>
                        ) : <p style={{ color: '#fff' }}>No shipping address selected</p>}
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

                      <div style={{ display: 'flex', gap: '20px', flexDirection: 'column' }}>
                        <motion.button 
                          whileHover={{ scale: 1.02 }} 
                          whileTap={{ scale: 0.98 }} 
                          onClick={handleNextStep} 
                          className={styles.primaryBtn} 
                          style={{ flex: 1, maxWidth: '300px' }}
                        >
                          CONTINUE TO PAYMENT
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setStep(1)} className={styles.secondaryBtn} style={{ flex: 1, maxWidth: '300px' }}>BACK</motion.button>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: PAYMENT */}
                  {step === 3 && (
                    <div style={{ minHeight: '400px' }}>
                      <h2 style={{ fontSize: '1.8rem', fontWeight: 300, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '40px' }}>Payment Method</h2>
                      
                      <div className={accountStyles.card} style={{ padding: '40px', margin: '0 0 50px 0' }}>
                        <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: '1.6', fontSize: '0.9rem', marginBottom: '25px' }}>
                          You will be securely redirected to our payment provider to complete your purchase.
                        </p>
                        <motion.button 
                          whileHover={!isProcessingPayment ? { scale: 1.02 } : {}} 
                          whileTap={!isProcessingPayment ? { scale: 0.98 } : {}} 
                          onClick={handlePaymentInit} 
                          className={styles.primaryBtn} 
                          disabled={isProcessingPayment}
                          style={{ width: '100%', position: 'relative', overflow: 'hidden', padding: '18px 0' }}
                        >
                          <AnimatePresence mode="wait">
                            {isProcessingPayment ? (
                              <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                <div style={{ width: '16px', height: '16px', border: '2px solid #000', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                                <span>PROCESSING...</span>
                              </motion.div>
                            ) : (
                              <motion.span key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>PAY SECURELY</motion.span>
                            )}
                          </AnimatePresence>
                        </motion.button>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '20px', flexDirection: 'column' }}>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setStep(2)} className={styles.secondaryBtn} style={{ maxWidth: '300px' }} disabled={isProcessingPayment}>BACK</motion.button>
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
                        {formatINR(item.product.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', letterSpacing: '0.05em' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Subtotal</span>
                    <span style={{ color: '#fff' }}>{formatINR(cartTotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Shipping</span>
                    <span style={{ color: '#fff' }}>Complimentary</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Estimated Tax</span>
                    <span style={{ color: '#fff' }}>{formatINR(0)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '25px', marginTop: '10px', color: '#fff', fontSize: '1.2rem', fontWeight: 300, letterSpacing: '0.1em' }}>
                    <span>Total</span>
                    <span>{formatINR(cartTotal)}</span>
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
