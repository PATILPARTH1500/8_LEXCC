import React, { useState, useEffect } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../../pages/Public/Shop.module.css';
import accountStyles from '../../pages/Account/Account.module.css';

const StripePaymentForm = ({ onPaymentSuccess, onBack, clientSecret, amount }) => {
  const stripe = useStripe();
  const elements = useElements();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required', // Prevent immediate redirect so we can handle state
    });

    if (error) {
      setErrorMessage(error.message);
      setIsProcessing(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      onPaymentSuccess();
    } else {
      setErrorMessage("An unexpected error occurred.");
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      <h2 style={{ fontSize: '1.8rem', fontWeight: 300, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '40px' }}>Payment Method</h2>
      
      <div className={accountStyles.card} style={{ padding: '40px', margin: '0 0 50px 0', background: 'rgba(255,255,255,0.02)' }}>
        <PaymentElement 
          options={{
            layout: 'tabs',
            style: {
              base: {
                color: '#ffffff',
                fontFamily: 'Inter, sans-serif',
                fontSmoothing: 'antialiased',
                fontSize: '16px',
                '::placeholder': {
                  color: 'rgba(255,255,255,0.4)'
                }
              },
              invalid: {
                color: '#ef4444',
                iconColor: '#ef4444'
              }
            }
          }} 
        />
        {errorMessage && (
          <div style={{ color: '#ef4444', marginTop: '20px', fontSize: '0.9rem' }}>
            {errorMessage}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        <motion.button 
          type="submit"
          whileHover={!isProcessing && stripe ? { scale: 1.02 } : {}} 
          whileTap={!isProcessing && stripe ? { scale: 0.98 } : {}} 
          className={styles.primaryBtn} 
          disabled={!stripe || isProcessing}
          style={{ flex: 1, maxWidth: '300px', position: 'relative', overflow: 'hidden' }}
        >
          <AnimatePresence mode="wait">
            {isProcessing ? (
              <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <div style={{ width: '16px', height: '16px', border: '2px solid #000', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <span>PROCESSING</span>
              </motion.div>
            ) : (
              <motion.span key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>AUTHORIZE & PAY ${(amount).toFixed(2)}</motion.span>
            )}
          </AnimatePresence>
        </motion.button>
        
        <motion.button 
          type="button"
          whileHover={!isProcessing ? { scale: 1.02 } : {}} 
          whileTap={!isProcessing ? { scale: 0.98 } : {}} 
          onClick={onBack} 
          className={styles.secondaryBtn} 
          disabled={isProcessing}
        >
          BACK
        </motion.button>
      </div>
    </form>
  );
};

export default StripePaymentForm;
