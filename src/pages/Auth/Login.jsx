import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm as useHookForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { Turnstile } from '@marsidev/react-turnstile';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthStyles } from './useAuthStyles';
import { useResponsive } from '../../contexts/ResponsiveContext';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const Login = () => {
  const styles = useAuthStyles();
  const { isMobile } = useResponsive();
  const { signIn, verifyTurnstileToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [globalError, setGlobalError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const turnstileKey = import.meta.env.VITE_CLOUDFLARE_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!turnstileKey) {
      setTurnstileToken('dummy_token_dev');
    }
  }, [turnstileKey]);

  const searchParams = new URLSearchParams(location.search);
  const queryRedirect = searchParams.get('redirect');
  const stateRedirect = location.state?.from?.pathname;
  
  let from = '/account';
  if (stateRedirect && stateRedirect.startsWith('/')) {
    from = stateRedirect;
  } else if (queryRedirect && queryRedirect.startsWith('/')) {
    from = queryRedirect;
  }

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
      if (turnstileKey && turnstileToken !== 'dummy_token_dev') {
        await verifyTurnstileToken(turnstileToken);
      }
      
      const result = await signIn({ email: data.email, password: data.password });
      
      if (result?.session && result?.user) {
        navigate(from, { replace: true });
      } else {
        setGlobalError('Unable to establish an authenticated session.');
      }
    } catch (error) {
      setGlobalError(error.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setIsLoading(false);
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
            {turnstileKey && (
              <Turnstile 
                siteKey={turnstileKey}
                onSuccess={(token) => setTurnstileToken(token)}
                onError={() => setGlobalError('Security check failed.')}
                onExpire={() => setTurnstileToken('')}
                options={{ theme: 'dark', size: isMobile ? 'flexible' : 'normal' }}
              />
            )}
          </div>

          <button type="submit" className={styles.submitBtn} disabled={isLoading}>
            {isLoading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>


        <div className={styles.authFooter}>
          <p>Don't have an account? <Link to="/register" state={{ from: location.state?.from }} className={styles.authLink}>Register here</Link></p>
          <p style={{ marginTop: '10px' }}><Link to="/forgot-password" className={styles.authLink}>Forgot your password?</Link></p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
