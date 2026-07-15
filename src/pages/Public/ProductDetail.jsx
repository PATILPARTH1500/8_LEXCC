import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Shop.module.css';

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, addToWishlist, fetchWishlist, removeFromWishlist } = useAuth();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [activeImage, setActiveImage] = useState('');
  
  const [wishlistItems, setWishlistItems] = useState([]);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);

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
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProduct();
  }, [slug]);

  useEffect(() => {
    if (user) {
      fetchWishlist().then(data => setWishlistItems(data || []));
    }
  }, [user]);

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
      const data = await fetchWishlist();
      setWishlistItems(data || []);
    } catch (err) {
      alert(err.message || 'Failed to update wishlist');
    } finally {
      setIsWishlistLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!selectedSize && uniqueSizes.length > 0) {
      alert('Please select a size');
      return;
    }
    const variant = product.variants?.find(v => v.size === selectedSize);
    addToCart(product, variant || { size: selectedSize });
  };

  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>LOADING...</div>;
  if (!product) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>PRODUCT NOT FOUND</div>;

  const totalStock = product.variants?.reduce((sum, v) => sum + v.stock, 0) || 0;
  const uniqueSizes = [...new Set(product.variants?.map(v => v.size))].filter(Boolean);
  const displayImages = product.image_url ? [product.image_url] : ['https://via.placeholder.com/1200x1600/111/fff?text=No+Image'];

  return (
    <div className={styles.pdpContainer}>
      
      {/* Left Side: Gallery */}
      <div className={styles.gallerySection}>
        <div className={styles.thumbnailList}>
          {displayImages.map((img, idx) => (
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
          <img src={activeImage || displayImages[0]} alt={product.name} className={styles.mainImage} />
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
            {uniqueSizes.map(size => (
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
        {totalStock > 0 && totalStock <= 5 ? (
          <span className={`${styles.inventoryBadge} ${styles.inventoryWarning}`}>Only {totalStock} Left</span>
        ) : totalStock === 0 ? (
          <span className={`${styles.inventoryBadge} ${styles.inventoryOut}`}>Out Of Stock</span>
        ) : (
          <span className={styles.inventoryBadge}>In Stock</span>
        )}

        {/* Actions */}
        <div className={styles.actionRow}>
          <button 
            className={styles.primaryBtn} 
            disabled={totalStock === 0}
            onClick={handleAddToCart}
          >
            {totalStock === 0 ? 'SOLD OUT' : 'ADD TO CART'}
          </button>
          <button 
            className={styles.wishlistBtn} 
            onClick={toggleWishlist}
            disabled={isWishlistLoading}
            style={isInWishlist ? { background: '#fff', color: '#000', borderColor: '#fff' } : {}}
          >
            <span style={{ fontSize: '1.2rem' }}>{isInWishlist ? '♥' : '♡'}</span>
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
