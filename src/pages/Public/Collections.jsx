import React, { useState, useEffect } from 'react';
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
  }, [filters, sortParam]); // Refetch when filters or sort changes

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Use inner join on variants if filtering by size or color to ensure parent filtering works
      const hasVariantFilter = (filters.size && filters.size.length > 0) || (filters.color && filters.color.length > 0);
      const variantJoin = hasVariantFilter ? 'variants:product_variants!inner(size, color, stock)' : 'variants:product_variants(size, color, stock)';

      let query = supabase
        .from('products')
        .select(`
          *,
          images:product_images(image_url),
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
      
      setProducts(data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

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
          ) : products.length === 0 ? (
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
              {products.map(product => (
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
