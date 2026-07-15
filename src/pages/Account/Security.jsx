import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import styles from './Account.module.css';

const Security = () => {
  const { session, logoutAllDevices, resetPassword } = useAuth();
  const [isChangingPwd, setIsChangingPwd] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
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
      transition: { staggerChildren: 0.1, delayChildren: 0.2 } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '25px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <h3 style={{ fontSize: '0.95rem', marginBottom: '8px', letterSpacing: '0.1em', fontWeight: 500 }}>Email Address</h3>
                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.05em' }}>{session?.user?.email}</p>
              </div>
              <span className={`${styles.badge} ${session?.user?.email_confirmed_at ? styles.badgeSuccess : styles.badgeWarning}`}>
                {session?.user?.email_confirmed_at ? 'Verified' : 'Unverified'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '25px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <h3 style={{ fontSize: '0.95rem', marginBottom: '8px', letterSpacing: '0.1em', fontWeight: 500 }}>Password</h3>
                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.05em' }}>Last changed recently</p>
              </div>
              <span className={`${styles.badge} ${styles.badgeSuccess}`}>Protected</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                onSubmit={(e) => { e.preventDefault(); /* Hook up password update */ setIsChangingPwd(false); }} 
                style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
              >
                <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                  <input type="password" placeholder="Current Password" className={styles.formInput} required />
                </div>
                <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                  <input type="password" placeholder="New Password" className={styles.formInput} required />
                </div>
                <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                  <button type="submit" className={styles.actionBtn}>Update</button>
                  <button type="button" onClick={() => setIsChangingPwd(false)} className={styles.secondaryBtn}>Cancel</button>
                </div>
              </motion.form>
            ) : (
              <button onClick={() => setIsChangingPwd(true)} className={styles.secondaryBtn} style={{ textAlign: 'center' }}>
                Change Password
              </button>
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
