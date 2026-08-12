import React from 'react';
import { motion } from 'framer-motion';
import { FaWhatsapp } from 'react-icons/fa';
import styles from './WhatsAppConcierge.module.css';

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
      className={styles.concierge}
    >
      <div className={styles.icon}>
        <FaWhatsapp />
      </div>
      <span className={styles.text}>
        LEXCC Concierge
      </span>
    </motion.a>
  );
};

export default WhatsAppConcierge;
