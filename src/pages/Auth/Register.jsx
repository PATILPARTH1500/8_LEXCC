import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import zxcvbn from 'zxcvbn';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Auth.module.css';

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
  const { signUp, googleSignIn } = useAuth();
  const navigate = useNavigate();
  const [globalError, setGlobalError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

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
    setIsLoading(true);
    setGlobalError('');
    try {
      await signUp({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone
      });
      // Registration successful, Supabase usually logs them in or requires email verification.
      // We will redirect to account or verification page.
      navigate('/account', { replace: true });
    } catch (error) {
      setGlobalError(error.message || 'Failed to register account.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await googleSignIn();
    } catch (error) {
      setGlobalError(error.message);
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

          <button type="submit" className={styles.submitBtn} disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Create Account'}
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
          <p>Already have an account? <Link to="/login" className={styles.authLink}>Sign in here</Link></p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
