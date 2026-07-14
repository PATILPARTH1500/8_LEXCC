import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import styles from '../../pages/Public/Shop.module.css';

const ProductCard = ({ product }) => {
  const [isHovered, setIsHovered] = useState(false);
  const { user, fetchWishlist, addToWishlist, removeFromWishlist } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loadingWishlist, setLoadingWishlist] = useState(false);

  useEffect(() => {
    if (user) {
      fetchWishlist().then(items => {
        setWishlistItems(items || []);
        setIsInWishlist(items?.some(i => i.product_id === product.id) || false);
      });
    }
  }, [user, product.id]);

  const toggleWishlist = async (e) => {
    e.preventDefault(); // Prevent link navigation
    if (!user) {
      navigate('/login');
      return;
    }
    
    setLoadingWishlist(true);
    try {
      if (isInWishlist) {
        const item = wishlistItems.find(i => i.product_id === product.id);
        if (item) await removeFromWishlist(item.id);
        setIsInWishlist(false);
      } else {
        await addToWishlist(product.id);
        setIsInWishlist(true);
      }
      // Refresh state
      const newItems = await fetchWishlist();
      setWishlistItems(newItems || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingWishlist(false);
    }
  };

  return (
    <div 
      className={styles.productCard}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={`/product/${product.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className={styles.imageContainer}>
          <img src={product.image_url} alt={product.name} className={styles.productImage} />
          
          <button 
            className={styles.quickAddBtn}
            style={{ opacity: isHovered ? 1 : 0, pointerEvents: isHovered ? 'auto' : 'none' }}
            onClick={(e) => {
              e.preventDefault();
              addToCart(product);
            }}
          >
            QUICK ADD
          </button>

          <button 
            onClick={toggleWishlist}
            disabled={loadingWishlist}
            style={{
              position: 'absolute',
              top: '15px',
              right: '15px',
              background: isInWishlist ? '#fff' : 'transparent',
              color: isInWishlist ? '#000' : '#fff',
              border: '1px solid #fff',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10,
              transition: 'all 0.3s ease',
              opacity: isInWishlist ? 1 : (isHovered ? 1 : 0)
            }}
          >
            <span style={{ fontSize: '1rem', marginTop: '2px' }}>{isInWishlist ? '♥' : '♡'}</span>
          </button>

        </div>
        <div className={styles.productInfo}>
          <div>
            <h3 className={styles.productName}>{product.name}</h3>
            <p className={styles.productPrice}>${product.price.toFixed(2)}</p>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
