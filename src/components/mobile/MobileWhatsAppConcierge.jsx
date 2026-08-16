import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { FaWhatsapp } from 'react-icons/fa';
import styles from './MobileWhatsAppConcierge.module.css';

const MobileWhatsAppConcierge = ({ href }) => {
  const reduceMotion = useReducedMotion();
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.concierge}
      aria-label="Chat with LEXCC Concierge on WhatsApp"
      initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: reduceMotion ? 0 : 0.25 }}
    >
      <FaWhatsapp aria-hidden="true" />
    </motion.a>
  );
};

export default MobileWhatsAppConcierge;
