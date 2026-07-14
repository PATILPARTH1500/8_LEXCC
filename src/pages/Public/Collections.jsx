import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import FilterSidebar from '../../components/shop/FilterSidebar';
import ProductCard from '../../components/shop/ProductCard';
import { supabase } from '../../lib/supabase';
import styles from './Shop.module.css';

const Collections = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter & Sort State
  const [filters, setFilters] = useState({});
  const [sortParam, setSortParam] = useState('newest');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // For now, since categories/variants aren't heavily populated in Phase 2,
      // we'll fetch all active products and filter in-memory for simplicity.
      // In production with thousands of items, this should be done via RPC or complex queries.
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(name),
          images:product_images(image_url),
          variants:product_variants(size, color, stock_quantity)
        `)
        .eq('status', 'active');
        
      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    // Category Filter
    if (filters.category && filters.category.length > 0) {
      result = result.filter(p => filters.category.includes(p.category?.name) || filters.category.includes(p.category_id)); 
    }

    // Size Filter
    if (filters.size && filters.size.length > 0) {
      result = result.filter(p => p.variants?.some(v => filters.size.includes(v.size)));
    }

    // Color Filter
    if (filters.color && filters.color.length > 0) {
      result = result.filter(p => p.variants?.some(v => filters.color.includes(v.color)));
    }
    
    // Sort
    switch(sortParam) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case 'featured':
        result.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
        break;
      default:
        break;
    }

    return result;
  }, [products, filters, sortParam]);

  return (
    <div className={styles.collectionsPage}>
      <div className={styles.shopHeader}>
        <motion.h1 
          className={styles.shopTitle}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          SHOP ALL
        </motion.h1>
        <motion.div 
          style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '30px' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <select 
            value={sortParam}
            onChange={(e) => setSortParam(e.target.value)}
            style={{ background: 'transparent', color: '#fff', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.2)', padding: '10px', outline: 'none', fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}
          >
            <option value="featured" style={{ background: '#000' }}>Featured</option>
            <option value="newest" style={{ background: '#000' }}>Newest</option>
            <option value="price-asc" style={{ background: '#000' }}>Price: Low to High</option>
            <option value="price-desc" style={{ background: '#000' }}>Price: High to Low</option>
          </select>
        </motion.div>
      </div>

      <div className={styles.shopGrid}>
        <FilterSidebar filters={filters} setFilters={setFilters} />
        
        <div style={{ minHeight: '50vh' }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', marginTop: '40px' }}>LOADING COLLECTION...</div>
          ) : filteredAndSortedProducts.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', marginTop: '40px' }}>
              No products found matching your criteria.
            </div>
          ) : (
            <motion.div 
              className={styles.productGrid}
              initial="hidden"
              animate="show"
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: { staggerChildren: 0.1 }
                }
              }}
            >
              {filteredAndSortedProducts.map(product => (
                <motion.div 
                  key={product.id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    show: { opacity: 1, y: 0 }
                  }}
                >
                  <ProductCard 
                    product={{
                      ...product,
                      image_url: product.images?.[0]?.image_url || 'https://via.placeholder.com/800x1200/111/fff?text=No+Image'
                    }} 
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Collections;
