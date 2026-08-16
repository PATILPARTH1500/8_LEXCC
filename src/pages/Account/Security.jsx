import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import styles from './Account.module.css';

const Security = () => {
  const { session, logoutAllDevices, changePassword } = useAuth();
  const [isChangingPwd, setIsChangingPwd] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const resetPasswordForm = () => {
    setPasswords({ current: '', next: '', confirm: '' });
    setPasswordError('');
    setIsChangingPwd(false);
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwords.next.length < 8) {
      setPasswordError('Your new password must contain at least 8 characters.');
      return;
    }
    if (passwords.next !== passwords.confirm) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }
    if (passwords.current === passwords.next) {
      setPasswordError('Choose a new password that is different from your current password.');
      return;
    }

    setIsLoading(true);
    try {
      await changePassword(passwords.current, passwords.next);
      setPasswordSuccess('Password updated successfully.');
      resetPasswordForm();
    } catch (error) {
      setPasswordError(error.message || 'Unable to update your password.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGlobalLogout = async () => {
    if (window.confirm("Are you sure you want to log out from all devices?")) {
      try {
        await logoutAllDevices();
      } catch(err) {
        alert("Failed to logout all devices.");
      }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { staggerChildren: 0.1, delayChildren: 0.1 } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants} className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Security Center</h1>
        <p className={styles.pageSubtitle}>Manage your account security and authentication.</p>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px' }}>
        
        <motion.div variants={itemVariants} className={styles.card} style={{ margin: 0 }}>
          <h2 className={styles.cardTitle}>Account Status</h2>
          
          <div style={{ display: 'grid', gap: '20px' }}>
            <div className={styles.securityRow}>
              <div>
                <h3 style={{ fontSize: '0.95rem', marginBottom: '8px', letterSpacing: '0.1em', fontWeight: 500 }}>Email Address</h3>
                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.05em', wordBreak: 'break-all' }}>{session?.user?.email}</p>
              </div>
              <span className={`${styles.badge} ${session?.user?.email_confirmed_at ? styles.badgeSuccess : styles.badgeWarning}`}>
                {session?.user?.email_confirmed_at ? 'Verified' : 'Unverified'}
              </span>
            </div>

            <div className={styles.securityRow}>
              <div>
                <h3 style={{ fontSize: '0.95rem', marginBottom: '8px', letterSpacing: '0.1em', fontWeight: 500 }}>Password</h3>
                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.05em' }}>Last changed recently</p>
              </div>
              <span className={`${styles.badge} ${styles.badgeSuccess}`}>Protected</span>
            </div>

            <div className={styles.securityRow}>
              <div>
                <h3 style={{ fontSize: '0.95rem', marginBottom: '8px', letterSpacing: '0.1em', fontWeight: 500 }}>Google Authentication</h3>
                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.05em' }}>Use Google to sign in</p>
              </div>
              <span className={`${styles.badge} ${session?.user?.app_metadata?.providers?.includes('google') ? styles.badgeSuccess : ''}`}>
                {session?.user?.app_metadata?.providers?.includes('google') ? 'Connected' : 'Not Connected'}
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className={styles.card} style={{ margin: 0 }}>
          <h2 className={styles.cardTitle}>Security Actions</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '400px' }}>
            {isChangingPwd ? (
              <motion.form 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                onSubmit={handlePasswordChange}
                style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
              >
                <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                  <label htmlFor="current-password" className={styles.formLabel}>Current Password</label>
                  <input
                    id="current-password"
                    type="password"
                    autoComplete="current-password"
                    value={passwords.current}
                    onChange={(event) => setPasswords((current) => ({ ...current, current: event.target.value }))}
                    className={styles.formInput}
                    required
                  />
                </div>
                <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                  <label htmlFor="new-password" className={styles.formLabel}>New Password</label>
                  <input
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    value={passwords.next}
                    onChange={(event) => setPasswords((current) => ({ ...current, next: event.target.value }))}
                    className={styles.formInput}
                    required
                  />
                </div>
                <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                  <label htmlFor="confirm-password" className={styles.formLabel}>Confirm New Password</label>
                  <input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    value={passwords.confirm}
                    onChange={(event) => setPasswords((current) => ({ ...current, confirm: event.target.value }))}
                    className={styles.formInput}
                    required
                  />
                </div>
                {passwordError && <p role="alert" style={{ color: '#ef4444', fontSize: '0.85rem' }}>{passwordError}</p>}
                <div className={styles.formActions}>
                  <button type="submit" className={styles.actionBtn} disabled={isLoading}>
                    {isLoading ? 'Updating...' : 'Update'}
                  </button>
                  <button type="button" onClick={resetPasswordForm} className={styles.secondaryBtn} disabled={isLoading}>Cancel</button>
                </div>
              </motion.form>
            ) : (
              <>
                {passwordSuccess && <p role="status" style={{ color: '#22c55e', fontSize: '0.85rem' }}>{passwordSuccess}</p>}
                {passwordError && <p role="alert" style={{ color: '#ef4444', fontSize: '0.85rem' }}>{passwordError}</p>}
                <button onClick={() => { setPasswordError(''); setPasswordSuccess(''); setIsChangingPwd(true); }} className={styles.secondaryBtn} style={{ textAlign: 'center' }}>
                  Change Password
                </button>
              </>
            )}

            <button onClick={handleGlobalLogout} className={styles.secondaryBtn} style={{ textAlign: 'center', borderColor: 'transparent', color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.05)' }}>
              Log Out All Devices
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Security;
