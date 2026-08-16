import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../contexts/CartContext';
import { formatINR } from '../../utils/currency';
import styles from './CartDrawer.module.css';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1200&auto=format&fit=crop';

const CartDrawer = () => {
  const { isCartOpen, setIsCartOpen, cartItems, removeFromCart, updateQuantity, cartTotal, cartError } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    setIsCartOpen(false);
    navigate('/checkout');
  };

  const handleViewCart = () => {
    setIsCartOpen(false);
    navigate('/cart');
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', justifyContent: 'flex-end' }}>
          
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          />

          {/* Drawer */}
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 280, damping: 30, mass: 0.8 }}
            className={`${styles.drawer} will-change-transform`}
          >
            {/* Subtle glow effect */}
            <div style={{ position: 'absolute', top: 0, right: 0, width: '100%', height: '30%', background: 'radial-gradient(ellipse at top right, rgba(212,175,55,0.1), transparent 70%)', pointerEvents: 'none' }} />

            <div className={styles.header}>
              <h2 style={{ fontSize: '1.1rem', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 400 }}>Your Cart ({cartItems.length})</h2>
              <button onClick={() => setIsCartOpen(false)} aria-label="Close cart" style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '2rem', cursor: 'pointer', opacity: 0.5, transition: 'opacity 0.3s', fontWeight: 200, lineHeight: 0.5 }}>&times;</button>
            </div>

            <div className={styles.body}>
              {cartError && <p role="alert" style={{ color: '#fca5a5', padding: '12px', marginBottom: '20px', border: '1px solid rgba(239,68,68,0.25)', fontSize: '0.8rem', lineHeight: 1.5 }}>{cartError}</p>}
              {cartItems.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}
                >
                  <span style={{ fontSize: '3rem', color: 'rgba(212,175,55,0.3)', marginBottom: '20px' }}>✧</span>
                  <p style={{ letterSpacing: '0.1em', marginBottom: '30px', fontSize: '0.9rem', textTransform: 'uppercase' }}>Your cart is empty.</p>
                  <button 
                    onClick={() => setIsCartOpen(false)} 
                    style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '16px 32px', fontSize: '0.8rem', letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.3s' }}
                    onMouseOver={(e) => { e.currentTarget.style.borderColor = '#D4AF37'; e.currentTarget.style.color = '#D4AF37'; }}
                    onMouseOut={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#fff'; }}
                  >
                    Continue Shopping
                  </button>
                </motion.div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '35px' }}>
                  <AnimatePresence>
                    {cartItems.map((item) => (
                      <motion.div 
                        key={item.id} 
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        style={{ display: 'flex', gap: '25px', position: 'relative' }}
                        className="will-change-both"
                      >
                        <div style={{ width: '100px', height: '130px', background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <img 
                            src={item.product.image_url || DEFAULT_IMAGE} 
                            alt={item.product.name} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          />
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <h4 style={{ fontSize: '0.9rem', letterSpacing: '0.1em', lineHeight: '1.4', paddingRight: '15px', fontWeight: 400 }}>{item.product.name}</h4>
                            <span style={{ fontSize: '1rem', fontWeight: 300 }}>{formatINR(item.product.price)}</span>
                          </div>
                          {item.variant?.size && <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginTop: '8px', letterSpacing: '0.05em' }}>Size: {item.variant.size}</p>}
                          
                          <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                              <button onClick={() => updateQuantity(item.id, item.quantity - 1).catch(console.error)} style={{ padding: '8px 12px', background: 'transparent', color: 'rgba(255,255,255,0.6)', border: 'none', cursor: 'pointer', transition: 'color 0.3s' }} onMouseOver={e=>e.currentTarget.style.color='#fff'} onMouseOut={e=>e.currentTarget.style.color='rgba(255,255,255,0.6)'}>-</button>
                              <span style={{ fontSize: '0.85rem', width: '24px', textAlign: 'center' }}>{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.id, item.quantity + 1).catch(console.error)} style={{ padding: '8px 12px', background: 'transparent', color: 'rgba(255,255,255,0.6)', border: 'none', cursor: 'pointer', transition: 'color 0.3s' }} onMouseOver={e=>e.currentTarget.style.color='#fff'} onMouseOut={e=>e.currentTarget.style.color='rgba(255,255,255,0.6)'}>+</button>
                            </div>
                            <button onClick={() => removeFromCart(item.id).catch(console.error)} style={{ fontSize: '0.75rem', color: 'rgba(239, 68, 68, 0.7)', background: 'transparent', border: 'none', textDecoration: 'none', letterSpacing: '0.05em', cursor: 'pointer', transition: 'color 0.3s' }} onMouseOver={e=>e.currentTarget.style.color='#ef4444'} onMouseOut={e=>e.currentTarget.style.color='rgba(239, 68, 68, 0.7)'}>REMOVE</button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {cartItems.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={styles.footer}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', fontSize: '1.2rem', letterSpacing: '0.1em' }}>
                  <span style={{ fontWeight: 400 }}>Subtotal</span>
                  <span style={{ fontWeight: 300 }}>{formatINR(cartTotal)}</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginBottom: '25px', textAlign: 'center', letterSpacing: '0.05em' }}>Shipping & taxes calculated at checkout</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <button 
                    onClick={handleCheckout} 
                    style={{ width: '100%', background: '#fff', color: '#000', border: '1px solid #fff', padding: '18px', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.3s' }}
                    onMouseOver={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#fff'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#000'; }}
                  >
                    SECURE CHECKOUT
                  </button>
                  <button 
                    onClick={handleViewCart} 
                    style={{ width: '100%', background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '18px', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.3s' }}
                    onMouseOver={(e) => { e.currentTarget.style.borderColor = '#D4AF37'; e.currentTarget.style.color = '#D4AF37'; }}
                    onMouseOut={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#fff'; }}
                  >
                    VIEW CART PAGE
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>

        </div>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
