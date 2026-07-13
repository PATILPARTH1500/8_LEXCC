import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import styles from './Auth.module.css';

const VerifyEmail = () => {
  return (
    <div className={styles.authPage}>
      <div className={styles.bgText}>VERIFY</div>
      
      <motion.div 
        className={styles.authCard}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        style={{ textAlign: 'center' }}
      >
        <div className={styles.authHeader} style={{ marginBottom: '20px' }}>
          <h1 className={styles.authTitle}>Verify Your Identity</h1>
        </div>

        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 24px', display: 'block' }}>
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
          <polyline points="22,6 12,13 2,6"></polyline>
        </svg>

        <p className={styles.authSubtitle} style={{ marginBottom: '24px', fontSize: '1rem' }}>
          We've sent a secure link to your email address. Please click it to verify your account and access LEXCC.
        </p>

        <p className={styles.authSubtitle} style={{ fontSize: '0.8rem', opacity: 0.7 }}>
          If you don't see it, check your spam folder or wait a few minutes.
        </p>

        <div className={styles.divider}></div>

        <Link to="/login" className={styles.submitBtn} style={{ display: 'block', textDecoration: 'none' }}>
          Return to Login
        </Link>
      </motion.div>
    </div>
  );
};

export default VerifyEmail;
