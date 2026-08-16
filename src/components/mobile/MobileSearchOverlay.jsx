import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiSearch, FiX } from 'react-icons/fi';
import { formatINR } from '../../utils/currency';
import styles from './MobileSearchOverlay.module.css';

const MobileSearchOverlay = ({ isSearching, onClose, onQueryChange, query, results }) => {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-search-title"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <header>
        <div><p>LEXCC / Catalog</p><h2 id="mobile-search-title">Search</h2></div>
        <button type="button" onClick={onClose} aria-label="Close search"><FiX /></button>
      </header>
      <label className={styles.searchBox}>
        <FiSearch aria-hidden="true" />
        <span className={styles.srOnly}>Search catalog</span>
        <input type="search" value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search pieces" autoFocus />
      </label>
      <div className={styles.results} aria-live="polite" aria-busy={isSearching}>
        {isSearching ? (
          <p className={styles.state}>Searching…</p>
        ) : query.trim() && results.length === 0 ? (
          <p className={styles.state}>No results for “{query}”</p>
        ) : results.length > 0 ? (
          <div className={styles.grid}>
            {results.map((product) => (
              <Link key={product.id} to={`/product/${product.slug}`} onClick={onClose}>
                <div><img src={product.image_url} alt={product.name} /></div>
                <h3>{product.name}</h3>
                <p>{formatINR(product.price)}</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className={styles.prompt}><FiSearch aria-hidden="true" /><p>Start typing to explore the collection.</p></div>
        )}
      </div>
    </motion.div>
  );
};

export default MobileSearchOverlay;
