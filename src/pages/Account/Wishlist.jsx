import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import styles from './Account.module.css';

const Wishlist = () => {
  const { fetchWishlist, removeFromWishlist } = useAuth();
  const { addToCart } = useCart();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadWishlist = async () => {
    setIsLoading(true);
    try {
      const data = await fetchWishlist();
      setItems(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWishlist();
  }, []);

  const handleRemove = async (itemId) => {
    try {
      setItems(prev => prev.filter(item => item.id !== itemId));
      await removeFromWishlist(itemId);
    } catch (err) {
      alert('Failed to remove item');
      loadWishlist();
    }
  };

  const handleMoveToCart = async (item, product) => {
    addToCart(product);
    await handleRemove(item.id);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { staggerChildren: 0.1, delayChildren: 0.1 } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants} className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Wishlist</h1>
        <p className={styles.pageSubtitle}>Curate your favorite pieces for the season.</p>
      </motion.div>

      {isLoading ? (
        <motion.div variants={itemVariants} style={{ padding: '40px', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em' }}>LOADING WISHLIST...</motion.div>
      ) : items.length === 0 ? (
        <motion.div variants={itemVariants} className={styles.emptyState}>
          <div className={styles.emptyIcon}>♥</div>
          <h3 className={styles.emptyTitle}>Your Wishlist is Empty</h3>
          <p className={styles.emptyDesc}>Save items you love to revisit them later. Create your ultimate collection.</p>
          <Link to="/collections" className={styles.actionBtn} style={{ textDecoration: 'none', marginTop: '20px' }}>
            Discover Pieces
          </Link>
        </motion.div>
      ) : (
        <motion.div variants={itemVariants} className={styles.productGrid}>
          <AnimatePresence>
            {items.map(item => {
              const product = item.products;
              if (!product) return null;
              
              const imageUrl = product.image_url || 'https://via.placeholder.com/400x500/111/fff?text=No+Image';

              return (
                <motion.div 
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.3 } }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className={styles.productCard}
                >
                  <Link to={`/product/${product.slug}`} className={styles.productImageWrapper}>
                    <img src={imageUrl} alt={product.name} className={styles.productImage} />
                    <div style={{ position: 'absolute', top: '15px', right: '15px', background: '#fff', color: '#000', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                      <span style={{ fontSize: '1.2rem', marginTop: '2px' }}>♥</span>
                    </div>
                  </Link>
                  <div className={styles.productInfo}>
                    <div>
                      <h3 className={styles.productName}>{product.name}</h3>
                      <p className={styles.productPrice}>${product.price.toFixed(2)}</p>
                    </div>
                    <div className={styles.productActions}>
                      <button onClick={() => handleMoveToCart(item, product)} className={styles.actionBtn} style={{ padding: '12px', fontSize: '0.75rem', flex: 1 }}>Move To Cart</button>
                      <button onClick={() => handleRemove(item.id)} className={styles.secondaryBtn} style={{ padding: '12px', fontSize: '0.75rem', borderColor: 'transparent', color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.05)' }}>Remove</button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Wishlist;
