import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import styles from '../../pages/Public/Shop.module.css';
import { formatINR } from '../../utils/currency';

const ProductCard = ({ product }) => {
  const { user, wishlistItems, addToWishlist, removeFromWishlist } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  
  const [loadingWishlist, setLoadingWishlist] = useState(false);
  
  const isInWishlist = wishlistItems?.some(i => i.product_id === product.id) || false;

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
      } else {
        await addToWishlist(product.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingWishlist(false);
    }
  };

  return (
    <div className={`${styles.productCard} will-change-transform`}>
      <Link to={`/product/${product.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className={styles.imageContainer}>
          <img src={product.image_url} alt={product.name} className={styles.productImage} />
          
          <button 
            className={styles.quickAddBtn}
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              const availableVariants = product.variants?.filter((variant) => variant.stock > 0) || [];
              if ((product.variants?.length || 0) > 0 && availableVariants.length !== 1) {
                navigate(`/product/${product.slug}`);
                return;
              }
              try {
                await addToCart(product, availableVariants[0] || null);
              } catch (error) {
                console.error('Unable to add product to cart:', error);
              }
            }}
          >
            QUICK ADD
          </button>

          <button 
            onClick={toggleWishlist}
            disabled={loadingWishlist}
            aria-label={isInWishlist ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
            className={`${styles.wishlistFloatingBtn} ${isInWishlist ? styles.wishlistFloatingBtnActive : ''}`}
          >
            <span style={{ fontSize: '1rem', marginTop: '2px' }}>{isInWishlist ? '♥' : '♡'}</span>
          </button>

        </div>
        <div className={styles.productInfo}>
          <div>
            <h3 className={styles.productName}>{product.name}</h3>
            <p className={styles.productPrice}>{formatINR(product.price)}</p>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
