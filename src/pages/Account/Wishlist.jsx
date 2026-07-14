import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
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
      await removeFromWishlist(itemId);
      await loadWishlist();
    } catch (err) {
      alert('Failed to remove item');
    }
  };

  const handleMoveToCart = async (item, product) => {
    addToCart(product);
    await handleRemove(item.id);
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Wishlist</h1>
        <p className={styles.pageSubtitle}>Curate your favorite pieces.</p>
      </div>

      {isLoading ? (
        <div style={{ padding: '40px', color: 'rgba(255,255,255,0.5)' }}>LOADING WISHLIST...</div>
      ) : items.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>♥</div>
          <h3 className={styles.emptyTitle}>Your Wishlist is Empty</h3>
          <p className={styles.emptyDesc}>Save items you love to revisit them later.</p>
          <Link to="/collections" className={styles.actionBtn} style={{ textDecoration: 'none' }}>
            Discover Pieces
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '30px' }}>
          {items.map(item => {
            const product = item.products;
            if (!product) return null;
            
            const imageUrl = product.images?.[0]?.image_url || 'https://via.placeholder.com/400x500/111/fff?text=No+Image';

            return (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
              >
                <Link to={`/product/${product.slug}`} style={{ display: 'block', position: 'relative', background: '#111', aspectRatio: '3/4' }}>
                  <img src={imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </Link>
                <div>
                  <h3 style={{ fontSize: '0.85rem', letterSpacing: '0.1em', marginBottom: '5px' }}>{product.name}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: '15px' }}>${product.price.toFixed(2)}</p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => handleMoveToCart(item, product)} className={styles.actionBtn} style={{ padding: '10px', fontSize: '0.7rem', flex: 1 }}>Move To Cart</button>
                    <button onClick={() => handleRemove(item.id)} className={styles.secondaryBtn} style={{ padding: '10px', fontSize: '0.7rem', borderColor: 'transparent', color: '#ef4444' }}>Remove</button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
