import React from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiShoppingBag } from 'react-icons/fi';
import { formatINR } from '../../utils/currency';
import styles from './MobileProductCard.module.css';

const MobileProductCard = ({ isInWishlist, isWishlistLoading, onQuickAdd, onToggleWishlist, product }) => {
  const totalStock = product.variants?.reduce((total, variant) => total + Math.max(0, Number(variant.stock) || 0), 0);
  const hasStockData = Array.isArray(product.variants) && product.variants.length > 0;
  const isSoldOut = hasStockData && totalStock === 0;

  return (
    <article className={styles.card}>
      <div className={styles.imageFrame}>
        <Link to={`/product/${product.slug}`} className={styles.imageLink} aria-label={`View ${product.name}`}>
          <img src={product.image_url} alt={product.name} loading="lazy" />
        </Link>
        <button
          type="button"
          className={`${styles.wishlistButton} ${isInWishlist ? styles.wishlistActive : ''}`}
          onClick={onToggleWishlist}
          disabled={isWishlistLoading}
          aria-label={isInWishlist ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          aria-pressed={isInWishlist}
        >
          <FiHeart aria-hidden="true" />
        </button>
        {isSoldOut && <span className={styles.stockBadge}>Sold out</span>}
      </div>

      <div className={styles.info}>
        <Link to={`/product/${product.slug}`} className={styles.name}>{product.name}</Link>
        <div className={styles.meta}>
          <span className={styles.price}>{formatINR(product.price)}</span>
          {!isSoldOut && (
            <button type="button" className={styles.quickAdd} onClick={onQuickAdd} aria-label={`Quick add ${product.name}`}>
              <FiShoppingBag aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

export default MobileProductCard;
