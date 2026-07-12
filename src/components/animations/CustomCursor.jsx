import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

const CustomCursor = () => {
  const [isHovering, setIsHovering] = useState(false);
  const [hoverText, setHoverText] = useState('');

  // Use Motion Values to avoid re-rendering the component on every mouse move
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const springConfig = { damping: 40, stiffness: 400, mass: 0.3 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    const updateMousePosition = (e) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    const handleMouseOver = (e) => {
      const target = e.target;
      const closestInteractive = target.closest('a, button, [data-cursor]');
      
      if (closestInteractive) {
        setIsHovering(true);
        const text = closestInteractive.getAttribute('data-cursor') || 
                     (closestInteractive.tagName === 'A' ? 'VIEW' : 'SHOP');
        setHoverText(text);
      } else {
        setIsHovering(false);
        setHoverText('');
      }
    };

    window.addEventListener('mousemove', updateMousePosition);
    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, [cursorX, cursorY]);

  // Style properties mapped directly to Motion Values
  return (
    <motion.div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: isHovering ? 80 : 24,
        height: isHovering ? 80 : 24,
        borderRadius: '50%',
        border: '1.5px solid #D4AF37',
        backgroundColor: isHovering ? 'rgba(212, 175, 55, 0.05)' : 'transparent',
        pointerEvents: 'none',
        zIndex: 99999,
        x: cursorXSpring,
        y: cursorYSpring,
        // Center the cursor
        translateX: isHovering ? -40 : -12,
        translateY: isHovering ? -40 : -12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        mixBlendMode: isHovering ? 'normal' : 'difference',
      }}
      animate={{
        scale: isHovering ? 1 : 0.8,
      }}
      transition={{ duration: 0.2 }}
    >
      {isHovering && (
        <span
          style={{
            color: '#D4AF37',
            fontSize: '9px',
            fontWeight: 800,
            letterSpacing: '0.15em',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
          }}
        >
          {hoverText}
        </span>
      )}
    </motion.div>
  );
};

export default CustomCursor;
