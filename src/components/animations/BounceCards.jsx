import React from 'react';
import { motion } from 'framer-motion';

const BounceCards = ({ images = [] }) => {
  return (
    <div style={{ position: 'relative', width: '100%', height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {images.map((img, index) => {
        // Calculate spread
        const isCenter = index === Math.floor(images.length / 2);
        const offset = index - Math.floor(images.length / 2);
        const rotate = offset * 8;
        const xOffset = offset * 60;
        const yOffset = Math.abs(offset) * 20;

        return (
          <motion.div
            key={index}
            initial={{ 
              rotate: 0, 
              x: 0, 
              y: 0,
              scale: 0.8,
              opacity: 0
            }}
            whileInView={{
              rotate: rotate,
              x: xOffset,
              y: yOffset,
              scale: 1,
              opacity: 1
            }}
            whileHover={{
              scale: 1.1,
              y: yOffset - 30,
              zIndex: 10,
              transition: { duration: 0.3 }
            }}
            viewport={{ once: true }}
            transition={{ 
              type: 'spring', 
              stiffness: 100, 
              damping: 12,
              delay: index * 0.1
            }}
            style={{
              position: 'absolute',
              width: '280px',
              height: '400px',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              border: '1px solid var(--border-color)',
              zIndex: images.length - Math.abs(offset)
            }}
          >
            <img src={img.src} alt={img.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '100%',
              padding: '20px',
              background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
              color: 'white',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '14px', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {img.label}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default BounceCards;
