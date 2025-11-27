'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

interface AnimatedGradientProps {
  className?: string;
  colors?: string[];
  size?: number;
  speed?: 'slow' | 'medium' | 'fast';
}

export default function AnimatedGradient({
  className = '',
  colors = ['#6366f1', '#8b5cf6', '#ec4899'],
  size = 400,
  speed = 'slow',
}: AnimatedGradientProps) {
  const gradientRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!gradientRef.current) return;

      // Different speeds for different gradients
      const duration = speed === 'slow' ? 30 : speed === 'medium' ? 20 : 15;
      const movement = speed === 'slow' ? 50 : speed === 'medium' ? 80 : 100;

      // Gentle X-axis movement (slower)
      gsap.to(gradientRef.current, {
        x: `+=${movement}`,
        duration: duration,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      // Gentle Y-axis movement (different timing)
      gsap.to(gradientRef.current, {
        y: `+=${movement}`,
        duration: duration * 1.2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      // Enhanced liquid motion - smoother scale animation
      gsap.to(gradientRef.current, {
        keyframes: [
          { scale: 1 },
          { scale: 1.15 },
          { scale: 1.05 },
          { scale: 1.1 },
        ],
        duration: duration * 0.8,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
      
      // Add rotation for more dynamic effect
      gsap.to(gradientRef.current, {
        rotation: 360,
        duration: duration * 2,
        repeat: -1,
        ease: 'none',
      });
    },
    { scope: gradientRef }
  );

  const gradientStyle = {
    background: `radial-gradient(circle, ${colors.join(', ')})`,
    width: `${size}px`,
    height: `${size}px`,
  };

  return (
    <div
      ref={gradientRef}
      className={`absolute rounded-full blur-3xl opacity-30 ${className}`}
      style={gradientStyle}
    />
  );
}
