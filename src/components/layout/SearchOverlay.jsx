import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import styles from '../../pages/Public/Shop.module.css';

// Mock data for search
const MOCK_PRODUCTS = [
  { id: 1, name: 'HEAVYWEIGHT OVERSIZED HOODIE', slug: 'heavyweight-oversized-hoodie', price: 250, image_url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800&auto=format&fit=crop' },
  { id: 2, name: 'DISTRESSED DENIM JACKET', slug: 'distressed-denim-jacket', price: 450, image_url: 'https://images.unsplash.com/photo-1495105787522-5334e3ffa0ef?q=80&w=800&auto=format&fit=crop' },
  { id: 3, name: 'VINTAGE WASH TEE', slug: 'vintage-wash-tee', price: 120, image_url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=800&auto=format&fit=crop' },
];

const SearchOverlay = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (query.trim() === '') {
      setResults([]);
      return;
    }
    
    // Live search simulation
    const timer = setTimeout(() => {
      const filtered = MOCK_PRODUCTS.filter(p => 
        p.name.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered);
    }, 300); // 300ms debounce
    
    return () => clearTimeout(timer);
  }, [query]);

  // Lock body scroll when overlay is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className={styles.searchOverlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <button className={styles.searchClose} onClick={onClose}>&times;</button>
          
          <div className={styles.searchInputWrapper}>
            <input 
              type="text" 
              className={styles.searchInput}
              placeholder="SEARCH CATALOG"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>

          <div className={styles.searchResults}>
            {query.length > 0 && results.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', marginTop: '40px', letterSpacing: '0.1em' }}>
                NO RESULTS FOUND FOR "{query.toUpperCase()}"
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '30px' }}>
                {results.map(product => (
                  <Link 
                    key={product.id} 
                    to={`/product/${product.slug}`} 
                    style={{ textDecoration: 'none', color: 'inherit' }}
                    onClick={onClose}
                  >
                    <div style={{ background: '#111', aspectRatio: '3/4', marginBottom: '15px' }}>
                      <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <h3 style={{ fontSize: '0.75rem', letterSpacing: '0.05em', marginBottom: '5px' }}>{product.name}</h3>
                    <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>${product.price.toFixed(2)}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SearchOverlay;
