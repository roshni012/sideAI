'use client';

import { ReactNode, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

interface AnimatedButtonProps {
  children: ReactNode;
  href?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => void;
  variant?: 'primary' | 'secondary';
  className?: string;
}

export default function AnimatedButton({
  children,
  href,
  onClick,
  variant = 'primary',
  className = '',
}: AnimatedButtonProps) {
  const buttonRef = useRef<HTMLAnchorElement | HTMLButtonElement>(null);

  useGSAP(
    () => {
      if (!buttonRef.current) return;

      // Simple fade-in (no rotation, no continuous animation)
      gsap.from(buttonRef.current, {
        opacity: 0,
        scale: 0.95,
        y: 10,
        duration: 0.5,
        ease: 'power2.out',
      });
    },
    { scope: buttonRef }
  );

  const baseClasses =
    variant === 'primary'
      ? 'px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full font-semibold text-lg flex items-center gap-2 shadow-xl hover:shadow-2xl transition-all backdrop-blur-sm relative overflow-hidden group'
      : 'px-8 py-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md text-gray-900 dark:text-white rounded-full font-semibold text-lg border-2 border-white/20 dark:border-gray-700/50 hover:border-indigo-500/50 transition-all shadow-lg hover:shadow-xl relative overflow-hidden group';

  const Component = href ? 'a' : 'button';

  return (
    <motion.div
      ref={buttonRef as any}
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      transition={{ 
        type: 'spring', 
        stiffness: 400, 
        damping: 17,
        mass: 0.8
      }}
    >
      <Component
        href={href}
        onClick={onClick}
        className={`${baseClasses} ${className}`}
      >
        {/* Liquid motion overlay effect */}
        <span className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
        <span className="relative z-10 flex items-center gap-2">
          {children}
        </span>
      </Component>
    </motion.div>
  );
}
