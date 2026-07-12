import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

const Spotlight = ({ children, className = '', fill = 'rgba(212, 175, 55, 0.15)' }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);
  const divRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!divRef.current) return;
    const div = divRef.current;
    const rect = div.getBoundingClientRect();

    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className={className}
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      {/* Background Spotlight Layer */}
      <motion.div
        animate={{
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, ${fill}, transparent 40%)`,
          opacity
        }}
        transition={{ type: 'tween', ease: 'linear', duration: 0.2 }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          zIndex: 1
        }}
      />
      {/* Content */}
      <div style={{ position: 'relative', zIndex: 2, height: '100%', width: '100%' }}>
        {children}
      </div>
    </div>
  );
};

export default Spotlight;
