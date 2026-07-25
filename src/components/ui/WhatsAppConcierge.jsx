import React from 'react';
import { motion } from 'framer-motion';
import { FaWhatsapp } from 'react-icons/fa';

const STORE_PHONE_NUMBER = '919082951928'; // Updated to provided number
const PREFILLED_MESSAGE = encodeURIComponent('Hello LEXCC,\n\nI have a question regarding your products.');

const WhatsAppConcierge = () => {
  return (
    <motion.a
      href={`https://wa.me/${STORE_PHONE_NUMBER}?text=${PREFILLED_MESSAGE}`}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, scale: 0.8, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(212, 175, 55, 0.4)',
        padding: '12px 20px',
        borderRadius: '30px',
        textDecoration: 'none',
        boxShadow: '0 8px 32px rgba(212, 175, 55, 0.15)',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#D4AF37',
          fontSize: '1.2rem',
        }}
      >
        <FaWhatsapp />
      </div>
      <span
        style={{
          color: '#fff',
          fontSize: '0.85rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          fontWeight: 500,
        }}
      >
        LEXCC Concierge
      </span>
    </motion.a>
  );
};

export default WhatsAppConcierge;
