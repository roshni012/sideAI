                                                                                                                                                                                                                                                                                                                                                                                                              'use client';

import { ReactNode, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

interface FloatingIconProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  amplitude?: number;
}

export default function FloatingIcon({
  children,
  delay = 0,
  duration = 3,
  amplitude = 10,
}: FloatingIconProps) {
  const iconRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!iconRef.current) return;

      // Gentle floating only - NO rotation
      gsap.to(iconRef.current, {
        y: amplitude,
        duration: duration,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: delay,
      });
    },
    { scope: iconRef }
  );

  return (
    <div ref={iconRef} className="inline-block">
      {children}
    </div>
  );
}
