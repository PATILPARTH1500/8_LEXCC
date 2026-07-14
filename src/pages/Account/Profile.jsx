import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Account.module.css';

const Profile = () => {
  const { profile, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || '',
      phone: profile?.phone || '',
      avatar_url: profile?.avatar_url || '',
      language: profile?.language || 'en',
      currency: profile?.currency || 'USD'
    }
  });

  useEffect(() => {
    if (profile) {
      reset({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
        avatar_url: profile.avatar_url || '',
        language: profile.language || 'en',
        currency: profile.currency || 'USD'
      });
    }
  }, [profile, reset]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError('');
    
    try {
      await updateProfile({
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
        avatar_url: data.avatar_url,
        language: data.language,
        currency: data.currency
      });
      setIsEditing(false);
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarRemove = async () => {
    try {
      await updateProfile({ avatar_url: '' });
      reset({ ...profile, avatar_url: '' });
    } catch (err) {
      setError('Failed to remove photo.');
    }
  };

  return (
    <div>
      <div className={styles.pageHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className={styles.pageTitle}>Profile</h1>
          <p className={styles.pageSubtitle}>Manage your personal information and preferences.</p>
        </div>
        {!isEditing && (
          <button onClick={() => setIsEditing(true)} className={styles.secondaryBtn}>
            Edit Profile
          </button>
        )}
      </div>

      {error && <div style={{ color: '#ef4444', marginBottom: '20px', fontSize: '0.9rem', padding: '15px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>{error}</div>}

      <div className={styles.card}>
        <form onSubmit={handleSubmit(onSubmit)}>
          
          <h2 className={styles.cardTitle}>Personal Information</h2>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '30px', marginBottom: '40px' }}>
            <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '2rem', color: 'rgba(255,255,255,0.2)' }}>{profile?.first_name?.charAt(0) || 'U'}</span>
              )}
            </div>
            
            {isEditing ? (
              <div style={{ flex: 1, maxWidth: '400px' }}>
                <label className={styles.formLabel}>Avatar URL</label>
                <input 
                  type="url" 
                  {...register('avatar_url')} 
                  className={styles.formInput} 
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '15px' }}>
                <button type="button" onClick={() => setIsEditing(true)} className={styles.secondaryBtn} style={{ padding: '10px 20px', fontSize: '0.7rem' }}>
                  Change Photo
                </button>
                {profile?.avatar_url && (
                  <button type="button" onClick={handleAvatarRemove} className={styles.secondaryBtn} style={{ padding: '10px 20px', fontSize: '0.7rem', color: '#ef4444', borderColor: 'transparent' }}>
                    Remove Photo
                  </button>
                )}
              </div>
            )}
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>First Name</label>
              <input 
                type="text" 
                {...register('first_name', { required: 'First name is required' })} 
                className={styles.formInput} 
                disabled={!isEditing} 
              />
              {errors.first_name && <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>{errors.first_name.message}</span>}
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Last Name</label>
              <input 
                type="text" 
                {...register('last_name', { required: 'Last name is required' })} 
                className={styles.formInput} 
                disabled={!isEditing} 
              />
              {errors.last_name && <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>{errors.last_name.message}</span>}
            </div>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Email</label>
              <input 
                type="email" 
                defaultValue={profile?.email || ''} 
                className={styles.formInput} 
                disabled 
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Phone Number</label>
              <input 
                type="tel" 
                {...register('phone')} 
                className={styles.formInput} 
                disabled={!isEditing} 
              />
            </div>
          </div>

          <h2 className={styles.cardTitle} style={{ marginTop: '20px' }}>Preferences</h2>
          
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Language</label>
              <select {...register('language')} className={styles.formInput} disabled={!isEditing}>
                <option value="en">English (US)</option>
                <option value="fr">Français (FR)</option>
                <option value="it">Italiano (IT)</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Currency</label>
              <select {...register('currency')} className={styles.formInput} disabled={!isEditing}>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>

          {isEditing && (
            <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
              <button type="submit" className={styles.actionBtn} disabled={isLoading}>
                {isLoading ? 'SAVING...' : 'SAVE CHANGES'}
              </button>
              <button 
                type="button" 
                onClick={() => { reset(); setIsEditing(false); setError(''); }} 
                className={styles.secondaryBtn}
              >
                CANCEL
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Profile;
