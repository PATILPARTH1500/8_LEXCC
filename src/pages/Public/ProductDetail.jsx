import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import styles from './Shop.module.css';
import accountStyles from '../Account/Account.module.css';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1200&auto=format&fit=crop';

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, wishlistItems, addToWishlist, removeFromWishlist } = useAuth();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [activeImage, setActiveImage] = useState('');
  
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [cartSuccess, setCartSuccess] = useState(false);
  
  const [imageLoading, setImageLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*, variants:product_variants(size, color, stock)')
          .eq('slug', slug)
          .single();
          
        if (error) throw error;
        setProduct(data);
        if (data?.image_url) {
          setActiveImage(data.image_url);
        } else {
          setActiveImage(DEFAULT_IMAGE);
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
    
    const variant = product.variants?.find(v => v.size === selectedSize);
    addToCart(product, variant || { size: selectedSize });
    
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

  const totalStock = product.variants?.reduce((sum, v) => sum + v.stock, 0) || 0;
  const uniqueSizes = [...new Set(product.variants?.map(v => v.size))].filter(Boolean);
  
  const displayImages = product.image_url ? [product.image_url, DEFAULT_IMAGE] : [DEFAULT_IMAGE, DEFAULT_IMAGE];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      style={{ position: 'relative', minHeight: '100vh', background: 'var(--secondary-color, #0a0a0a)', overflow: 'hidden' }}
    >
      {/* Dashboard Style Oversized Typography */}
      <AnimatePresence mode="wait">
        <motion.div
          key="PRODUCT"
          className={accountStyles.bgTextAccount}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
          PRODUCT
        </motion.div>
      </AnimatePresence>

      <div className={styles.pdpContainer} style={{ position: 'relative', zIndex: 1, paddingTop: '140px', paddingBottom: '100px', maxWidth: '1600px', margin: '0 auto' }}>
        
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
          <div className={styles.mainImageContainer} style={{ borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
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
                  style={{ opacity: imageLoading ? 0 : 1 }}
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Right Side: Product Info */}
        <div className={styles.infoSection}>
          <div className={accountStyles.card} style={{ padding: '50px', margin: 0 }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
              <h1 style={{ fontSize: '2.5rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '15px', fontFamily: 'var(--font-heading)', fontWeight: 300, color: '#fff' }}>{product.name}</h1>
              <p style={{ fontSize: '1.4rem', color: 'var(--accent-color, #D4AF37)', letterSpacing: '0.05em', marginBottom: '30px', fontWeight: 300 }}>${product.price.toFixed(2)}</p>
              
              <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.6)', lineHeight: '1.8', letterSpacing: '0.05em', marginBottom: '40px' }}>{product.description}</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} style={{ marginBottom: '40px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '0.8rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                <span style={{ color: '#fff' }}>Size</span>
                <span style={{ color: 'rgba(255,255,255,0.4)', cursor: 'pointer', transition: 'color 0.3s' }} onMouseOver={e=>e.currentTarget.style.color='#fff'} onMouseOut={e=>e.currentTarget.style.color='rgba(255,255,255,0.4)'}>Size Guide</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                {uniqueSizes.map(size => (
                  <motion.button 
                    key={size} 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{ 
                      flex: '1 0 calc(33.333% - 10px)',
                      padding: '16px',
                      background: 'transparent',
                      color: selectedSize === size ? 'var(--accent-color, #D4AF37)' : '#fff',
                      border: `1px solid ${selectedSize === size ? 'var(--accent-color, #D4AF37)' : 'rgba(255,255,255,0.2)'}`,
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      letterSpacing: '0.1em',
                      transition: 'all 0.3s',
                    }}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </motion.button>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}>
              {/* Inventory Status */}
              {totalStock > 0 && totalStock <= 5 ? (
                <div style={{ marginBottom: '20px', display: 'inline-block', padding: '6px 12px', background: 'rgba(212,175,55,0.1)', color: 'var(--accent-color, #D4AF37)', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Only {totalStock} Left</div>
              ) : totalStock === 0 ? (
                <div style={{ marginBottom: '20px', display: 'inline-block', padding: '6px 12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Out Of Stock</div>
              ) : null}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '15px' }}>
                <motion.button 
                  whileHover={totalStock > 0 ? { scale: 1.02 } : {}}
                  whileTap={totalStock > 0 ? { scale: 0.98 } : {}}
                  className={styles.primaryBtn} 
                  disabled={totalStock === 0 || isAddingToCart}
                  onClick={handleAddToCart}
                  style={{ flex: 1, position: 'relative', overflow: 'hidden', padding: '20px', background: cartSuccess ? '#22c55e' : '#fff', color: cartSuccess ? '#fff' : '#000', borderColor: cartSuccess ? '#22c55e' : '#fff', fontSize: '0.85rem' }}
                >
                  <AnimatePresence mode="wait">
                    {isAddingToCart ? (
                      <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>ADDING...</motion.span>
                    ) : cartSuccess ? (
                      <motion.span key="success" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>ADDED TO CART ✓</motion.span>
                    ) : (
                      <motion.span key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{totalStock === 0 ? 'SOLD OUT' : 'ADD TO CART'}</motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
                
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={styles.wishlistBtn} 
                  onClick={toggleWishlist}
                  disabled={isWishlistLoading}
                  style={isInWishlist ? { background: '#fff', color: '#000', borderColor: '#fff', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' } : { width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                >
                  <span style={{ fontSize: '1.4rem' }}>{isInWishlist ? '♥' : '♡'}</span>
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
    </motion.div>
  );
};

export default ProductDetail;
