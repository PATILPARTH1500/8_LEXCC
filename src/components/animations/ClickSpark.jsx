import React, { useRef, useEffect, useCallback } from 'react';

const ClickSpark = ({
  sparkColor = '#D4AF37',
  sparkSize = 10,
  sparkRadius = 15,
  sparkCount = 8,
  duration = 400,
  easing = 'ease-out',
  extraScale = 1.0,
  children,
  className = '',
  style = {}
}) => {
  const canvasRef = useRef(null);
  const sparksRef = useRef([]);
  const startTimeRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    let resizeTimeout;
    const handleResize = () => {
      const rect = parent.getBoundingClientRect();
      if (canvas.width !== rect.width || canvas.height !== rect.height) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(handleResize, 100);
    });

    resizeObserver.observe(parent);
    handleResize();

    return () => {
      resizeObserver.disconnect();
      clearTimeout(resizeTimeout);
    };
  }, []);

  const getEase = useCallback((t) => {
    switch (easing) {
      case 'linear':
        return t;
      case 'ease-in':
        return t * t;
      case 'ease-in-out':
        return t < 0.5 ? 2 * t * t : (4 - 2 * t) * t - 1;
      default: // ease-out
        return t * (2 - t);
    }
  }, [easing]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;

    const render = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      sparksRef.current = sparksRef.current.filter((spark) => {
        const elapsed = timestamp - spark.startTime;
        if (elapsed >= duration) return false;

        const progress = getEase(elapsed / duration);
        const currentRadius = progress * sparkRadius * extraScale;
        const currentSize = sparkSize * (1 - progress);

        const startX = spark.x + currentRadius * Math.cos(spark.angle);
        const startY = spark.y + currentRadius * Math.sin(spark.angle);
        const endX = spark.x + (currentRadius + currentSize) * Math.cos(spark.angle);
        const endY = spark.y + (currentRadius + currentSize) * Math.sin(spark.angle);

        ctx.strokeStyle = sparkColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        return true;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [sparkColor, sparkSize, sparkRadius, sparkCount, duration, getEase, extraScale]);

  const handleClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    
    // Support clientX/clientY for absolute positioning relative to viewport,
    // converted to relative coordinates inside target canvas.
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const now = performance.now();

    const newSparks = Array.from({ length: sparkCount }, (_, i) => ({
      x,
      y,
      angle: (2 * Math.PI * i) / sparkCount,
      startTime: now
    }));

    sparksRef.current.push(...newSparks);
  };

  return (
    <div
      onClick={handleClick}
      className={className}
      style={{
        position: 'relative',
        display: 'inline-block',
        width: '100%',
        ...style
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 99999
        }}
      />
      {children}
    </div>
  );
};

export default ClickSpark;
