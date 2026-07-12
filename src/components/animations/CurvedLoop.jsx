import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';

const CurvedLoop = ({ text = "LEXCC • DEFINE THE STANDARD • ", className = '' }) => {
  const textRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    // Use GSAP context for proper memory cleanup on unmount
    const ctx = gsap.context(() => {
      gsap.to(textRef.current, {
        attr: { startOffset: '-100%' },
        ease: 'none',
        duration: 20,
        repeat: -1,
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className={className} style={{ width: '100%', overflow: 'hidden', display: 'flex', justifyContent: 'center' }}>
      <svg width="100%" height="150" viewBox="0 0 1000 150" style={{ pointerEvents: 'none' }}>
        <path
          id="curve"
          d="M 0,75 Q 500,150 1000,75"
          fill="transparent"
        />
        <text style={{ fontSize: '24px', fill: 'var(--accent-color)', fontWeight: 'bold', letterSpacing: '0.15em', opacity: 0.3 }}>
          <textPath href="#curve" ref={textRef} startOffset="0%">
            {text.repeat(6)}
          </textPath>
        </text>
      </svg>
    </div>
  );
};

export default CurvedLoop;
