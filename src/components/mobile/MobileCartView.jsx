import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiMinus, FiPlus, FiTrash2 } from 'react-icons/fi';
import SEO from '../common/SEO';
import { formatINR } from '../../utils/currency';
import styles from './MobileCartView.module.css';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1200&auto=format&fit=crop';

const MobileCartView = ({ cartError, cartItems, cartTotal, onCheckout, onRemove, onUpdateQuantity }) => {
  const reduceMotion = useReducedMotion();

  if (cartItems.length === 0) {
    return (
      <main className={styles.emptyPage} id="main-content">
        <SEO title="Your Cart" />
        <span aria-hidden="true">✧</span>
        <p>LEXCC / Your bag</p>
        <h1>Your cart is empty</h1>
        <p>Explore the latest collection and find your next essential.</p>
        <Link to="/shop">Continue shopping</Link>
      </main>
    );
  }

  return (
    <main className={styles.page} id="main-content">
      <SEO title="Your Cart" />
      <header className={styles.header}>
        <p>LEXCC / Checkout</p>
        <h1>Your cart</h1>
        <span>{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}</span>
      </header>

      {cartError && <p className={styles.error} role="alert">{cartError}</p>}

      <section className={styles.items} aria-label="Items in your cart">
        <AnimatePresence initial={false}>
          {cartItems.map((item) => (
            <motion.article
              layout={!reduceMotion}
              key={item.id}
              className={styles.item}
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -12 }}
            >
              <Link to={`/product/${item.product.slug}`} className={styles.imageLink}>
                <img src={item.product.image_url || DEFAULT_IMAGE} alt={item.product.name} />
              </Link>
              <div className={styles.itemInfo}>
                <Link to={`/product/${item.product.slug}`} className={styles.itemName}>{item.product.name}</Link>
                <p>{item.variant?.size && `Size ${item.variant.size}`}{item.variant?.size && item.variant?.color ? ' · ' : ''}{item.variant?.color || ''}</p>
                <strong>{formatINR(item.product.price * item.quantity)}</strong>
                <div className={styles.itemActions}>
                  <div className={styles.quantity} aria-label={`Quantity for ${item.product.name}`}>
                    <button type="button" aria-label="Decrease quantity" onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}><FiMinus /></button>
                    <span aria-live="polite">{item.quantity}</span>
                    <button type="button" aria-label="Increase quantity" onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}><FiPlus /></button>
                  </div>
                  <button type="button" className={styles.remove} aria-label={`Remove ${item.product.name}`} onClick={() => onRemove(item.id)}><FiTrash2 /></button>
                </div>
              </div>
            </motion.article>
          ))}
        </AnimatePresence>
      </section>

      <aside className={styles.summary} aria-labelledby="cart-summary-title">
        <h2 id="cart-summary-title">Order summary</h2>
        <dl>
          <div><dt>Subtotal</dt><dd>{formatINR(cartTotal)}</dd></div>
          <div><dt>Shipping</dt><dd>At checkout</dd></div>
          <div className={styles.total}><dt>Total</dt><dd>{formatINR(cartTotal)}</dd></div>
        </dl>
        <button type="button" onClick={onCheckout}>Proceed to checkout</button>
        <p>Taxes and shipping are confirmed at checkout.</p>
      </aside>
    </main>
  );
};

export default MobileCartView;
