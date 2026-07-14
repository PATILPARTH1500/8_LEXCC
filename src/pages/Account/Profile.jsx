import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Account.module.css';

const Profile = () => {
  const { profile, updateProfile, uploadAvatar } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const fileInputRef = useRef(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || '',
      phone: profile?.phone || '',
      dob: profile?.dob || '',
      gender: profile?.gender || '',
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
        dob: profile.dob || '',
        gender: profile.gender || '',
        language: profile.language || 'en',
        currency: profile.currency || 'USD'
      });
    }
  }, [profile, reset]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError('');
    setSuccessMsg('');
    
    try {
      await updateProfile({
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
        dob: data.dob,
        gender: data.gender,
        language: data.language,
        currency: data.currency
      });
      setSuccessMsg('Changes Saved');
      setIsEditing(false);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('File must be less than 5MB');
      return;
    }

    setIsUploading(true);
    setError('');
    try {
      await uploadAvatar(file);
      setSuccessMsg('Avatar updated successfully');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('[Avatar Upload] Upload caught error:', err);
      setError('Failed to upload photo. Ensure profile-images bucket exists and is public.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAvatarRemove = async () => {
    try {
      await updateProfile({ avatar_url: '' });
      setSuccessMsg('Avatar removed');
      setTimeout(() => setSuccessMsg(''), 3000);
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
      {successMsg && <div style={{ color: '#22c55e', marginBottom: '20px', fontSize: '0.9rem', padding: '15px', border: '1px solid rgba(34, 197, 94, 0.2)', background: 'rgba(34, 197, 94, 0.05)' }}>{successMsg}</div>}

      <div className={styles.card}>
        <form onSubmit={handleSubmit(onSubmit)}>
          
          <h2 className={styles.cardTitle}>Personal Information</h2>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '30px', marginBottom: '40px' }}>
            <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              {isUploading && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '0.7rem' }}>UPLOADING...</span>
                </div>
              )}
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '2rem', color: 'rgba(255,255,255,0.2)' }}>{profile?.first_name?.charAt(0) || 'U'}</span>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                onChange={handleAvatarUpload}
              />
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()} 
                className={styles.secondaryBtn} 
                style={{ padding: '10px 20px', fontSize: '0.7rem' }}
                disabled={isUploading}
              >
                Change Photo
              </button>
              {profile?.avatar_url && (
                <button 
                  type="button" 
                  onClick={handleAvatarRemove} 
                  className={styles.secondaryBtn} 
                  style={{ padding: '10px 20px', fontSize: '0.7rem', color: '#ef4444', borderColor: 'transparent' }}
                  disabled={isUploading}
                >
                  Remove Photo
                </button>
              )}
            </div>
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

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Date of Birth</label>
              <input 
                type="date" 
                {...register('dob')} 
                className={styles.formInput} 
                disabled={!isEditing} 
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Gender</label>
              <select {...register('gender')} className={styles.formInput} disabled={!isEditing}>
                <option value="">Prefer not to say</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
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
                onClick={() => { reset(); setIsEditing(false); setError(''); setSuccessMsg(''); }} 
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
