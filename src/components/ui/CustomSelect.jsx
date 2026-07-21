import React, { useState, useRef, useEffect, forwardRef, Children } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CustomSelect = forwardRef(({ children, value, onChange, onBlur, name, disabled, className, required }, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(value || '');
  const containerRef = useRef(null);

  // Parse children to get options
  const options = Children.toArray(children)
    .filter(child => child.type === 'option')
    .map(child => ({
      value: child.props.value,
      label: child.props.children
    }));

  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (val) => {
    setInternalValue(val);
    if (onChange) {
      onChange({ target: { name, value: val } });
    }
    setIsOpen(false);
  };

  const selectedOption = options.find(opt => opt.value === internalValue) || options[0];

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }} className={className}>
      <select 
        ref={ref} 
        name={name} 
        value={internalValue} 
        onChange={(e) => handleSelect(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        required={required}
        style={{ display: 'none' }}
      >
        {children}
      </select>

      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          padding: '12px 16px',
          backgroundColor: '#0a0a0a',
          border: '1px solid',
          borderColor: isOpen ? '#D4AF37' : 'rgba(255, 255, 255, 0.2)',
          color: disabled ? 'rgba(255, 255, 255, 0.4)' : '#fff',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          transition: 'border-color 0.3s ease',
          fontFamily: 'inherit',
          fontSize: '0.85rem',
          letterSpacing: '0.05em',
          minHeight: '45px'
        }}
      >
        <span>{selectedOption ? selectedOption.label : 'Select...'}</span>
        <motion.span 
          animate={{ rotate: isOpen ? 180 : 0 }}
          style={{ fontSize: '0.8rem', color: '#D4AF37' }}
        >
          ▼
        </motion.span>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              backgroundColor: '#0a0a0a',
              border: '1px solid #D4AF37',
              borderTop: 'none',
              zIndex: 50,
              maxHeight: '250px',
              overflowY: 'auto',
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
            }}
          >
            {options.map((opt) => (
              <div
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.1)';
                  e.currentTarget.style.color = '#D4AF37';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#fff';
                }}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  color: internalValue === opt.value ? '#D4AF37' : '#fff',
                  fontSize: '0.85rem',
                  letterSpacing: '0.05em',
                  transition: 'all 0.2s ease'
                }}
              >
                {opt.label}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default CustomSelect;
