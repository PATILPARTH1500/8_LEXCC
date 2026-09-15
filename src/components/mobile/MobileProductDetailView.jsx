import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { FiHeart } from 'react-icons/fi';
import ProductCard from '../shop/ProductCard';
import SEO from '../common/SEO';
import { formatINR } from '../../utils/currency';
import styles from './MobileProductDetailView.module.css';

const MobileProductDetailView = ({
  activeImage,
  cartSuccess,
  displayImages,
  imageLoading,
  isAddingToCart,
  isInWishlist,
  isWishlistLoading,
  onAddToCart,
  onImageLoad,
  onSelectColor,
  onSelectImage,
  onSelectSize,
  onToggleWishlist,
  product,
  productSchema,
  relatedProducts,
  selectedColor,
  selectedSize,
  totalStock,
  uniqueColors,
  uniqueSizes,
  variantsForColor,
  isFootwear,
  displaySize,
  onShowSizeGuide,
}) => {
  const reduceMotion = useReducedMotion();

  return (
    <main className={styles.page} id="main-content">
      <SEO
        title={product.name}
        description={product.description}
        image={product.image_url || activeImage}
        url={`https://lexcc.in/product/${product.slug}`}
        schema={productSchema}
      />

      <motion.article
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reduceMotion ? 0 : 0.4 }}
      >
        <section className={styles.gallery} aria-label={`${product.name} gallery`}>
          <div className={styles.imageFrame} style={{ background: '#0a0a0a', position: 'relative' }}>
            <AnimatePresence mode="wait">
              {activeImage ? (
                <motion.img
                  key={activeImage}
                  src={activeImage}
                  alt={product.name}
                  initial={reduceMotion ? false : { opacity: 0.25 }}
                  animate={{ opacity: imageLoading ? 0.25 : 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.3 }}
                  onLoad={onImageLoad}
                />
              ) : (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)' }}
                >
                  <div style={{ fontSize: '1.5rem', letterSpacing: '0.2em', marginBottom: '10px' }}>LEXCC</div>
                  <div style={{ fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Image Coming Soon</div>
                </motion.div>
              )}
            </AnimatePresence>
            {imageLoading && activeImage && <span className={styles.imageState}>Loading image…</span>}
          </div>
          {displayImages.length > 1 && (
            <div className={styles.thumbnails} aria-label="Choose product image">
              {displayImages.map((image, index) => (
                <button
                  type="button"
                  key={`${image}-${index}`}
                  className={activeImage === image ? styles.thumbnailActive : styles.thumbnail}
                  aria-label={`View image ${index + 1}`}
                  aria-pressed={activeImage === image}
                  onClick={() => onSelectImage(image)}
                >
                  <img src={image} alt="" />
                </button>
              ))}
            </div>
          )}
        </section>

        <section className={styles.info}>
          <header className={styles.productHeader}>
            <p>LEXCC / Essential</p>
            <h1>{product.name}</h1>
            <strong>{formatINR(product.price)}</strong>
          </header>

          {product.description && <p className={styles.description}>{product.description}</p>}

          {uniqueColors.length > 0 && (
            <fieldset className={styles.optionGroup}>
              <legend>Color <span>{selectedColor}</span></legend>
              <div className={styles.colorOptions}>
                {uniqueColors.map((color) => (
                  <button
                    type="button"
                    key={color}
                    className={selectedColor === color ? styles.optionActive : styles.option}
                    aria-pressed={selectedColor === color}
                    onClick={() => onSelectColor(color)}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <fieldset className={styles.optionGroup}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <legend>Size <span>{selectedSize ? displaySize(selectedSize) : 'Select one'}</span></legend>
              <button 
                type="button" 
                onClick={onShowSizeGuide} 
                style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', textDecoration: 'underline', fontSize: '0.75rem', padding: 0 }}
              >
                Size Guide
              </button>
            </div>
            {uniqueSizes.length > 0 ? (
              <div className={styles.sizeOptions} style={isFootwear ? { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' } : {}}>
                {uniqueSizes.map((size) => {
                  const variant = variantsForColor.find(v => v.size === size);
                  const isOutOfStock = !variant || variant.stock <= 0;
                  return (
                    <button
                      type="button"
                      key={size}
                      disabled={isOutOfStock}
                      style={{ 
                        opacity: isOutOfStock ? 0.3 : 1, 
                        textDecoration: isOutOfStock ? 'line-through' : 'none',
                        ...(isFootwear ? { padding: '12px 4px', minWidth: 0, textAlign: 'center' } : {}) 
                      }}
                      className={selectedSize === size ? styles.optionActive : styles.option}
                      aria-pressed={selectedSize === size}
                      onClick={() => onSelectSize(size)}
                    >
                      {displaySize(size)}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className={styles.unavailable}>No sizes available in this color.</p>
            )}
          </fieldset>

          <div className={styles.inventory} aria-live="polite">
            {totalStock === 0 ? 'Out of stock' : totalStock <= 5 ? `Only ${totalStock} left` : 'In stock'}
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={cartSuccess ? styles.addedButton : styles.addButton}
              disabled={totalStock === 0 || isAddingToCart}
              onClick={onAddToCart}
            >
              {isAddingToCart ? 'Adding…' : cartSuccess ? 'Added to cart ✓' : totalStock === 0 ? 'Sold out' : 'Add to cart'}
            </button>
            <button
              type="button"
              className={isInWishlist ? styles.wishlistActive : styles.wishlist}
              disabled={isWishlistLoading}
              aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
              aria-pressed={isInWishlist}
              onClick={onToggleWishlist}
            >
              <FiHeart aria-hidden="true" />
            </button>
          </div>

          <div className={styles.detailsList}>
            <details>
              <summary>Product details</summary>
              <p>{product.description || 'A considered LEXCC piece made for everyday rotation.'}</p>
            </details>
            <details>
              <summary>Shipping & returns</summary>
              <p>Shipping options and the final delivery estimate are shown during checkout.</p>
            </details>
          </div>
        </section>
      </motion.article>

      {relatedProducts.length > 0 && (
        <section className={styles.related} aria-labelledby="related-products-title">
          <header>
            <p>Continue exploring</p>
            <h2 id="related-products-title">Related pieces</h2>
          </header>
          <div className={styles.relatedGrid}>
            {relatedProducts.map((related) => <ProductCard key={related.id} product={related} />)}
          </div>
        </section>
      )}
    </main>
  );
};

export default MobileProductDetailView;
