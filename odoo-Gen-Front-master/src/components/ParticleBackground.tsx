import React, { useEffect, useState, useCallback } from 'react';

const ParticleBackground: React.FC = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
    if (!isVisible) setIsVisible(true);
  }, [isVisible]);

  const handleMouseLeave = useCallback(() => {
    setIsVisible(false);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseLeave]);

  return (
    <>
      {/* Dot Matrix Grid */}
      <div className="dot-matrix-grid" />

      {/* Mouse Following Glow */}
      <div
        className="mouse-glow"
        style={{
          left: mousePos.x,
          top: mousePos.y,
          opacity: isVisible ? 1 : 0,
        }}
      />
    </>
  );
};

export default ParticleBackground;
