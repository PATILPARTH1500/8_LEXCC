import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import styles from './Shop.module.css';
import accountStyles from '../Account/Account.module.css';
import ProductCard from '../../components/shop/ProductCard';
import { formatINR } from '../../utils/currency';
import SEO from '../../components/common/SEO';
import MobileProductDetailView from '../../components/mobile/MobileProductDetailView';
import { useResponsive } from '../../contexts/ResponsiveContext';
import { getSizingSystem, formatDisplaySize, getSizeLabel, getSizesForSystem } from '../../utils/sizing';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1200&auto=format&fit=crop';

const ProductDetail = () => {
  const { isMobile } = useResponsive();
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, wishlistItems, addToWishlist, removeFromWishlist } = useAuth();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [activeImage, setActiveImage] = useState('');
  const [relatedProducts, setRelatedProducts] = useState([]);
  
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [cartSuccess, setCartSuccess] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  
  const [imageLoading, setImageLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*, category:categories(name, slug), variants:product_variants(id, size, color, stock)')
          .eq('slug', slug)
          .single();
          
        if (error) throw error;
        setProduct(data);
        if (data?.image_url) {
          setActiveImage(data.image_url);
        } else {
          setActiveImage(DEFAULT_IMAGE);
        }
        
        if (data?.variants?.length > 0) {
          setSelectedColor(data.variants[0].color);
        }
        
        if (data?.category_id) {
          const { data: related } = await supabase
            .from('products')
            .select('*')
            .eq('category_id', data.category_id)
            .neq('id', data.id)
            .limit(4);
          if (related) setRelatedProducts(related);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProduct();
  }, [slug]);

  const isInWishlist = product ? wishlistItems.some(item => item.product_id === product.id) : false;
  
  const toggleWishlist = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    setIsWishlistLoading(true);
    try {
      if (isInWishlist) {
        const item = wishlistItems.find(i => i.product_id === product.id);
        if (item) await removeFromWishlist(item.id);
      } else {
        await addToWishlist(product.id);
      }
    } catch (err) {
      alert(err.message || 'Failed to update wishlist');
    } finally {
      setIsWishlistLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!selectedSize && uniqueSizes.length > 0) {
      alert('Please select a size');
      return;
    }
    
    setIsAddingToCart(true);
    
    // Simulate slight delay for premium feel
    await new Promise(r => setTimeout(r, 600));
    
    const variant = product.variants?.find(v => v.size === selectedSize && v.color === selectedColor);
    addToCart(product, variant || { size: selectedSize, color: selectedColor });
    
    setIsAddingToCart(false);
    setCartSuccess(true);
    
    setTimeout(() => {
      setCartSuccess(false);
    }, 2000);
  };

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', background: '#0a0a0a' }}>
        <motion.div 
          animate={{ opacity: [0.3, 1, 0.3] }} 
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          style={{ letterSpacing: '0.2em', textTransform: 'uppercase', fontSize: '0.85rem' }}
        >
          Curating...
        </motion.div>
      </div>
    );
  }
  
  if (!product) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', background: '#0a0a0a' }}>
      <p style={{ letterSpacing: '0.1em', textTransform: 'uppercase' }}>PRODUCT NOT FOUND</p>
    </div>
  );

  const uniqueColors = [...new Set(product.variants?.map(v => v.color))].filter(Boolean);
  const variantsForColor = product.variants?.filter(v => v.color === selectedColor) || [];
  const totalStock = variantsForColor.reduce((sum, v) => sum + v.stock, 0) || 0;
  
  const system = getSizingSystem(product?.category?.slug);
  const isFootwear = system === 'FOOTWEAR';
  const displaySize = (sizeStr) => formatDisplaySize(sizeStr, system);
  
  const validSizes = getSizesForSystem(system);
  const uniqueSizes = [...new Set(variantsForColor.map(v => v.size))].filter(s => Boolean(s) && validSizes.includes(s));
  
  const displayImages = product.image_url ? [product.image_url, DEFAULT_IMAGE] : [DEFAULT_IMAGE, DEFAULT_IMAGE];

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description,
    "image": product.image_url || DEFAULT_IMAGE,
    "brand": {
      "@type": "Brand",
      "name": "LEXCC"
    },
    "offers": {
      "@type": "Offer",
      "url": `https://lexcc.in/product/${product.slug}`,
      "priceCurrency": "INR",
      "price": product.price,
      "availability": totalStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
    }
  };

  if (isMobile) {
    return (
      <MobileProductDetailView
        activeImage={activeImage}
        cartSuccess={cartSuccess}
        displayImages={displayImages}
        imageLoading={imageLoading}
        isAddingToCart={isAddingToCart}
        isInWishlist={isInWishlist}
        isWishlistLoading={isWishlistLoading}
        onAddToCart={handleAddToCart}
        onImageLoad={() => setImageLoading(false)}
        onSelectColor={(color) => {
          setSelectedColor(color);
          setSelectedSize('');
        }}
        onSelectImage={(image) => {
          if (activeImage !== image) {
            setImageLoading(true);
            setActiveImage(image);
          }
        }}
        onSelectSize={setSelectedSize}
        onToggleWishlist={toggleWishlist}
        product={product}
        productSchema={productSchema}
        relatedProducts={relatedProducts}
        selectedColor={selectedColor}
        selectedSize={selectedSize}
        totalStock={totalStock}
        uniqueColors={uniqueColors}
        uniqueSizes={uniqueSizes}
        variantsForColor={variantsForColor}
        isFootwear={isFootwear}
        displaySize={displaySize}
        onShowSizeGuide={() => setShowSizeGuide(true)}
      />
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      style={{ position: 'relative', minHeight: '100vh', background: 'var(--primary-color, #0a0a0a)', overflow: 'hidden' }}
    >
      <SEO 
        title={product.name} 
        description={product.description}
        image={product.image_url || DEFAULT_IMAGE}
        url={`https://lexcc.in/product/${product.slug}`}
        schema={productSchema}
      />
      <div className={accountStyles.accountBackground}>
        <div className={accountStyles.noiseOverlay} />
        <div className={accountStyles.radialGlow} />
      </div>

      {/* Dashboard Style Oversized Typography */}
      <AnimatePresence mode="wait">
        <motion.div
          key={product?.category?.name || "PRODUCT"}
          className={accountStyles.bgTextAccount}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          style={{ top: '120px' }}
        >
          {product?.category?.name || "PRODUCT"}
        </motion.div>
      </AnimatePresence>

      <div className={`${styles.pdpContainer} ${styles.pdpLayoutContainer}`}>
        
        {/* Left Side: Gallery */}
        <div className={styles.gallerySection}>
          <div className={styles.thumbnailList}>
            {displayImages.map((img, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ opacity: 1 }}
                className={`${styles.thumbnail} ${activeImage === img ? styles.thumbnailActive : ''}`} 
                onClick={() => {
                  if (activeImage !== img) {
                    setImageLoading(true);
                    setActiveImage(img);
                  }
                }}
                style={{ borderRadius: '4px', overflow: 'hidden', border: activeImage === img ? '1px solid var(--accent-color, #D4AF37)' : '1px solid rgba(255,255,255,0.05)' }}
              >
                <img src={img} alt={`Thumbnail ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </motion.div>
            ))}
          </div>
          <div className={styles.mainImageContainer} style={{ borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.5)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeImage}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
              >
                {imageLoading && (
                  <div style={{ position: 'absolute', inset: 0, background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <motion.div animate={{ opacity: [0.2, 0.5, 0.2] }} transition={{ repeat: Infinity, duration: 1.5 }} style={{ width: '100%', height: '100%', background: 'linear-gradient(90deg, #111, #1a1a1a, #111)' }} />
                  </div>
                )}
                <motion.img 
                  src={activeImage} 
                  alt={product.name} 
                  className={styles.mainImage}
                  onLoad={() => setImageLoading(false)}
                  style={{ opacity: imageLoading ? 0 : 1, cursor: 'zoom-in' }}
                  whileHover={{ scale: 1.5 }}
                  onMouseMove={(e) => {
                    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
                    const x = ((e.clientX - left) / width) * 100;
                    const y = ((e.clientY - top) / height) * 100;
                    e.currentTarget.style.transformOrigin = `${x}% ${y}%`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transformOrigin = 'center center';
                  }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Right Side: Product Info */}
        <div className={styles.infoSection}>
          <div className={`${accountStyles.card} ${styles.pdpInfoCard}`} style={{ margin: 0, transform: 'none' }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                <h1 className={styles.pdpTitle}>{product.name}</h1>
              </div>
              <p className={styles.pdpPrice}>{formatINR(product.price)}</p>
              
              <div style={{ height: '1px', width: '100%', background: 'linear-gradient(90deg, rgba(255,255,255,0.1), transparent)', marginBottom: '35px' }} />
              
              <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.6)', lineHeight: '1.8', letterSpacing: '0.05em', marginBottom: '45px', fontWeight: 300 }}>{product.description}</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} style={{ marginBottom: '45px' }}>
              {/* Color Selection */}
              {uniqueColors.length > 0 && (
                <div style={{ marginBottom: '35px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>
                    <span>Color</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                    {uniqueColors.map(color => (
                      <motion.button 
                        key={color} 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        style={{ 
                          padding: '12px 24px',
                          background: selectedColor === color ? 'rgba(212,175,55,0.05)' : 'transparent',
                          color: selectedColor === color ? 'var(--accent-color, #D4AF37)' : '#fff',
                          border: `1px solid ${selectedColor === color ? 'var(--accent-color, #D4AF37)' : 'rgba(255,255,255,0.1)'}`,
                          boxShadow: selectedColor === color ? '0 0 15px rgba(212,175,55,0.15)' : 'none',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                        onClick={() => { setSelectedColor(color); setSelectedSize(''); }}
                      >
                        {color}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Size Selection */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>{getSizeLabel(system)}</span>
                <span 
                  style={{ color: 'rgba(255,255,255,0.3)', cursor: 'pointer', transition: 'color 0.4s ease' }} 
                  onMouseOver={e=>e.currentTarget.style.color='#fff'} 
                  onMouseOut={e=>e.currentTarget.style.color='rgba(255,255,255,0.3)'}
                  onClick={() => setShowSizeGuide(true)}
                >
                  Size Guide
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                {uniqueSizes.map(size => {
                  const variant = variantsForColor.find(v => v.size === size);
                  const isOutOfStock = !variant || variant.stock <= 0;
                  
                  return (
                    <motion.button 
                      key={size} 
                      disabled={isOutOfStock}
                      whileHover={!isOutOfStock ? { scale: 1.02 } : {}}
                      whileTap={!isOutOfStock ? { scale: 0.98 } : {}}
                      style={{ 
                        flex: '1 0 calc(33.333% - 8px)',
                        padding: '14px',
                        background: selectedSize === size ? 'rgba(212,175,55,0.05)' : 'transparent',
                        color: isOutOfStock ? 'rgba(255,255,255,0.2)' : selectedSize === size ? 'var(--accent-color, #D4AF37)' : '#fff',
                        border: `1px solid ${selectedSize === size ? 'var(--accent-color, #D4AF37)' : 'rgba(255,255,255,0.1)'}`,
                        boxShadow: selectedSize === size ? '0 0 15px rgba(212,175,55,0.15)' : 'none',
                        cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                        fontSize: '0.85rem',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                        textDecoration: isOutOfStock ? 'line-through' : 'none',
                      }}
                      onClick={() => setSelectedSize(size)}
                    >
                      {displaySize(size)}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}>
              {/* Inventory Status */}
              <div style={{ minHeight: '30px', marginBottom: '15px' }}>
                <AnimatePresence mode="wait">
                  {totalStock > 0 && totalStock <= 5 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'inline-block', padding: '6px 12px', background: 'rgba(212,175,55,0.1)', color: 'var(--accent-color, #D4AF37)', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '2px' }}>Only {totalStock} Left</motion.div>
                  ) : totalStock === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'inline-block', padding: '6px 12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '2px' }}>Out Of Stock</motion.div>
                  ) : null}
                </AnimatePresence>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '15px' }}>
                <motion.button 
                  whileHover={totalStock > 0 ? { scale: 1.01 } : {}}
                  whileTap={totalStock > 0 ? { scale: 0.99 } : {}}
                  className={styles.primaryBtn} 
                  disabled={totalStock === 0 || isAddingToCart}
                  onClick={handleAddToCart}
                  style={{ 
                    flex: 1, 
                    position: 'relative', 
                    overflow: 'hidden', 
                    padding: '20px', 
                    background: cartSuccess ? '#22c55e' : '#fff', 
                    color: cartSuccess ? '#fff' : '#000', 
                    borderColor: cartSuccess ? '#22c55e' : '#fff', 
                    fontSize: '0.85rem',
                    letterSpacing: '0.15em',
                    boxShadow: cartSuccess ? '0 0 20px rgba(34, 197, 94, 0.4)' : '0 10px 20px rgba(255,255,255,0.1)',
                    transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                >
                  <AnimatePresence mode="wait">
                    {isAddingToCart ? (
                      <motion.span key="loading" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ display: 'block' }}>ADDING...</motion.span>
                    ) : cartSuccess ? (
                      <motion.span key="success" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ display: 'block' }}>ADDED TO CART ✓</motion.span>
                    ) : (
                      <motion.span key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'block' }}>{totalStock === 0 ? 'SOLD OUT' : 'ADD TO CART'}</motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
                
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={styles.wishlistBtn} 
                  onClick={toggleWishlist}
                  disabled={isWishlistLoading}
                  style={isInWishlist ? { background: '#fff', color: '#000', borderColor: '#fff', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 20px rgba(255,255,255,0.1)' } : { width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, background: 'rgba(255,255,255,0.02)' }}
                >
                  <span style={{ fontSize: '1.4rem', marginTop: '2px' }}>{isInWishlist ? '♥' : '♡'}</span>
                </motion.button>
              </div>
            </motion.div>

            {/* Accordions */}
            <motion.div style={{ marginTop: '50px' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }}>
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <button style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: '20px 0', background: 'transparent', border: 'none', color: '#fff', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}>
                  <span>Product Details</span>
                  <span>+</span>
                </button>
              </div>
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <button style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: '20px 0', background: 'transparent', border: 'none', color: '#fff', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}>
                  <span>Shipping & Returns</span>
                  <span>+</span>
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      
      {relatedProducts.length > 0 && (
        <div style={{ padding: '80px 20px', maxWidth: '1600px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
            <h2 style={{ fontSize: '2rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 300, color: '#fff' }}>Related Pieces</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '20px' }}>
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* Size Guide Modal */}
      <AnimatePresence>
        {showSizeGuide && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}
            onClick={() => setShowSizeGuide(false)}
          >
            <motion.div 
              initial={{ y: 20, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              exit={{ y: 20, opacity: 0 }}
              style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', padding: '40px', maxWidth: '400px', width: '90%', position: 'relative' }}
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowSizeGuide(false)} 
                style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                &times;
              </button>
              <h3 style={{ fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '20px', color: '#fff' }}>Size Guide</h3>
              
              {isFootwear ? (
                <table style={{ width: '100%', color: '#fff', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                      <th style={{ textAlign: 'left', padding: '10px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>UK Size</th>
                      <th style={{ textAlign: 'right', padding: '10px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Foot Length Approx.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { size: '5', length: '24 cm' },
                      { size: '6', length: '25 cm' },
                      { size: '7', length: '26 cm' },
                      { size: '8', length: '27 cm' },
                      { size: '9', length: '28 cm' },
                      { size: '10', length: '29 cm' },
                      { size: '11', length: '30 cm' },
                      { size: '12', length: '31 cm' },
                    ].map(row => (
                      <tr key={row.size} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '10px 0' }}>{row.size}</td>
                        <td style={{ padding: '10px 0', textAlign: 'right', color: 'rgba(255,255,255,0.6)' }}>{row.length}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                  <p>Fit measurements will be updated once official LEXCC measurements are finalized.</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ProductDetail;
