import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm as useHookForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import zxcvbn from 'zxcvbn';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Auth.module.css';

const resetSchema = z.object({
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
});

const ResetPassword = () => {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [globalError, setGlobalError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const { register, handleSubmit, formState: { errors }, watch } = useHookForm({
    resolver: zodResolver(resetSchema),
    mode: 'onChange'
  });

  const passwordValue = watch('password', '');

  React.useEffect(() => {
    if (passwordValue) {
      const evaluation = zxcvbn(passwordValue);
      setPasswordStrength(evaluation.score);
    } else {
      setPasswordStrength(0);
    }
  }, [passwordValue]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    setGlobalError('');
    try {
      await resetPassword(data.password);
      // Automatically redirect them to login with a success state or just to login
      navigate('/login', { replace: true });
    } catch (error) {
      setGlobalError(error.message || 'Failed to reset password. Your link may be expired.');
    } finally {
      setIsLoading(false);
    }
  };

  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong', 'Excellent'];
  const strengthColors = ['#ef4444', '#f59e0b', '#eab308', '#22c55e', '#16a34a'];

  return (
    <div className={styles.authPage}>
      <div className={styles.bgText}>SECURE</div>
      
      <motion.div 
        className={styles.authCard}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className={styles.authHeader}>
          <h1 className={styles.authTitle}>New Password</h1>
          <p className={styles.authSubtitle}>Enter your new password to regain access.</p>
        </div>

        {globalError && <div className={styles.globalError}>{globalError}</div>}

        <form className={styles.authForm} onSubmit={handleSubmit(onSubmit)}>
          <div className={styles.inputGroup}>
            <label htmlFor="password">New Password</label>
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
            <label htmlFor="confirmPassword">Confirm New Password</label>
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
            {isLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
