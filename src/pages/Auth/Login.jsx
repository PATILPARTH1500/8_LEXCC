import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm as useHookForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { Turnstile } from '@marsidev/react-turnstile';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Auth.module.css';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const Login = () => {
  const { signIn, googleSignIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [globalError, setGlobalError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');

  const from = location.state?.from?.pathname || '/account';

  const { register, handleSubmit, formState: { errors } } = useHookForm({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data) => {
    if (!turnstileToken) {
      setGlobalError('Please complete the security check.');
      return;
    }

    setIsLoading(true);
    setGlobalError('');
    try {
      await signIn({ email: data.email, password: data.password });
      navigate(from, { replace: true });
    } catch (error) {
      setGlobalError(error.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await googleSignIn();
      // OAuth redirect will handle navigation
    } catch (error) {
      setGlobalError(error.message);
    }
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.bgText}>IDENTITY</div>
      
      <motion.div 
        className={styles.authCard}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className={styles.authHeader}>
          <h1 className={styles.authTitle}>Sign In</h1>
          <p className={styles.authSubtitle}>Access your LEXCC account and saved preferences.</p>
        </div>

        {globalError && <div className={styles.globalError}>{globalError}</div>}

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

          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <input 
              id="password"
              type="password" 
              className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
              placeholder="Enter your password"
              {...register('password')}
            />
            {errors.password && <span className={styles.errorText}>{errors.password.message}</span>}
          </div>

          <div style={{ marginTop: '10px' }}>
            <Turnstile 
              siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
              onSuccess={(token) => setTurnstileToken(token)}
              onError={() => setGlobalError('Security check failed.')}
              onExpire={() => setTurnstileToken('')}
              options={{ theme: 'dark' }}
            />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={isLoading}>
            {isLoading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className={styles.divider}>Or</div>

        <button onClick={handleGoogleSignIn} className={styles.googleBtn} type="button">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div className={styles.authFooter}>
          <p>Don't have an account? <Link to="/register" className={styles.authLink}>Register here</Link></p>
          <p style={{ marginTop: '10px' }}><Link to="/forgot-password" className={styles.authLink}>Forgot your password?</Link></p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
