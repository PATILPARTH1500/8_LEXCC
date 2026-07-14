import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../../pages/Public/Shop.module.css';

const FilterAccordion = ({ title, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={styles.filterSection}>
      <h4 className={styles.filterTitle} onClick={() => setIsOpen(!isOpen)}>
        {title}
        <span>{isOpen ? '−' : '+'}</span>
      </h4>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: 'hidden' }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const colorMap = {
  'Black': '#000000',
  'White': '#FFFFFF',
  'Earth': '#8B7355',
  'Grey': '#808080',
  'Navy': '#000080',
  'Red': '#8B0000'
};

const FilterSidebar = ({ filters, setFilters }) => {
  
  const handleCheckbox = (category, value) => {
    setFilters(prev => {
      const current = prev[category] || [];
      if (current.includes(value)) {
        return { ...prev, [category]: current.filter(item => item !== value) };
      } else {
        return { ...prev, [category]: [...current, value] };
      }
    });
  };

  const isChecked = (category, value) => {
    return filters[category]?.includes(value) || false;
  };

  const handlePriceChange = (type, value) => {
    setFilters(prev => ({
      ...prev,
      price: {
        ...prev.price,
        [type]: value
      }
    }));
  };

  return (
    <aside className={styles.filterSidebar}>
      <FilterAccordion title="Category">
        <ul className={styles.filterList}>
          {['Hoodies', 'Tees', 'Bottoms', 'Footwear', 'Accessories'].map(item => (
            <li className={styles.filterItem} key={item}>
              <label className={`${styles.filterLabel} ${isChecked('category', item) ? styles.filterLabelActive : ''}`}>
                <input type="checkbox" checked={isChecked('category', item)} onChange={() => handleCheckbox('category', item)} /> {item}
              </label>
            </li>
          ))}
        </ul>
      </FilterAccordion>

      <FilterAccordion title="Size" defaultOpen={false}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', padding: '10px 0' }}>
          {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(item => (
            <button 
              key={item}
              onClick={() => handleCheckbox('size', item)}
              style={{
                background: isChecked('size', item) ? '#fff' : 'transparent',
                color: isChecked('size', item) ? '#000' : '#fff',
                border: '1px solid rgba(255,255,255,0.2)',
                padding: '8px',
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {item}
            </button>
          ))}
        </div>
      </FilterAccordion>

      <FilterAccordion title="Color" defaultOpen={false}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', padding: '10px 0' }}>
          {Object.entries(colorMap).map(([name, hex]) => (
            <div 
              key={name}
              onClick={() => handleCheckbox('color', name)}
              title={name}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: hex,
                border: name === 'White' ? '1px solid #ccc' : '1px solid transparent',
                cursor: 'pointer',
                outline: isChecked('color', name) ? '2px solid #D4AF37' : 'none',
                outlineOffset: '2px',
                transition: 'all 0.2s ease'
              }}
            />
          ))}
        </div>
      </FilterAccordion>

      <FilterAccordion title="Price" defaultOpen={false}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '10px 0' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>$</span>
            <input 
              type="number" 
              placeholder="Min" 
              value={filters.price?.min || ''}
              onChange={(e) => handlePriceChange('min', e.target.value)}
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 10px 10px 25px', color: '#fff', fontSize: '0.9rem' }}
            />
          </div>
          <span style={{ color: 'rgba(255,255,255,0.5)' }}>-</span>
          <div style={{ flex: 1, position: 'relative' }}>
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>$</span>
            <input 
              type="number" 
              placeholder="Max" 
              value={filters.price?.max || ''}
              onChange={(e) => handlePriceChange('max', e.target.value)}
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 10px 10px 25px', color: '#fff', fontSize: '0.9rem' }}
            />
          </div>
        </div>
      </FilterAccordion>

      <FilterAccordion title="Availability" defaultOpen={false}>
        <ul className={styles.filterList}>
          {['In Stock', 'Out Of Stock'].map(item => (
            <li className={styles.filterItem} key={item}>
              <label className={`${styles.filterLabel} ${isChecked('availability', item) ? styles.filterLabelActive : ''}`}>
                <input type="checkbox" checked={isChecked('availability', item)} onChange={() => handleCheckbox('availability', item)} /> {item}
              </label>
            </li>
          ))}
        </ul>
      </FilterAccordion>
    </aside>
  );
};

export default FilterSidebar;
