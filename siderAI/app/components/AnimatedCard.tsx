'use client';

import { ReactNode, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface AnimatedCardProps {
  children: ReactNode;
  index?: number;
  className?: string;
  delay?: number;
  animationType?: 'fade' | 'slide-up' | 'slide-left' | 'slide-right' | 'scale' | 'flip';
}

export default function AnimatedCard({
  children,
  index = 0,
  className = '',
  delay = 0,
  animationType = 'fade',
}: AnimatedCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!cardRef.current) return;

      let animationProps = {};
      
      switch (animationType) {
        case 'fade':
          animationProps = { opacity: 0 };
          break;
        case 'slide-up':
          animationProps = { opacity: 0, y: 50 };
          break;
        case 'slide-left':
          animationProps = { opacity: 0, x: -50 };
          break;
        case 'slide-right':
          animationProps = { opacity: 0, x: 50 };
          break;
        case 'scale':
          animationProps = { opacity: 0, scale: 0.9 };
          break;
        case 'flip':
          animationProps = { opacity: 0, rotationY: -90 };
          break;
        default:
          animationProps = { opacity: 0, y: 30 };
      }

      gsap.from(cardRef.current, {
        ...animationProps,
        duration: 0.8,
        delay: delay + index * 0.1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: cardRef.current,
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
      });

      // Hover: gentle scale and lift (NO rotation)
      const handleMouseEnter = () => {
        gsap.to(cardRef.current, {
          scale: 1.03,
          y: -8,
          duration: 0.3,
          ease: 'power2.out',
        });
      };

      const handleMouseLeave = () => {
        gsap.to(cardRef.current, {
          scale: 1,
          y: 0,
          duration: 0.3,
          ease: 'power2.out',
        });
      };

      const card = cardRef.current;
      card.addEventListener('mouseenter', handleMouseEnter);
      card.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        card.removeEventListener('mouseenter', handleMouseEnter);
        card.removeEventListener('mouseleave', handleMouseLeave);
      };
    },
    { scope: cardRef }
  );

  return (
    <motion.div
      ref={cardRef}
      className={className}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {children}
    </motion.div>
  );
}
