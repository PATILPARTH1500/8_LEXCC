import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import FilterSidebar from '../../components/shop/FilterSidebar';
import ProductCard from '../../components/shop/ProductCard';
import { supabase } from '../../lib/supabase';
import CustomSelect from '../../components/ui/CustomSelect';
import styles from './Shop.module.css';
import accountStyles from '../Account/Account.module.css';
import SEO from '../../components/common/SEO';
import MobileCollectionsView from '../../components/mobile/MobileCollectionsView';
import { useResponsive } from '../../contexts/ResponsiveContext';

const Collections = () => {
  const { isMobile } = useResponsive();
  const { category: pathCategory } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  
  const queryCategory = searchParams.get('category');
  const queryFilter = searchParams.get('filter'); // e.g., 'new'

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter & Sort State
  const [filters, setFilters] = useState({});
  const [sortParam, setSortParam] = useState('newest');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Derive active category for background text
  const activeCategory = (pathCategory || queryCategory || '').toLowerCase();
  
  const getBackgroundText = () => {
    if (activeCategory === 'men') return 'MEN';
    if (activeCategory === 'footwear') return 'FOOTWEAR';
    if (activeCategory === 'collections' || location.pathname === '/collections' && !queryCategory) return 'SHOP';
    if (activeCategory) return activeCategory.toUpperCase();
    return 'SHOP';
  };

  const getPageTitle = () => {
    if (queryFilter === 'new') return 'NEW ARRIVALS';
    if (activeCategory === 'men') return 'MENSWEAR';
    if (activeCategory === 'footwear') return 'FOOTWEAR';
    if (activeCategory === 'accessories') return 'ACCESSORIES';
    return 'SHOP ALL';
  };

  // Sync initial filters from URL
  useEffect(() => {
    const initialFilters = {};
    if (activeCategory && activeCategory !== 'collections') {
      initialFilters.category = [activeCategory];
    }
    setFilters(initialFilters);
  }, [activeCategory]);

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sortParam, queryFilter]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const hasVariantFilter = (filters.size && filters.size.length > 0) || (filters.color && filters.color.length > 0);
      const variantJoin = hasVariantFilter ? 'variants:product_variants!inner(id, size, color, stock)' : 'variants:product_variants(id, size, color, stock)';

      let query = supabase
        .from('products')
        .select(`
          *,
          categories!inner(name, slug),
          ${variantJoin}
        `)
        .eq('status', 'active');

      // Category Filter (Inner join on categories table)
      if (filters.category && filters.category.length > 0) {
        query = query.in('categories.slug', filters.category.map(c => c.toLowerCase()));
      }

      // Size Filter (Inner join on variants table)
      if (filters.size && filters.size.length > 0) {
        query = query.in('variants.size', filters.size);
      }

      // Color Filter (Inner join on variants table)
      if (filters.color && filters.color.length > 0) {
        query = query.in('variants.color', filters.color);
      }
      
      // Price Filter
      if (filters.price?.min) {
        query = query.gte('price', parseFloat(filters.price.min));
      }
      if (filters.price?.max) {
        query = query.lte('price', parseFloat(filters.price.max));
      }

      // New Arrivals Filter
      if (queryFilter === 'new') {
        query = query.eq('is_new_arrival', true);
      }
      
      // Sort
      switch(sortParam) {
        case 'price-asc':
          query = query.order('price', { ascending: true });
          break;
        case 'price-desc':
          query = query.order('price', { ascending: false });
          break;
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'featured':
          query = query.order('is_featured', { ascending: false });
          break;
        default:
          break;
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Filter out duplicates if multiple variants matched
      const uniqueProducts = [];
      const seenIds = new Set();
      if (data) {
        for (const p of data) {
          if (!seenIds.has(p.id)) {
            // Apply availability filter manually since it depends on aggregated stock
            const totalStock = p.variants?.reduce((sum, v) => sum + v.stock, 0) || 0;
            let include = true;
            if (filters.availability && filters.availability.length > 0) {
              const wantInStock = filters.availability.includes('In Stock');
              const wantOutOfStock = filters.availability.includes('Out Of Stock');
              if (wantInStock && !wantOutOfStock && totalStock === 0) include = false;
              if (wantOutOfStock && !wantInStock && totalStock > 0) include = false;
            }
            
            if (include) {
              uniqueProducts.push(p);
              seenIds.add(p.id);
            }
          }
        }
      }
      
      setProducts(uniqueProducts);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  if (isMobile) {
    return (
      <MobileCollectionsView
        filters={filters}
        isFilterOpen={isMobileFilterOpen}
        loading={loading}
        onCloseFilters={() => setIsMobileFilterOpen(false)}
        onOpenFilters={() => setIsMobileFilterOpen(true)}
        products={products}
        setFilters={setFilters}
        setSortParam={setSortParam}
        sortParam={sortParam}
        title={getPageTitle()}
        url={`https://lexcc.in${location.pathname}${location.search}`}
      />
    );
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: 'var(--secondary-color, #0a0a0a)', overflow: 'hidden' }}>
      <SEO 
        title={getPageTitle()} 
        description={`Explore the ${getPageTitle().toLowerCase()} collection at LEXCC.`}
        url={`https://lexcc.in${location.pathname}${location.search}`}
      />
      {/* Background Typography */}
      <AnimatePresence mode="wait">
        <motion.div
          key={getBackgroundText()}
          className={accountStyles.bgTextAccount}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {getBackgroundText()}
        </motion.div>
      </AnimatePresence>

      <div className={styles.shopLayoutContainer}>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '20px', gap: '15px' }}>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-heading)', fontWeight: 300, margin: 0, lineHeight: 1 }}
          >
            {getPageTitle()}
          </motion.h1>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{ display: 'flex', alignItems: 'center', gap: '20px' }}
          >
            <span style={{ fontSize: '0.8rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>
              {products.length} {products.length === 1 ? 'Product' : 'Products'}
            </span>
            <CustomSelect 
              value={sortParam}
              onChange={(e) => setSortParam(e.target.value)}
              className={styles.sortSelect}
              style={{ width: '220px' }}
            >
              <option value="featured">Featured</option>
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </CustomSelect>
          </motion.div>
        </div>

        <div className={styles.shopGrid}>
          {/* Desktop Filters Sidebar */}
          <div className={styles.desktopFilter}>
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              style={{ position: 'sticky', top: '140px', alignSelf: 'start' }}
            >
              <FilterSidebar filters={filters} setFilters={setFilters} />
            </motion.div>
          </div>
          
          {/* Mobile Filter Button */}
          <button 
            className={styles.mobileFilterBtn} 
            onClick={() => setIsMobileFilterOpen(true)}
          >
            Filters & Sorting
          </button>

          {/* Mobile Filters Drawer */}
          <AnimatePresence>
            {isMobileFilterOpen && (
              <>
                <motion.div 
                  className={styles.filterDrawerOverlay}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsMobileFilterOpen(false)}
                />
                <motion.div 
                  className={styles.filterDrawerContent}
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>Filters</h3>
                    <button onClick={() => setIsMobileFilterOpen(false)} style={{ fontSize: '2rem', lineHeight: 0.5 }}>&times;</button>
                  </div>
                  <FilterSidebar filters={filters} setFilters={setFilters} />
                  
                  <button 
                    onClick={() => setIsMobileFilterOpen(false)}
                    className={accountStyles.actionBtn}
                    style={{ width: '100%', marginTop: '30px' }}
                  >
                    Apply Filters
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
          
          {/* Product Grid */}
          <div style={{ minHeight: '50vh' }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                <motion.div 
                  animate={{ opacity: [0.3, 1, 0.3] }} 
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  style={{ letterSpacing: '0.2em', textTransform: 'uppercase', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}
                >
                  Curating Selection...
                </motion.div>
              </div>
            ) : products.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', textAlign: 'center' }}
              >
                <span style={{ fontSize: '3rem', color: 'rgba(212,175,55,0.3)', marginBottom: '20px' }}>✧</span>
                <p style={{ letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', marginBottom: '20px' }}>No items match your criteria.</p>
                <button onClick={() => setFilters({})} className={styles.secondaryBtn}>Clear Filters</button>
              </motion.div>
            ) : (
              <motion.div 
                initial="hidden"
                animate="show"
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: { staggerChildren: window.innerWidth < 768 ? 0 : 0.1 }
                  }
                }}
                className={styles.productGrid}
              >
                {products.map(product => (
                  <motion.div 
                    key={product.id}
                    variants={{
                      hidden: { opacity: 0, y: 30 },
                      show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
                    }}
                    className="will-change-both"
                  >
                    <ProductCard 
                      product={{
                        ...product,
                        image_url: product.image_url || 'https://via.placeholder.com/800x1200/111/fff?text=No+Image'
                      }} 
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Collections;
