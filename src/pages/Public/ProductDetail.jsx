import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import styles from './Shop.module.css';

const ProductDetail = () => {
  const { slug } = useParams();
  const [selectedSize, setSelectedSize] = useState('');
  
  // Mock data based on slug
  const product = {
    name: slug ? slug.replace(/-/g, ' ').toUpperCase() : 'HEAVYWEIGHT OVERSIZED HOODIE',
    price: 250,
    description: "Crafted from 500gsm brushed French terry cotton. Features a relaxed, dropped shoulder silhouette with subtle distressing at the cuffs and hem. The perfect everyday piece to elevate your casual uniform.",
    images: [
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=1200&auto=format&fit=crop', // normally different angles
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=1200&auto=format&fit=crop'
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    stock: 3 // 'Only 3 Left' state
  };

  const [activeImage, setActiveImage] = useState(product.images[0]);

  return (
    <div className={styles.pdpContainer}>
      
      {/* Left Side: Gallery */}
      <div className={styles.gallerySection}>
        <div className={styles.thumbnailList}>
          {product.images.map((img, idx) => (
            <img 
              key={idx} 
              src={img} 
              alt={`Thumbnail ${idx}`} 
              className={`${styles.thumbnail} ${activeImage === img ? styles.thumbnailActive : ''}`} 
              onClick={() => setActiveImage(img)}
            />
          ))}
        </div>
        <div className={styles.mainImageContainer}>
          <img src={activeImage} alt={product.name} className={styles.mainImage} />
        </div>
      </div>

      {/* Right Side: Product Info */}
      <div className={styles.infoSection}>
        <h1 className={styles.pdpTitle}>{product.name}</h1>
        <p className={styles.pdpPrice}>${product.price.toFixed(2)}</p>
        
        <p className={styles.pdpDescription}>{product.description}</p>

        <div className={styles.variantSection}>
          <div className={styles.variantLabel}>
            <span>Size</span>
            <span style={{ color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>Size Guide</span>
          </div>
          <div className={styles.sizeGrid}>
            {product.sizes.map(size => (
              <button 
                key={size} 
                className={`${styles.sizeBtn} ${selectedSize === size ? styles.sizeBtnActive : ''}`}
                onClick={() => setSelectedSize(size)}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Inventory Status */}
        {product.stock > 0 && product.stock <= 5 ? (
          <span className={`${styles.inventoryBadge} ${styles.inventoryWarning}`}>Only {product.stock} Left</span>
        ) : product.stock === 0 ? (
          <span className={`${styles.inventoryBadge} ${styles.inventoryOut}`}>Out Of Stock</span>
        ) : (
          <span className={styles.inventoryBadge}>In Stock</span>
        )}

        {/* Actions */}
        <div className={styles.actionRow}>
          <button className={styles.primaryBtn} disabled={product.stock === 0}>
            {product.stock === 0 ? 'SOLD OUT' : 'ADD TO CART'}
          </button>
          <button className={styles.wishlistBtn}>
            <span style={{ fontSize: '1.2rem' }}>♡</span>
          </button>
        </div>

        {/* Accordions */}
        <div className={styles.accordion}>
          <div className={styles.accordionItem}>
            <button className={styles.accordionHeader}>
              <span>Product Details</span>
              <span>+</span>
            </button>
          </div>
          <div className={styles.accordionItem}>
            <button className={styles.accordionHeader}>
              <span>Shipping & Returns</span>
              <span>+</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ProductDetail;
