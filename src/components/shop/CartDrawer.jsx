import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../contexts/CartContext';
import styles from '../../pages/Public/Shop.module.css';

const CartDrawer = () => {
  const { isCartOpen, setIsCartOpen, cartItems, removeFromCart, updateQuantity, cartTotal } = useCart();
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
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          />

          {/* Drawer */}
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{ 
              position: 'relative', 
              width: '100%', 
              maxWidth: '450px', 
              background: '#0a0a0a', 
              borderLeft: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '-10px 0 30px rgba(0,0,0,0.5)'
            }}
          >
            <div style={{ padding: '30px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.2rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500 }}>Shopping Cart ({cartItems.length})</h2>
              <button onClick={() => setIsCartOpen(false)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer', opacity: 0.5 }}>&times;</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '30px' }}>
              {cartItems.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
                  <p style={{ letterSpacing: '0.05em', marginBottom: '20px' }}>Your cart is empty.</p>
                  <button onClick={() => setIsCartOpen(false)} className={styles.secondaryBtn} style={{ padding: '12px 24px' }}>Continue Shopping</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                  {cartItems.map((item) => (
                    <div key={item.id} style={{ display: 'flex', gap: '20px' }}>
                      <div style={{ width: '90px', height: '120px', background: '#111' }}>
                        <img 
                          src={item.product.images?.[0]?.image_url || 'https://via.placeholder.com/90x120/111/fff?text=No+Image'} 
                          alt={item.product.name} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <h4 style={{ fontSize: '0.85rem', letterSpacing: '0.05em', lineHeight: '1.4', paddingRight: '10px' }}>{item.product.name}</h4>
                          <span style={{ fontSize: '0.9rem' }}>${item.product.price.toFixed(2)}</span>
                        </div>
                        {item.variant?.size && <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '5px' }}>Size: {item.variant.size}</p>}
                        
                        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid rgba(255,255,255,0.2)' }}>
                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} style={{ padding: '5px 12px', background: 'transparent', color: '#fff', border: 'none', cursor: 'pointer' }}>-</button>
                            <span style={{ fontSize: '0.85rem', width: '20px', textAlign: 'center' }}>{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)} style={{ padding: '5px 12px', background: 'transparent', color: '#fff', border: 'none', cursor: 'pointer' }}>+</button>
                          </div>
                          <button onClick={() => removeFromCart(item.id)} style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', background: 'transparent', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}>Remove</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cartItems.length > 0 && (
              <div style={{ padding: '30px', borderTop: '1px solid rgba(255,255,255,0.1)', background: '#0a0a0a' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '1.1rem', letterSpacing: '0.05em' }}>
                  <span>Subtotal</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: '20px', textAlign: 'center' }}>Shipping & taxes calculated at checkout</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <button onClick={handleCheckout} className={styles.primaryBtn} style={{ width: '100%', textAlign: 'center' }}>CHECKOUT</button>
                  <button onClick={handleViewCart} className={styles.secondaryBtn} style={{ width: '100%', textAlign: 'center' }}>VIEW CART PAGE</button>
                </div>
              </div>
            )}
          </motion.div>

        </div>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
