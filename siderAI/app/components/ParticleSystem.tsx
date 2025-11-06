'use client';

import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

interface ParticleSystemProps {
  className?: string;
  count?: number;
  colors?: string[];
  size?: { min: number; max: number };
}

interface Particle {
  id: number;
  left: number;
  top: number;
  size: number;
  color: string;
  duration: number;
  delay: number;
}

export default function ParticleSystem({
  className = '',
  count = 30,
  colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b'],
  size = { min: 2, max: 8 },
}: ParticleSystemProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const generatedParticles = Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: size.min + Math.random() * (size.max - size.min),
      color: colors[Math.floor(Math.random() * colors.length)],
      duration: 15 + Math.random() * 10,
      delay: Math.random() * 5,
    }));
    setParticles(generatedParticles);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, count]);

  useGSAP(
    () => {
      if (!containerRef.current || particles.length === 0) return;

      const particlesElements = containerRef.current.children;

      Array.from(particlesElements).forEach((particle, i) => {
        const particleElement = particle as HTMLElement;
        const config = particles[i];
        if (!config) return;

        // Create timeline for keyframe animation
        const tl = gsap.timeline({ repeat: -1, yoyo: true, ease: 'sine.inOut', delay: config.delay });
        
        tl.to(particleElement, {
          x: `+=${(Math.random() - 0.5) * 200}`,
          y: `+=${(Math.random() - 0.5) * 200}`,
          opacity: 0.6,
          scale: 1.5,
          duration: config.duration / 2,
        })
        .to(particleElement, {
          opacity: 0.2,
          scale: 1,
          duration: config.duration / 2,
        });
      });
    },
    { scope: containerRef, dependencies: [particles] }
  );

  if (!mounted || particles.length === 0) {
    return (
      <div
        ref={containerRef}
        className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
    >
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            background: `radial-gradient(circle, ${particle.color}, transparent)`,
            opacity: 0.3,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, 20, 0],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
