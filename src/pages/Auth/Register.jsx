import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import zxcvbn from 'zxcvbn';
import { motion } from 'framer-motion';
import { Turnstile } from '@marsidev/react-turnstile';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthStyles } from './useAuthStyles';
import { useResponsive } from '../../contexts/ResponsiveContext';

// Strict validation matching requirements
const registerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address').refine(email => {
    // Basic block for disposable domains (mock example)
    const blockedDomains = ['tempmail.com', '10minutemail.com', 'mailinator.com'];
    const domain = email.split('@')[1];
    return !blockedDomains.includes(domain);
  }, 'Disposable email addresses are not allowed'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number with country code'),
  password: z.string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => {
  // Prevent name in password
  const nameInPwd = data.password.toLowerCase().includes(data.firstName.toLowerCase()) || 
                    data.password.toLowerCase().includes(data.lastName.toLowerCase());
  return !nameInPwd;
}, {
  message: "Password cannot contain your name",
  path: ["password"],
});

const Register = () => {
  const styles = useAuthStyles();
  const { isMobile } = useResponsive();
  const { signUp, verifyTurnstileToken } = useAuth();
  const navigate = useNavigate();
  const [globalError, setGlobalError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [turnstileToken, setTurnstileToken] = useState('');
  const turnstileKey = import.meta.env.VITE_CLOUDFLARE_TURNSTILE_SITE_KEY;

  React.useEffect(() => {
    if (!turnstileKey) {
      setTurnstileToken('dummy_token_dev');
    }
  }, [turnstileKey]);

  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    resolver: zodResolver(registerSchema),
    mode: 'onChange' // Live validation feedback
  });

  const passwordValue = watch('password', '');

  // Update password meter
  React.useEffect(() => {
    if (passwordValue) {
      const evaluation = zxcvbn(passwordValue);
      setPasswordStrength(evaluation.score); // 0 to 4
    } else {
      setPasswordStrength(0);
    }
  }, [passwordValue]);

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

      await signUp({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone
      });
      // Verification email is sent.
      navigate('/verify-email', { replace: true });
    } catch (error) {
      setGlobalError(error.message || 'Failed to register account.');
    } finally {
      setIsLoading(false);
    }
  };


  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong', 'Excellent'];
  const strengthColors = ['#ef4444', '#f59e0b', '#eab308', '#22c55e', '#16a34a'];

  return (
    <div className={styles.authPage}>
      <div className={styles.bgText}>CREATE</div>
      
      <motion.div 
        className={styles.authCard}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        style={{ maxWidth: '600px' }}
      >
        <div className={styles.authHeader}>
          <h1 className={styles.authTitle}>Join LEXCC</h1>
          <p className={styles.authSubtitle}>Create an account to track orders and save your preferences.</p>
        </div>

        {globalError && <div className={styles.globalError}>{globalError}</div>}

        <form className={styles.authForm} onSubmit={handleSubmit(onSubmit)}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className={styles.inputGroup}>
              <label htmlFor="firstName">First Name</label>
              <input 
                id="firstName"
                className={`${styles.input} ${errors.firstName ? styles.inputError : ''}`}
                placeholder="First name"
                {...register('firstName')}
              />
              {errors.firstName && <span className={styles.errorText}>{errors.firstName.message}</span>}
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="lastName">Last Name</label>
              <input 
                id="lastName"
                className={`${styles.input} ${errors.lastName ? styles.inputError : ''}`}
                placeholder="Last name"
                {...register('lastName')}
              />
              {errors.lastName && <span className={styles.errorText}>{errors.lastName.message}</span>}
            </div>
          </div>

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
            <label htmlFor="phone">Mobile Number</label>
            <input 
              id="phone"
              type="tel" 
              className={`${styles.input} ${errors.phone ? styles.inputError : ''}`}
              placeholder="+1234567890"
              {...register('phone')}
            />
            {errors.phone && <span className={styles.errorText}>{errors.phone.message}</span>}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <input 
              id="password"
              type="password" 
              className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
              placeholder="Create a strong password"
              {...register('password')}
            />
            {passwordValue && (
              <>
                <div className={styles.passwordMeter}>
                  {[...Array(4)].map((_, i) => (
                    <div 
                      key={i} 
                      className={styles.meterBar}
                      style={{ 
                        backgroundColor: i < Math.max(1, passwordStrength) ? strengthColors[passwordStrength] : 'rgba(255, 255, 255, 0.1)'
                      }}
                    />
                  ))}
                </div>
                <div className={styles.meterLabel} style={{ color: strengthColors[passwordStrength] }}>
                  {strengthLabels[passwordStrength]}
                </div>
              </>
            )}
            {errors.password && <span className={styles.errorText}>{errors.password.message}</span>}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input 
              id="confirmPassword"
              type="password" 
              className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ''}`}
              placeholder="Confirm your password"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && <span className={styles.errorText}>{errors.confirmPassword.message}</span>}
          </div>

          <div style={{ marginTop: '10px' }}>
            {turnstileKey && (
              <Turnstile 
                siteKey={turnstileKey}
                onSuccess={(token) => setTurnstileToken(token)}
                onError={() => setGlobalError('Security check failed. Please try again.')}
                onExpire={() => setTurnstileToken('')}
                options={{ theme: 'dark', size: isMobile ? 'flexible' : 'normal' }}
              />
            )}
          </div>

          <button type="submit" className={styles.submitBtn} disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>


        <div className={styles.authFooter}>
          <p>Already have an account? <Link to="/login" className={styles.authLink}>Sign in here</Link></p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
