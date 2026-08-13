import React, { useEffect, useState, useCallback } from 'react';

export const AmbientBackdrop: React.FC = () => {
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
    <div className="ambient" aria-hidden="true">
      <div className="ambient__grid" />
      <div className="ambient__blob-a" />
      <div className="ambient__blob-b" />
      <div className="ambient__grain" />
      <div
        className="ambient__glow"
        style={{
          left: mousePos.x,
          top: mousePos.y,
          opacity: isVisible ? 1 : 0,
        }}
      />
    </div>
  );
};

export default AmbientBackdrop;
