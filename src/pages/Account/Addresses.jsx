import React from 'react';
import styles from './Account.module.css';

const Addresses = () => {
  // Static for Phase 1 UI setup
  const addresses = [
    {
      id: 1,
      title: 'HOME',
      name: 'Parth Patil',
      street: '123 Luxury Avenue, Suite 400',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      country: 'United States',
      isDefault: true
    }
  ];

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Saved Addresses</h1>
        <p className={styles.pageSubtitle}>Manage your shipping and billing locations.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '30px' }}>
        
        {addresses.map(addr => (
          <div key={addr.id} className={styles.card} style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '0.9rem', letterSpacing: '0.1em', fontWeight: 600 }}>{addr.title}</h3>
              {addr.isDefault && <span className={`${styles.badge} ${styles.badgeSuccess}`}>Default</span>}
            </div>
            
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '30px' }}>
              <p style={{ color: '#fff', fontWeight: 500, marginBottom: '5px' }}>{addr.name}</p>
              <p>{addr.street}</p>
              <p>{addr.city}, {addr.state} {addr.zip}</p>
              <p>{addr.country}</p>
            </div>

            <div style={{ display: 'flex', gap: '15px', marginTop: 'auto' }}>
              <button className={styles.secondaryBtn} style={{ padding: '8px 16px', fontSize: '0.7rem', flex: 1 }}>Edit</button>
              <button className={styles.secondaryBtn} style={{ padding: '8px 16px', fontSize: '0.7rem', flex: 1, borderColor: 'transparent', color: '#ef4444' }}>Remove</button>
            </div>
          </div>
        ))}

        <button 
          className={styles.card} 
          style={{ margin: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'transparent', borderStyle: 'dashed', minHeight: '250px', cursor: 'pointer' }}
        >
          <span style={{ fontSize: '2rem', marginBottom: '10px', color: 'rgba(255,255,255,0.5)' }}>+</span>
          <span style={{ fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>Add New Address</span>
        </button>

      </div>
    </div>
  );
};

export default Addresses;
