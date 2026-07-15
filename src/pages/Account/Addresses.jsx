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
    <motion.div variants={containerVariants} initial="hidden" animate="visible" style={{ position: 'relative' }}>
      <div className={styles.bgTextAccount}>ADDRESS BOOK</div>
      <motion.div variants={itemVariants} className={styles.pageHeader} style={{ position: 'relative', zIndex: 1 }}>
        <h1 className={styles.pageTitle}>Saved Addresses</h1>
        <p className={styles.pageSubtitle}>Manage your shipping and billing locations.</p>
      </motion.div>

      {isLoading ? (
        <motion.div variants={itemVariants} style={{ padding: '40px', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em' }}>LOADING...</motion.div>
      ) : (
        <motion.div variants={itemVariants} className={styles.addressGrid}>
          
          {addresses.map((addr, index) => (
            <motion.div 
              key={addr.id} 
              className={styles.addressCard}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <h3 style={{ fontSize: '0.95rem', letterSpacing: '0.15em', fontWeight: 500, color: '#fff' }}>{addr.title}</h3>
                {addr.is_default && <span className={`${styles.badge} ${styles.badgeSuccess}`}>Default Address</span>}
              </div>
              
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.95rem', lineHeight: '1.8', marginBottom: '35px' }}>
                <p style={{ color: '#fff', fontWeight: 400, marginBottom: '10px', letterSpacing: '0.05em' }}>{addr.first_name} {addr.last_name}</p>
                <p>{addr.street}</p>
                <p>{addr.city}, {addr.state} {addr.postal_code}</p>
                <p style={{ marginTop: '5px' }}>{addr.country}</p>
              </div>

              <div style={{ display: 'flex', gap: '15px', marginTop: 'auto', flexWrap: 'wrap' }}>
                <button onClick={() => handleOpenModal(addr)} className={styles.secondaryBtn} style={{ padding: '12px 20px', fontSize: '0.75rem', flex: 1 }}>Edit</button>
                <button onClick={() => handleDelete(addr.id)} className={styles.secondaryBtn} style={{ padding: '12px 20px', fontSize: '0.75rem', flex: 1, borderColor: 'transparent', color: '#ef4444' }}>Remove</button>
                {!addr.is_default && (
                  <button onClick={() => handleSetDefault(addr.id)} className={styles.secondaryBtn} style={{ padding: '12px 20px', fontSize: '0.75rem', width: '100%', marginTop: '5px' }}>
                    Set As Default
                  </button>
                )}
              </div>
            </motion.div>
          ))}

          <motion.div 
            onClick={() => handleOpenModal()}
            className={styles.addAddressCard}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: addresses.length * 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className={styles.addAddressIcon}>+</div>
            <span style={{ fontSize: '0.85rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Add New Address</span>
          </motion.div>

        </motion.div>
      )}

      {/* Address Modal Overlay */}
      <AnimatePresence>
        {isModalOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div 
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
            />
            <motion.div 
              style={{ background: '#0a0a0a', padding: '50px', width: '100%', maxWidth: '650px', position: 'relative', zIndex: 10, border: '1px solid rgba(212,175,55,0.3)', maxHeight: '90vh', overflowY: 'auto' }}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
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

                <div className={styles.formGroup} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <input 
                    type="checkbox" 
                    name="is_default" 
                    checked={formData.is_default} 
                    onChange={handleChange} 
                    id="isDefault" 
                    style={{ accentColor: '#D4AF37', width: '18px', height: '18px' }}
                  />
                  <label htmlFor="isDefault" style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.05em' }}>Set as default address</label>
                </div>

                <div style={{ display: 'flex', gap: '20px', marginTop: '40px' }}>
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

    </motion.div>
  );
};

export default Addresses;
