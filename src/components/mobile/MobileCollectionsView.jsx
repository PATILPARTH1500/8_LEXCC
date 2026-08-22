import React, { useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { FiFilter, FiX } from 'react-icons/fi';
import ProductCard from '../shop/ProductCard';
import SEO from '../common/SEO';
import styles from './MobileCollectionsView.module.css';

const FILTER_OPTIONS = {
  category: [
    ['Men', 'men'],
    ['Footwear', 'footwear'],
    ['Collections', 'collections'],
    ['Accessories', 'accessories'],
  ],
  color: ['Black', 'White', 'Grey', 'Navy', 'Olive'],
  availability: ['In Stock', 'Out Of Stock'],
};

const colorMap = {
  Black: '#000000',
  White: '#ffffff',
  Grey: '#808080',
  Navy: '#1a237e',
  Olive: '#4b5320',
};

import { getSizingSystem, getSizesForSystem } from '../../utils/sizing';

const MobileFilterPanel = ({ filters, setFilters }) => {
  const toggle = (group, value) => {
    setFilters((current) => {
      const selected = current[group] || [];
      return {
        ...current,
        [group]: selected.includes(value)
          ? selected.filter((item) => item !== value)
          : [...selected, value],
      };
    });
  };

  const updatePrice = (key, value) => {
    setFilters((current) => ({
      ...current,
      price: { ...current.price, [key]: value },
    }));
  };

  return (
    <div className={styles.filterPanel}>
      <details className={styles.filterGroup} open>
        <summary>Category</summary>
        <div className={styles.checkList}>
          {FILTER_OPTIONS.category.map(([label, value]) => (
            <label key={value} className={styles.checkOption}>
              <input
                type="checkbox"
                checked={filters.category?.includes(value) || false}
                onChange={() => toggle('category', value)}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </details>

      <details className={styles.filterGroup}>
        <summary>Size</summary>
        <div className={styles.chipGrid}>
          {(() => {
            let availableSizes = new Set();
            if (!filters.category || filters.category.length === 0) {
              getSizesForSystem('APPAREL').forEach(s => availableSizes.add(s));
            } else {
              filters.category.forEach(catSlug => {
                const system = getSizingSystem(catSlug);
                getSizesForSystem(system).forEach(s => availableSizes.add(s));
              });
            }
            return Array.from(availableSizes).map((size) => (
              <button
                type="button"
                key={size}
                className={filters.size?.includes(size) ? styles.chipActive : styles.chip}
                aria-pressed={filters.size?.includes(size) || false}
                onClick={() => toggle('size', size)}
              >
                {size}
              </button>
            ));
          })()}
        </div>
      </details>

      <details className={styles.filterGroup}>
        <summary>Color</summary>
        <div className={styles.colorList}>
          {FILTER_OPTIONS.color.map((color) => (
            <button
              type="button"
              key={color}
              className={filters.color?.includes(color) ? styles.colorActive : styles.color}
              aria-label={`${filters.color?.includes(color) ? 'Remove' : 'Add'} ${color} filter`}
              aria-pressed={filters.color?.includes(color) || false}
              onClick={() => toggle('color', color)}
            >
              <span style={{ backgroundColor: colorMap[color] }} />
              {color}
            </button>
          ))}
        </div>
      </details>

      <details className={styles.filterGroup}>
        <summary>Price</summary>
        <div className={styles.priceGrid}>
          <label>
            <span>Minimum</span>
            <input
              type="number"
              min="0"
              inputMode="numeric"
              placeholder="₹0"
              value={filters.price?.min || ''}
              onChange={(event) => updatePrice('min', event.target.value)}
            />
          </label>
          <label>
            <span>Maximum</span>
            <input
              type="number"
              min="0"
              inputMode="numeric"
              placeholder="No limit"
              value={filters.price?.max || ''}
              onChange={(event) => updatePrice('max', event.target.value)}
            />
          </label>
        </div>
      </details>

      <details className={styles.filterGroup}>
        <summary>Availability</summary>
        <div className={styles.checkList}>
          {FILTER_OPTIONS.availability.map((value) => (
            <label key={value} className={styles.checkOption}>
              <input
                type="checkbox"
                checked={filters.availability?.includes(value) || false}
                onChange={() => toggle('availability', value)}
              />
              <span>{value}</span>
            </label>
          ))}
        </div>
      </details>
    </div>
  );
};

const MobileCollectionsView = ({
  filters,
  isFilterOpen,
  loading,
  onCloseFilters,
  onOpenFilters,
  products,
  setFilters,
  setSortParam,
  sortParam,
  title,
  url,
}) => {
  const reduceMotion = useReducedMotion();
  const activeFilterCount = Object.entries(filters).reduce((count, [key, value]) => {
    if (key === 'price') return count + Number(Boolean(value?.min)) + Number(Boolean(value?.max));
    return count + (Array.isArray(value) ? value.length : 0);
  }, 0);

  useEffect(() => {
    if (!isFilterOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onCloseFilters();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isFilterOpen, onCloseFilters]);

  return (
    <main className={styles.page} id="main-content">
      <SEO
        title={title}
        description={`Explore the ${title.toLowerCase()} collection at LEXCC.`}
        url={url}
      />

      <header className={styles.hero}>
        <p>LEXCC / Collection</p>
        <h1>{title}</h1>
        <span>{products.length} {products.length === 1 ? 'piece' : 'pieces'}</span>
      </header>

      <div className={styles.toolbar}>
        <button type="button" className={styles.filterButton} onClick={onOpenFilters}>
          <FiFilter aria-hidden="true" />
          Filters
          {activeFilterCount > 0 && <span>{activeFilterCount}</span>}
        </button>
        <label className={styles.sortControl}>
          <span>Sort</span>
          <select value={sortParam} onChange={(event) => setSortParam(event.target.value)}>
            <option value="featured">Featured</option>
            <option value="newest">Newest</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </label>
      </div>

      <section className={styles.results} aria-live="polite" aria-busy={loading}>
        {loading ? (
          <div className={styles.state}>Curating selection…</div>
        ) : products.length === 0 ? (
          <div className={styles.empty}>
            <span aria-hidden="true">✧</span>
            <h2>No pieces found</h2>
            <p>Try removing a filter to see more of the collection.</p>
            <button type="button" onClick={() => setFilters({})}>Clear filters</button>
          </div>
        ) : (
          <motion.div
            className={styles.productGrid}
            initial={reduceMotion ? false : 'hidden'}
            animate="show"
            variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
          >
            {products.map((product) => (
              <motion.div
                key={product.id}
                variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                transition={{ duration: reduceMotion ? 0 : 0.35 }}
              >
                <ProductCard
                  product={{
                    ...product,
                    image_url: product.image_url || 'https://via.placeholder.com/800x1200/111/fff?text=No+Image',
                  }}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      <AnimatePresence>
        {isFilterOpen && (
          <div className={styles.filterLayer} role="dialog" aria-modal="true" aria-labelledby="mobile-filter-title">
            <motion.button
              type="button"
              className={styles.backdrop}
              aria-label="Close filters"
              onClick={onCloseFilters}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.section
              className={styles.drawer}
              initial={reduceMotion ? false : { x: '-100%' }}
              animate={{ x: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { x: '-100%' }}
              transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              <header className={styles.drawerHeader}>
                <div>
                  <p>Refine collection</p>
                  <h2 id="mobile-filter-title">Filters</h2>
                </div>
                <button type="button" onClick={onCloseFilters} aria-label="Close filters"><FiX /></button>
              </header>
              <div className={styles.drawerScroll}>
                <MobileFilterPanel filters={filters} setFilters={setFilters} />
              </div>
              <footer className={styles.drawerActions}>
                <button type="button" onClick={() => setFilters({})}>Clear</button>
                <button type="button" onClick={onCloseFilters}>Show {products.length} pieces</button>
              </footer>
            </motion.section>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
};

export default MobileCollectionsView;
