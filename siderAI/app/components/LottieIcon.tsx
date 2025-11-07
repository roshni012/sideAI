'use client';

import { useState } from 'react';
import LottieAnimation from './LottieAnimation';
import { LucideIcon } from 'lucide-react';

interface LottieIconProps {
  src: string | object;
  fallbackIcon: LucideIcon;
  size?: number;
  className?: string;
  trigger?: 'hover' | 'scroll' | 'always';
  loop?: boolean;
  colors?: {
    primary?: string;
    secondary?: string;
  };
}

export default function LottieIcon({
  src,
  fallbackIcon: FallbackIcon,
  size = 24,
  className = '',
  trigger = 'hover',
  loop = true,
  colors,
}: LottieIconProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // For hover trigger, always show fallback icon initially
  const showFallback = trigger === 'hover' || !isLoaded || hasError;

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Always show fallback icon when needed (hover trigger or not loaded) */}
      {showFallback && (
        <FallbackIcon 
          size={size} 
          className={`absolute ${trigger === 'hover' ? 'opacity-100' : 'opacity-60'} ${className}`}
          style={{ zIndex: trigger === 'hover' ? 1 : 0 }}
        />
      )}
      <div className="relative" style={{ width: size, height: size, zIndex: 2 }}>
        <LottieAnimation
          src={src}
          width={size}
          height={size}
          trigger={trigger}
          loop={loop}
          fallback={null}
          onComplete={() => {
            setIsLoaded(true);
            if (!loop) {
              setHasError(true);
            }
          }}
        />
      </div>
    </div>
  );
}

