import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../contexts/CartContext';
import styles from './Shop.module.css';
import accountStyles from '../Account/Account.module.css';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1200&auto=format&fit=crop';

const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, cartTotal } = useCart();
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
  };

  if (cartItems.length === 0) {
    return (
      <div style={{ position: 'relative', minHeight: '85vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--secondary-color, #0a0a0a)', overflow: 'hidden' }}>
        <div className={accountStyles.bgTextAccount}>BAG</div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} style={{ textAlign: 'center', zIndex: 1, position: 'relative' }}>
          <div style={{ fontSize: '3rem', color: 'rgba(212,175,55,0.3)', marginBottom: '20px' }}>✧</div>
          <h1 style={{ fontSize: '2rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '20px', fontFamily: 'var(--font-heading)', fontWeight: 300 }}>Your Cart is Empty</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '40px', letterSpacing: '0.05em' }}>Explore our latest collections to find your next piece.</p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link to="/collections" className={styles.primaryBtn} style={{ textDecoration: 'none' }}>CONTINUE SHOPPING</Link>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: 'var(--secondary-color, #0a0a0a)', overflow: 'hidden' }}>
      {/* Background Typography */}
      <AnimatePresence mode="wait">
        <motion.div
          key="CART"
          className={accountStyles.bgTextAccount}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          CART
        </motion.div>
      </AnimatePresence>

      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="visible"
        style={{ position: 'relative', zIndex: 1, maxWidth: '1400px', margin: '0 auto', padding: '140px 40px 100px' }}
      >
        <motion.h1 
          variants={itemVariants}
          style={{ fontSize: '2.5rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '60px', fontFamily: 'var(--font-heading)', fontWeight: 300 }}
        >
          My Cart
        </motion.h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '80px' }}>
          
          {/* Left: Products */}
          <motion.div variants={itemVariants} style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div style={{ display: 'flex', paddingBottom: '15px', color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              <span style={{ flex: 2 }}>Product</span>
              <span style={{ flex: 1, textAlign: 'center' }}>Quantity</span>
              <span style={{ flex: 1, textAlign: 'right' }}>Total</span>
            </div>

            <AnimatePresence>
              {cartItems.map((item) => (
                <motion.div 
                  key={item.id} 
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, x: -20 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className={accountStyles.card}
                  style={{ display: 'flex', alignItems: 'center', padding: '30px', margin: 0 }}
                >
                  <div style={{ flex: 2, display: 'flex', gap: '30px', alignItems: 'center' }}>
                    <Link to={`/product/${item.product.slug}`} style={{ width: '100px', height: '130px', background: '#050505', flexShrink: 0, border: '1px solid rgba(255,255,255,0.05)' }}>
                      <img src={item.product.image_url || DEFAULT_IMAGE} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </Link>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <Link to={`/product/${item.product.slug}`} style={{ color: '#fff', textDecoration: 'none', fontSize: '1.1rem', letterSpacing: '0.1em', fontWeight: 400, textTransform: 'uppercase' }}>{item.product.name}</Link>
                      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', letterSpacing: '0.05em' }}>${item.product.price.toFixed(2)}</p>
                      {item.variant?.size && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', letterSpacing: '0.05em' }}>Size: {item.variant.size}</p>}
                      <button 
                        onClick={() => removeFromCart(item.id)} 
                        style={{ color: 'rgba(239, 68, 68, 0.8)', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', marginTop: '10px', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', transition: 'color 0.3s', fontWeight: 500 }}
                        onMouseOver={e=>e.currentTarget.style.color='#ef4444'}
                        onMouseOut={e=>e.currentTarget.style.color='rgba(239, 68, 68, 0.8)'}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid rgba(255,255,255,0.1)', padding: '5px 10px', transition: 'border-color 0.3s' }} onMouseOver={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.3)'} onMouseOut={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'}>
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} style={{ width: '25px', background: 'transparent', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '1.2rem', opacity: 0.6, transition: 'opacity 0.3s' }} onMouseOver={e=>e.currentTarget.style.opacity=1} onMouseOut={e=>e.currentTarget.style.opacity=0.6}>-</button>
                      <span style={{ width: '30px', textAlign: 'center', fontSize: '0.95rem', fontWeight: 300 }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} style={{ width: '25px', background: 'transparent', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '1.2rem', opacity: 0.6, transition: 'opacity 0.3s' }} onMouseOver={e=>e.currentTarget.style.opacity=1} onMouseOut={e=>e.currentTarget.style.opacity=0.6}>+</button>
                    </div>
                  </div>
                  
                  <div style={{ flex: 1, textAlign: 'right', fontSize: '1.1rem', fontWeight: 300, letterSpacing: '0.05em' }}>
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Right: Order Summary */}
          <motion.div variants={itemVariants}>
            <div className={accountStyles.card} style={{ position: 'sticky', top: '140px', padding: '40px' }}>
              <h2 style={{ fontSize: '1.1rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '30px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '20px', fontWeight: 400 }}>Order Summary</h2>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', letterSpacing: '0.05em' }}>
                <span>Subtotal</span>
                <span style={{ color: '#fff' }}>${cartTotal.toFixed(2)}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', letterSpacing: '0.05em' }}>
                <span>Shipping</span>
                <span style={{ color: '#fff' }}>Calculated at checkout</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px', fontSize: '1.2rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '25px', fontWeight: 300, letterSpacing: '0.1em' }}>
                <span>Total</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              
              <motion.button 
                whileHover={{ scale: 1.02 }} 
                whileTap={{ scale: 0.98 }} 
                onClick={() => navigate('/checkout')} 
                className={styles.primaryBtn} 
                style={{ width: '100%', padding: '18px' }}
              >
                PROCEED TO CHECKOUT
              </motion.button>
              
              <p style={{ marginTop: '20px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', textAlign: 'center', lineHeight: '1.6', letterSpacing: '0.05em' }}>
                Taxes and shipping calculated at checkout. By proceeding, you agree to our Terms of Service.
              </p>
            </div>
          </motion.div>

        </div>
      </motion.div>
    </div>
  );
};

export default Cart;
