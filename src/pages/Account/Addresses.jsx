import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './Account.module.css';

const Addresses = () => {
  const { fetchAddresses, addAddress, updateAddress, deleteAddress } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    title: 'HOME',
    first_name: '',
    last_name: '',
    street: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'United States',
    is_default: false
  });

  const loadAddresses = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAddresses();
      setAddresses(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const handleOpenModal = (address = null) => {
    if (address) {
      setEditingAddress(address);
      setFormData(address);
    } else {
      setEditingAddress(null);
      setFormData({
        title: 'HOME',
        first_name: '',
        last_name: '',
        street: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'United States',
        is_default: addresses.length === 0
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAddress(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAddress) {
        await updateAddress(editingAddress.id, formData);
      } else {
        await addAddress(formData);
      }
      await loadAddresses();
      handleCloseModal();
    } catch (err) {
      alert(err.message || 'Failed to save address');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      try {
        await deleteAddress(id);
        await loadAddresses();
      } catch (err) {
        alert('Failed to delete address');
      }
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await updateAddress(id, { is_default: true });
      await loadAddresses();
    } catch (err) {
      alert('Failed to set default address');
    }
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Saved Addresses</h1>
        <p className={styles.pageSubtitle}>Manage your shipping and billing locations.</p>
      </div>

      {isLoading ? (
        <div style={{ padding: '40px', color: 'rgba(255,255,255,0.5)' }}>LOADING...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '30px' }}>
          
          {addresses.map(addr => (
            <motion.div 
              key={addr.id} 
              className={styles.card} 
              style={{ margin: 0, display: 'flex', flexDirection: 'column' }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '0.9rem', letterSpacing: '0.1em', fontWeight: 600 }}>{addr.title}</h3>
                {addr.is_default && <span className={`${styles.badge} ${styles.badgeSuccess}`}>Default</span>}
              </div>
              
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '30px' }}>
                <p style={{ color: '#fff', fontWeight: 500, marginBottom: '5px' }}>{addr.first_name} {addr.last_name}</p>
                <p>{addr.street}</p>
                <p>{addr.city}, {addr.state} {addr.postal_code}</p>
                <p>{addr.country}</p>
              </div>

              <div style={{ display: 'flex', gap: '15px', marginTop: 'auto', flexWrap: 'wrap' }}>
                <button onClick={() => handleOpenModal(addr)} className={styles.secondaryBtn} style={{ padding: '8px 16px', fontSize: '0.7rem', flex: 1 }}>Edit</button>
                <button onClick={() => handleDelete(addr.id)} className={styles.secondaryBtn} style={{ padding: '8px 16px', fontSize: '0.7rem', flex: 1, borderColor: 'transparent', color: '#ef4444' }}>Remove</button>
                {!addr.is_default && (
                  <button onClick={() => handleSetDefault(addr.id)} className={styles.secondaryBtn} style={{ padding: '8px 16px', fontSize: '0.7rem', width: '100%', marginTop: '5px' }}>
                    Set As Default
                  </button>
                )}
              </div>
            </motion.div>
          ))}

          <motion.button 
            onClick={() => handleOpenModal()}
            className={styles.card} 
            style={{ margin: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'transparent', borderStyle: 'dashed', minHeight: '250px', cursor: 'pointer' }}
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.02)' }}
          >
            <span style={{ fontSize: '2rem', marginBottom: '10px', color: 'rgba(255,255,255,0.5)' }}>+</span>
            <span style={{ fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>Add New Address</span>
          </motion.button>

        </div>
      )}

      {/* Address Modal Overlay */}
      <AnimatePresence>
        {isModalOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div 
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
            />
            <motion.div 
              style={{ background: '#111', padding: '40px', width: '100%', maxWidth: '600px', position: 'relative', zIndex: 10, border: '1px solid rgba(255,255,255,0.1)', maxHeight: '90vh', overflowY: 'auto' }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
            >
              <h2 className={styles.cardTitle}>{editingAddress ? 'Edit Address' : 'Add New Address'}</h2>
              
              <form onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Address Type</label>
                  <select name="title" value={formData.title} onChange={handleChange} className={styles.formInput} required>
                    <option value="HOME">HOME</option>
                    <option value="WORK">WORK</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>
                
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>First Name</label>
                    <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} className={styles.formInput} required />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Last Name</label>
                    <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} className={styles.formInput} required />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Street Address</label>
                  <input type="text" name="street" value={formData.street} onChange={handleChange} className={styles.formInput} required />
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>City</label>
                    <input type="text" name="city" value={formData.city} onChange={handleChange} className={styles.formInput} required />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>State / Province</label>
                    <input type="text" name="state" value={formData.state} onChange={handleChange} className={styles.formInput} required />
                  </div>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Postal Code</label>
                    <input type="text" name="postal_code" value={formData.postal_code} onChange={handleChange} className={styles.formInput} required />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Country</label>
                    <select name="country" value={formData.country} onChange={handleChange} className={styles.formInput} required>
                      <option value="United States">United States</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Canada">Canada</option>
                      <option value="Australia">Australia</option>
                      <option value="France">France</option>
                      <option value="Italy">Italy</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input 
                    type="checkbox" 
                    name="is_default" 
                    checked={formData.is_default} 
                    onChange={handleChange} 
                    id="isDefault" 
                    style={{ accentColor: '#D4AF37' }}
                  />
                  <label htmlFor="isDefault" style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>Set as default address</label>
                </div>

                <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
                  <button type="submit" className={styles.actionBtn}>
                    {editingAddress ? 'Update Address' : 'Save Address'}
                  </button>
                  <button type="button" onClick={handleCloseModal} className={styles.secondaryBtn}>
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Addresses;
