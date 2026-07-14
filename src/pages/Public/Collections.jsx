import React from 'react';
import FilterSidebar from '../../components/shop/FilterSidebar';
import ProductCard from '../../components/shop/ProductCard';
import styles from './Shop.module.css';

// Mock data for Phase 2 UI building
const MOCK_PRODUCTS = [
  { id: 1, name: 'HEAVYWEIGHT OVERSIZED HOODIE', slug: 'heavyweight-oversized-hoodie', price: 250, image_url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800&auto=format&fit=crop' },
  { id: 2, name: 'DISTRESSED DENIM JACKET', slug: 'distressed-denim-jacket', price: 450, image_url: 'https://images.unsplash.com/photo-1495105787522-5334e3ffa0ef?q=80&w=800&auto=format&fit=crop' },
  { id: 3, name: 'VINTAGE WASH TEE', slug: 'vintage-wash-tee', price: 120, image_url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=800&auto=format&fit=crop' },
  { id: 4, name: 'CARGO PANTS', slug: 'cargo-pants', price: 320, image_url: 'https://images.unsplash.com/photo-1517423568366-8b83523034fd?q=80&w=800&auto=format&fit=crop' },
  { id: 5, name: 'LEATHER BOMBER', slug: 'leather-bomber', price: 850, image_url: 'https://images.unsplash.com/photo-1520975954732-57dd22299614?q=80&w=800&auto=format&fit=crop' },
  { id: 6, name: 'CHUNKY SNEAKER', slug: 'chunky-sneaker', price: 380, image_url: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=800&auto=format&fit=crop' },
];

const Collections = () => {
  return (
    <div className={styles.collectionsPage}>
      <div className={styles.shopHeader}>
        <h1 className={styles.shopTitle}>SHOP ALL</h1>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '30px' }}>
          <select style={{ background: 'transparent', color: '#fff', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.2)', padding: '10px', outline: 'none', fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            <option value="featured" style={{ background: '#000' }}>Featured</option>
            <option value="newest" style={{ background: '#000' }}>Newest</option>
            <option value="price-asc" style={{ background: '#000' }}>Price: Low to High</option>
            <option value="price-desc" style={{ background: '#000' }}>Price: High to Low</option>
          </select>
        </div>
      </div>

      <div className={styles.shopGrid}>
        <FilterSidebar />
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '40px' }}>
          {MOCK_PRODUCTS.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Collections;
