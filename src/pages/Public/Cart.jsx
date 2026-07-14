import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCart } from '../../contexts/CartContext';
import styles from './Shop.module.css';

const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, cartTotal } = useCart();
  const navigate = useNavigate();

  if (cartItems.length === 0) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '2rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '20px' }}>Your Cart is Empty</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '40px', letterSpacing: '0.05em' }}>Explore our latest collections to find your next piece.</p>
          <Link to="/collections" className={styles.primaryBtn} style={{ textDecoration: 'none' }}>CONTINUE SHOPPING</Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '120px 40px 80px' }}>
      <motion.h1 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        style={{ fontSize: '2.5rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '60px', fontFamily: 'var(--font-heading)' }}
      >
        Shopping Cart
      </motion.h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '60px' }}>
        
        {/* Left: Products */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ delay: 0.1 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}
        >
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            <span style={{ flex: 2 }}>Product</span>
            <span style={{ flex: 1, textAlign: 'center' }}>Quantity</span>
            <span style={{ flex: 1, textAlign: 'right' }}>Total</span>
          </div>

          {cartItems.map((item) => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '30px' }}>
              <div style={{ flex: 2, display: 'flex', gap: '30px', alignItems: 'center' }}>
                <Link to={`/product/${item.product.slug}`} style={{ width: '120px', height: '160px', background: '#111', flexShrink: 0 }}>
                  <img src={item.product.images?.[0]?.image_url || 'https://via.placeholder.com/120x160/111/fff?text=No+Image'} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </Link>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <Link to={`/product/${item.product.slug}`} style={{ color: '#fff', textDecoration: 'none', fontSize: '1.1rem', letterSpacing: '0.05em' }}>{item.product.name}</Link>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>${item.product.price.toFixed(2)}</p>
                  {item.variant?.size && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>Size: {item.variant.size}</p>}
                  <button onClick={() => removeFromCart(item.id)} style={{ color: 'rgba(255,255,255,0.4)', background: 'transparent', border: 'none', textDecoration: 'underline', cursor: 'pointer', textAlign: 'left', marginTop: '10px', fontSize: '0.85rem' }}>Remove</button>
                </div>
              </div>
              
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid rgba(255,255,255,0.2)', padding: '5px' }}>
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)} style={{ width: '30px', background: 'transparent', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>-</button>
                  <span style={{ width: '30px', textAlign: 'center', fontSize: '1rem' }}>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)} style={{ width: '30px', background: 'transparent', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>+</button>
                </div>
              </div>
              
              <div style={{ flex: 1, textAlign: 'right', fontSize: '1.1rem' }}>
                ${(item.product.price * item.quantity).toFixed(2)}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Right: Order Summary */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ delay: 0.2 }}
        >
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '40px', position: 'sticky', top: '120px' }}>
            <h2 style={{ fontSize: '1.2rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '30px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px' }}>Order Summary</h2>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', color: 'rgba(255,255,255,0.7)' }}>
              <span>Subtotal</span>
              <span>${cartTotal.toFixed(2)}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', color: 'rgba(255,255,255,0.7)' }}>
              <span>Shipping</span>
              <span>Calculated at checkout</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px', fontSize: '1.2rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
              <span>Total</span>
              <span>${cartTotal.toFixed(2)}</span>
            </div>
            
            <button onClick={() => navigate('/checkout')} className={styles.primaryBtn} style={{ width: '100%', padding: '18px' }}>PROCEED TO CHECKOUT</button>
            
            <p style={{ marginTop: '20px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: '1.5' }}>
              Taxes and shipping calculated at checkout. By proceeding, you agree to our Terms of Service.
            </p>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default Cart;
