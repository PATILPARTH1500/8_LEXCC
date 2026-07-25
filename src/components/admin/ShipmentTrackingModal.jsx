import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ShipmentTrackingModal = ({ isOpen, onClose, order, onSave, onMarkShipped }) => {
  const [carrier, setCarrier] = useState(order?.carrier || '');
  const [trackingNumber, setTrackingNumber] = useState(order?.tracking_number || '');

  if (!isOpen || !order) return null;

  const steps = [
    { label: 'Order Created', date: order.created_at, completed: true },
    { label: 'Payment Received', date: order.paid_at || order.created_at, completed: order.payment_status === 'paid' || order.status !== 'pending' },
    { label: 'Processing', date: order.created_at, completed: ['processing', 'shipped', 'delivered'].includes(order.status) },
    { label: 'Shipped', date: order.shipped_at, completed: ['shipped', 'delivered'].includes(order.status) },
    { label: 'Delivered', date: order.delivered_at, completed: order.status === 'delivered' },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(5px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          style={{
            background: '#0F0F0F',
            border: '1px solid rgba(212, 175, 55, 0.2)',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '40px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <h2 style={{ fontSize: '1.2rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#D4AF37', fontWeight: 400 }}>
              Order #{order.order_number}
            </h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
          </div>

          <div style={{ marginBottom: '40px' }}>
            <h3 style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '20px' }}>Order Timeline</h3>
            <div style={{ position: 'relative', paddingLeft: '20px' }}>
              <div style={{ position: 'absolute', left: '4px', top: '5px', bottom: '5px', width: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
              {steps.map((step, idx) => (
                <div key={idx} style={{ position: 'relative', marginBottom: '20px', display: 'flex', alignItems: 'flex-start' }}>
                  <div style={{ 
                    position: 'absolute', 
                    left: '-20px', 
                    top: '4px', 
                    width: '9px', 
                    height: '9px', 
                    borderRadius: '50%', 
                    background: step.completed ? '#D4AF37' : '#222',
                    border: `2px solid ${step.completed ? '#D4AF37' : 'rgba(255,255,255,0.2)'}`,
                    zIndex: 1
                  }}></div>
                  <div>
                    <p style={{ color: step.completed ? '#fff' : 'rgba(255,255,255,0.4)', fontSize: '0.9rem', fontWeight: 500 }}>
                      {step.label}
                    </p>
                    {step.date && step.completed && (
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', marginTop: '4px' }}>
                        {new Date(step.date).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '20px' }}>Shipment Details</h3>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#fff', fontSize: '0.85rem', marginBottom: '8px' }}>Carrier</label>
              <input 
                type="text" 
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                placeholder="e.g. Blue Dart"
                style={{ width: '100%', padding: '12px 15px', background: '#000', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', outline: 'none' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#fff', fontSize: '0.85rem', marginBottom: '8px' }}>Tracking Number</label>
              <input 
                type="text" 
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Enter AWB or Tracking ID"
                style={{ width: '100%', padding: '12px 15px', background: '#000', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
            <button 
              onClick={() => onSave(order.id, carrier, trackingNumber)}
              style={{ padding: '12px 20px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', cursor: 'pointer', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.1em' }}
            >
              Save Shipment
            </button>
            <button 
              onClick={() => onMarkShipped(order.id, carrier, trackingNumber)}
              style={{ padding: '12px 20px', background: '#D4AF37', border: 'none', color: '#000', cursor: 'pointer', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.1em', fontWeight: 600 }}
            >
              Mark As Shipped
            </button>
          </div>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ShipmentTrackingModal;
