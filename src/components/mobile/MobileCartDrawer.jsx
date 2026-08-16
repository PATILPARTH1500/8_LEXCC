import React, { useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { FiMinus, FiPlus, FiTrash2, FiX } from 'react-icons/fi';
import { formatINR } from '../../utils/currency';
import styles from './MobileCartDrawer.module.css';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1200&auto=format&fit=crop';

const MobileCartDrawer = ({ cartError, cartItems, cartTotal, isOpen, onCheckout, onClose, onRemove, onUpdateQuantity, onViewCart }) => {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!isOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={styles.layer} role="dialog" aria-modal="true" aria-labelledby="mobile-cart-title">
          <motion.button className={styles.backdrop} type="button" aria-label="Close cart" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.aside
            className={styles.drawer}
            initial={reduceMotion ? false : { x: '100%' }}
            animate={{ x: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { x: '100%' }}
            transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            <header>
              <div><p>LEXCC / Bag</p><h2 id="mobile-cart-title">Your cart <span>({cartItems.length})</span></h2></div>
              <button type="button" aria-label="Close cart" onClick={onClose}><FiX /></button>
            </header>
            <div className={styles.body}>
              {cartError && <p role="alert" className={styles.error}>{cartError}</p>}
              {cartItems.length === 0 ? (
                <div className={styles.empty}><span aria-hidden="true">✧</span><p>Your cart is empty.</p><button type="button" onClick={onClose}>Continue shopping</button></div>
              ) : cartItems.map((item) => (
                <article className={styles.item} key={item.id}>
                  <img src={item.product.image_url || DEFAULT_IMAGE} alt={item.product.name} />
                  <div>
                    <h3>{item.product.name}</h3>
                    <p>{item.variant?.size && `Size ${item.variant.size}`}{item.variant?.color ? ` · ${item.variant.color}` : ''}</p>
                    <strong>{formatINR(item.product.price * item.quantity)}</strong>
                    <div className={styles.itemActions}>
                      <div className={styles.quantity}>
                        <button type="button" aria-label="Decrease quantity" onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}><FiMinus /></button>
                        <span>{item.quantity}</span>
                        <button type="button" aria-label="Increase quantity" onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}><FiPlus /></button>
                      </div>
                      <button className={styles.remove} type="button" aria-label={`Remove ${item.product.name}`} onClick={() => onRemove(item.id)}><FiTrash2 /></button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            {cartItems.length > 0 && (
              <footer>
                <div><span>Subtotal</span><strong>{formatINR(cartTotal)}</strong></div>
                <button type="button" onClick={onCheckout}>Secure checkout</button>
                <button type="button" onClick={onViewCart}>View full cart</button>
              </footer>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
};

export default MobileCartDrawer;
