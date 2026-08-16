import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SEO from '../../components/common/SEO';
import styles from './NotFound.module.css';

const NotFound = () => (
  <section className={styles.page}>
    <SEO
      title="Page Not Found"
      description="The requested LEXCC page could not be found."
      url="https://lexcc.in/404"
    />
    <div className={styles.backgroundText} aria-hidden="true">404</div>
    <motion.div
      className={styles.content}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      <span className={styles.eyebrow}>Lost in the collection</span>
      <h1 className={styles.title}>Page Not Found</h1>
      <p className={styles.description}>
        The destination you requested does not exist or may have moved.
      </p>
      <div className={styles.actions}>
        <Link to="/shop" className={styles.primaryAction}>Explore the Shop</Link>
        <Link to="/" className={styles.secondaryAction}>Return Home</Link>
      </div>
    </motion.div>
  </section>
);

export default NotFound;
