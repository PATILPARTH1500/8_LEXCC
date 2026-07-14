import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../../pages/Public/Shop.module.css';

const ProductCard = ({ product }) => {
  return (
    <div className={styles.productCard}>
      <Link to={`/product/${product.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className={styles.imageContainer}>
          <img src={product.image_url} alt={product.name} className={styles.productImage} />
          <button 
            className={styles.quickAddBtn}
            onClick={(e) => {
              e.preventDefault(); // Prevent navigating to PDP
              // Trigger quick add to cart
              console.log('Quick add to cart:', product.id);
            }}
          >
            Quick Add
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
