import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import CustomSelect from '../../components/ui/CustomSelect';
import { useAccountStyles } from './useAccountStyles';
import { INDIAN_STATES, isValidPinCode, isValidIndianPhone, normalizePhone, getEmptyAddress } from '../../utils/address';

const Addresses = () => {
  const styles = useAccountStyles();
  const { fetchAddresses, addAddress, updateAddress, deleteAddress } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState(getEmptyAddress());

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

  useEffect(() => {
    if (!isModalOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isModalOpen]);

  const handleOpenModal = (address = null) => {
    if (address) {
      setEditingAddress(address);
      setFormData(address);
    } else {
      setEditingAddress(null);
      setFormData({
        ...getEmptyAddress(),
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
    if (!isValidPinCode(formData.postal_code)) {
      alert('Please enter a valid 6-digit PIN code.');
      return;
    }
    if (!isValidIndianPhone(formData.phone)) {
      alert('Please enter a valid 10-digit Indian phone number.');
      return;
    }
    
    const submissionData = {
      ...formData,
      phone: normalizePhone(formData.phone),
      country: 'India' // Enforce India
    };

    try {
      if (editingAddress) {
        await updateAddress(editingAddress.id, submissionData);
      } else {
        await addAddress(submissionData);
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
              <div className={styles.addressCardHeader}>
                <h3 className={styles.addressType}>{addr.title}</h3>
                {addr.is_default && <span className={`${styles.badge} ${styles.badgeSuccess}`}>Default Address</span>}
              </div>
              
              <div className={styles.addressCopy}>
                <p className={styles.addressName}>{addr.first_name} {addr.last_name}</p>
                {addr.phone && <p>{addr.phone}</p>}
                <p>{addr.street}</p>
                {addr.address_line_2 && <p>{addr.address_line_2}</p>}
                <p>{addr.city}, {addr.state} {addr.postal_code}</p>
                <p className={styles.addressCountry}>{addr.country}</p>
              </div>

              <div className={styles.addressActions}>
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
            <span className={styles.addAddressLabel}>Add New Address</span>
          </motion.div>

        </motion.div>
      )}

      {/* Address Modal Overlay */}
      {createPortal(
        <AnimatePresence>
          {isModalOpen && (
            <div className={styles.modalOverlay}>
            <motion.div 
              className={styles.modalBackdrop}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
            />
            <motion.div 
              className={styles.modalContainer}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <h2 className={styles.cardTitle}>{editingAddress ? 'Edit Address' : 'Add New Address'}</h2>
              
              <form onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Address Type</label>
                  <CustomSelect name="title" value={formData.title} onChange={handleChange} className={styles.formInput} required>
                    <option value="HOME">HOME</option>
                    <option value="WORK">WORK</option>
                    <option value="OTHER">OTHER</option>
                  </CustomSelect>
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
                  <label className={styles.formLabel}>Phone Number</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={styles.formInput} required />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Address Line 1 (Street)</label>
                  <input type="text" name="street" value={formData.street} onChange={handleChange} className={styles.formInput} required />
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Address Line 2 / Landmark (Optional)</label>
                  <input type="text" name="address_line_2" value={formData.address_line_2} onChange={handleChange} className={styles.formInput} />
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>City</label>
                    <input type="text" name="city" value={formData.city} onChange={handleChange} className={styles.formInput} required />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>State / Province</label>
                    <CustomSelect name="state" value={formData.state} onChange={handleChange} className={styles.formInput} required>
                      <option value="">Select State</option>
                      {INDIAN_STATES.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </CustomSelect>
                  </div>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>PIN Code</label>
                    <input type="text" name="postal_code" value={formData.postal_code} onChange={handleChange} className={styles.formInput} maxLength="6" required />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Country</label>
                    <input type="text" name="country" value="India" className={styles.formInput} readOnly />
                  </div>
                </div>

                <div className={`${styles.formGroup} ${styles.defaultToggle}`}>
                  <input 
                    type="checkbox" 
                    name="is_default" 
                    checked={formData.is_default} 
                    onChange={handleChange} 
                    id="isDefault" 
                    className={styles.defaultCheckbox}
                  />
                  <label htmlFor="isDefault" className={styles.defaultLabel}>Set as default address</label>
                </div>

                <div className={styles.modalActions}>
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
        </AnimatePresence>,
        document.body
      )}

    </motion.div>
  );
};

export default Addresses;
