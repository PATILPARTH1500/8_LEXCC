import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import accountStyles from '../../pages/Account/Account.module.css';

const FilterAccordion = ({ title, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <h4 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '25px 0', 
          cursor: 'pointer',
          fontSize: '0.9rem',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          fontWeight: 400,
          color: isOpen ? '#fff' : 'rgba(255,255,255,0.7)',
          transition: 'color 0.3s'
        }}
      >
        {title}
        <motion.span 
          animate={{ rotate: isOpen ? 45 : 0 }} 
          transition={{ duration: 0.3 }}
          style={{ fontSize: '1.2rem', fontWeight: 300 }}
        >
          +
        </motion.span>
      </h4>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ paddingBottom: '25px' }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const colorMap = {
  'Black': '#000000',
  'White': '#FFFFFF',
  'Grey': '#808080',
  'Navy': '#1a237e',
  'Olive': '#4b5320'
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
    <aside className={accountStyles.card} style={{ padding: '30px', margin: 0, border: 'none', background: 'rgba(255,255,255,0.01)' }}>
      <h3 style={{ fontSize: '1.1rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '10px', fontWeight: 400 }}>Filter By</h3>
      <div style={{ height: '1px', background: 'var(--accent-color, #D4AF37)', width: '40px', marginBottom: '20px' }} />

      <FilterAccordion title="Category" defaultOpen={true}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {['Men', 'Footwear', 'Collections', 'Accessories'].map(item => (
            <li key={item}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                cursor: 'pointer',
                color: isChecked('category', item.toLowerCase()) ? '#fff' : 'rgba(255,255,255,0.5)',
                fontSize: '0.85rem',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                transition: 'color 0.3s'
              }}>
                <div style={{ 
                  width: '16px', 
                  height: '16px', 
                  border: `1px solid ${isChecked('category', item.toLowerCase()) ? 'var(--accent-color)' : 'rgba(255,255,255,0.3)'}`,
                  background: isChecked('category', item.toLowerCase()) ? 'var(--accent-color)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s'
                }}>
                  {isChecked('category', item.toLowerCase()) && <span style={{ color: '#000', fontSize: '10px' }}>✓</span>}
                </div>
                <input 
                  type="checkbox" 
                  checked={isChecked('category', item.toLowerCase())} 
                  onChange={() => handleCheckbox('category', item.toLowerCase())} 
                  style={{ display: 'none' }}
                /> 
                {item}
              </label>
            </li>
          ))}
        </ul>
      </FilterAccordion>

      <FilterAccordion title="Size" defaultOpen={false}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {['XS', 'S', 'M', 'L', 'XL'].map(item => (
            <button 
              key={item}
              onClick={() => handleCheckbox('size', item)}
              style={{
                background: isChecked('size', item) ? '#fff' : 'transparent',
                color: isChecked('size', item) ? '#000' : '#fff',
                border: `1px solid ${isChecked('size', item) ? '#fff' : 'rgba(255,255,255,0.1)'}`,
                padding: '12px 0',
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              {item}
            </button>
          ))}
        </div>
      </FilterAccordion>

      <FilterAccordion title="Color" defaultOpen={false}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
          {Object.entries(colorMap).map(([name, hex]) => (
            <div 
              key={name}
              onClick={() => handleCheckbox('color', name)}
              title={name}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: hex,
                border: name === 'White' ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.05)',
                cursor: 'pointer',
                outline: isChecked('color', name) ? '2px solid var(--accent-color)' : 'none',
                outlineOffset: '4px',
                transition: 'all 0.3s ease'
              }}
            />
          ))}
        </div>
      </FilterAccordion>

      <FilterAccordion title="Price" defaultOpen={false}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>$</span>
            <input 
              type="number" 
              placeholder="Min" 
              value={filters.price?.min || ''}
              onChange={(e) => handlePriceChange('min', e.target.value)}
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 12px 12px 30px', color: '#fff', fontSize: '0.9rem', outline: 'none' }}
            />
          </div>
          <span style={{ color: 'rgba(255,255,255,0.3)' }}>-</span>
          <div style={{ flex: 1, position: 'relative' }}>
            <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>$</span>
            <input 
              type="number" 
              placeholder="Max" 
              value={filters.price?.max || ''}
              onChange={(e) => handlePriceChange('max', e.target.value)}
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 12px 12px 30px', color: '#fff', fontSize: '0.9rem', outline: 'none' }}
            />
          </div>
        </div>
      </FilterAccordion>

      <FilterAccordion title="Availability" defaultOpen={false}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {['In Stock', 'Out Of Stock'].map(item => (
            <li key={item}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                cursor: 'pointer',
                color: isChecked('availability', item) ? '#fff' : 'rgba(255,255,255,0.5)',
                fontSize: '0.85rem',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                transition: 'color 0.3s'
              }}>
                <div style={{ 
                  width: '16px', 
                  height: '16px', 
                  border: `1px solid ${isChecked('availability', item) ? 'var(--accent-color)' : 'rgba(255,255,255,0.3)'}`,
                  background: isChecked('availability', item) ? 'var(--accent-color)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s'
                }}>
                  {isChecked('availability', item) && <span style={{ color: '#000', fontSize: '10px' }}>✓</span>}
                </div>
                <input 
                  type="checkbox" 
                  checked={isChecked('availability', item)} 
                  onChange={() => handleCheckbox('availability', item)} 
                  style={{ display: 'none' }}
                /> 
                {item}
              </label>
            </li>
          ))}
        </ul>
      </FilterAccordion>
    </aside>
  );
};

export default FilterSidebar;
