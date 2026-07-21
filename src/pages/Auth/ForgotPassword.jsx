import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm as useHookForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { Turnstile } from '@marsidev/react-turnstile';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Auth.module.css';

const forgotSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const ForgotPassword = () => {
  const { forgotPassword } = useAuth();
  const [globalError, setGlobalError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');

  const { register, handleSubmit, formState: { errors } } = useHookForm({
    resolver: zodResolver(forgotSchema)
  });

  const onSubmit = async (data) => {
    if (!turnstileToken) {
      setGlobalError('Please complete the security check.');
      return;
    }

    setIsLoading(true);
    setGlobalError('');
    try {
      await forgotPassword(data.email);
      setIsSuccess(true);
    } catch (error) {
      // Don't leak if email exists or not, but handle generic errors
      setGlobalError('If an account exists, a reset link has been sent.');
      setIsSuccess(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.bgText}>RECOVER</div>
      
      <motion.div 
        className={styles.authCard}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className={styles.authHeader}>
          <h1 className={styles.authTitle}>Reset Password</h1>
          <p className={styles.authSubtitle}>Enter your email to receive a secure reset link.</p>
        </div>

        {globalError && !isSuccess && <div className={styles.globalError}>{globalError}</div>}
        
        {isSuccess ? (
          <div style={{ textAlign: 'center' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 16px', display: 'block' }}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <p className={styles.authSubtitle} style={{ marginBottom: '30px' }}>
              If an account with that email exists, we have sent a password reset link. Please check your inbox.
            </p>
            <Link to="/login" className={styles.submitBtn} style={{ display: 'block', textDecoration: 'none' }}>
              Return to Login
            </Link>
          </div>
        ) : (
          <form className={styles.authForm} onSubmit={handleSubmit(onSubmit)}>
            <div className={styles.inputGroup}>
              <label htmlFor="email">Email Address</label>
              <input 
                id="email"
                type="email" 
                className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                placeholder="Enter your email"
                {...register('email')}
              />
              {errors.email && <span className={styles.errorText}>{errors.email.message}</span>}
            </div>

            <div style={{ marginTop: '10px' }}>
              <Turnstile 
                siteKey={import.meta.env.VITE_CLOUDFLARE_TURNSTILE_SITE_KEY}
                onSuccess={(token) => setTurnstileToken(token)}
                onError={() => setGlobalError('Security check failed.')}
                onExpire={() => setTurnstileToken('')}
                options={{ theme: 'dark' }}
              />
            </div>

            <button type="submit" className={styles.submitBtn} disabled={isLoading}>
              {isLoading ? 'Sending Link...' : 'Send Reset Link'}
            </button>
            
            <div className={styles.authFooter} style={{ marginTop: '20px' }}>
              <Link to="/login" className={styles.authLink}>Back to Login</Link>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
