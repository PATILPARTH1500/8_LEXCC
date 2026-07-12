import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const TextReveal = ({ children, className = '', style = {} }) => {
  const containerRef = useRef(null);
  const textRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        textRef.current,
        { backgroundPositionX: '100%' },
        {
          backgroundPositionX: '0%',
          ease: 'none',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 85%',
            end: 'bottom 45%',
            scrub: 0.5, // Faster scrubbing for responsiveness
            invalidateOnRefresh: true,
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className={className}>
      <div
        ref={textRef}
        style={{
          background: 'linear-gradient(to right, var(--text-color) 50%, var(--border-color) 50%)',
          backgroundSize: '200% 100%',
          backgroundPositionX: '100%',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          color: 'transparent',
          willChange: 'background-position',
          ...style
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default TextReveal;
