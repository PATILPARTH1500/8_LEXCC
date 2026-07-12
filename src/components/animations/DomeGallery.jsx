import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const DomeGallery = ({ images = [] }) => {
  const containerRef = useRef(null);
  const galleryRef = useRef(null);

  useEffect(() => {
    const panels = gsap.utils.toArray(galleryRef.current.children);
    if (panels.length === 0) return;

    // Use GSAP context for strict scoping and cleanup
    const ctx = gsap.context(() => {
      gsap.to(panels, {
        xPercent: -100 * (panels.length - 1),
        ease: 'none',
        scrollTrigger: {
          trigger: containerRef.current,
          pin: true,
          scrub: 0.5, // Reduced scrub duration for immediate feedback/less lag
          // Removed snapping as it often causes page jumping and scroll conflicts
          end: () => `+=${galleryRef.current.offsetWidth - window.innerWidth}`,
          invalidateOnRefresh: true, // Recalculates on resize to prevent visual breaking
        }
      });
    }, containerRef);

    return () => {
      ctx.revert(); // Reverts all animations and kills ScrollTriggers created in context
    };
  }, [images]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100vh', overflow: 'hidden', backgroundColor: '#000', display: 'flex', alignItems: 'center' }}>
      <div ref={galleryRef} style={{ display: 'flex', height: '70vh', gap: '30px', padding: '0 5vw', willChange: 'transform' }}>
        {images.map((img, index) => (
          <div key={index} style={{ 
            minWidth: '55vw', 
            height: '100%',
            position: 'relative',
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1px solid var(--border-color)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
          }}>
            <img src={img} alt={`Editorial ${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.15)', pointerEvents: 'none' }} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default DomeGallery;
