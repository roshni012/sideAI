'use client';

import { useRef, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

interface MorphingShapesProps {
  className?: string;
  count?: number;
  colors?: string[];
}

export default function MorphingShapes({
  className = '',
  count = 6,
  colors = ['#6366f1', '#8b5cf6', '#ec4899'],
}: MorphingShapesProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current) return;

      const shapes = containerRef.current.children;

      Array.from(shapes).forEach((shape, i) => {
        const shapeElement = shape as HTMLElement;
        const duration = 8 + i * 2;
        const delay = i * 1.5;

        gsap.to(shapeElement, {
          x: `+=${100 + i * 20}`,
          y: `+=${80 + i * 15}`,
          rotation: 360,
          scale: 1.2,
          duration: duration,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: delay,
        });

        // Enhanced morphing with more keyframes for liquid effect
        gsap.to(shapeElement, {
          keyframes: [
            { borderRadius: '50%', scale: 1 },
            { borderRadius: '40%', scale: 1.1 },
            { borderRadius: '30%', scale: 1.05 },
            { borderRadius: '50%', scale: 1 },
            { borderRadius: '20%', scale: 0.95 },
            { borderRadius: '50%', scale: 1 }
          ],
          duration: duration * 0.8,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: delay,
        });
      });
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      {Array.from({ length: count }).map((_, i) => {
        const size = 80 + i * 20;
        const color = colors[i % colors.length];
        const left = (i * 15) % 100;
        const top = (i * 20) % 100;

        return (
          <div
            key={i}
            className="absolute rounded-full opacity-20 blur-2xl"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              left: `${left}%`,
              top: `${top}%`,
              background: `radial-gradient(circle, ${color}, transparent)`,
            }}
          />
        );
      })}
    </div>
  );
}
