'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import Lottie from 'lottie-react';
import { useInView } from 'framer-motion';

interface LottieAnimationProps {
  src: string | object;
  className?: string;
  autoplay?: boolean;
  loop?: boolean | number;
  speed?: number;
  width?: number | string;
  height?: number | string;
  trigger?: 'hover' | 'scroll' | 'click' | 'always';
  onComplete?: () => void;
  fallback?: React.ReactNode;
  controls?: boolean;
}

export default function LottieAnimation({
  src,
  className = '',
  autoplay = true,
  loop = true,
  speed = 1,
  width,
  height,
  trigger = 'always',
  onComplete,
  fallback,
  controls = false,
}: LottieAnimationProps) {
  // ALL HOOKS MUST BE CALLED FIRST - before any conditional returns
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(autoplay && trigger === 'always');
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [animationData, setAnimationData] = useState<any>(null);
  const animationRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-100px' });

  // Memoize dotLottie check - MUST be before any early returns
  const isDotLottie = useMemo(() => {
    const isUrl = typeof src === 'string';
    return isUrl && src.endsWith('.lottie');
  }, [src]);

  const isUrl = useMemo(() => typeof src === 'string', [src]);
  const isObject = useMemo(() => typeof src === 'object', [src]);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      setPrefersReducedMotion(
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      );
    }
  }, []);

  // Fetch animation data for URL sources
  useEffect(() => {
    if (mounted && isUrl && !isDotLottie && typeof src === 'string') {
      fetch(src)
        .then((res) => {
          if (!res.ok) throw new Error('Failed to load animation');
          return res.json();
        })
        .then((data) => {
          setAnimationData(data);
          setError(false);
        })
        .catch(() => setError(true));
    } else if (isObject) {
      setAnimationData(src);
      setError(false);
    }
  }, [src, mounted, isUrl, isDotLottie, isObject]);

  useEffect(() => {
    if (!mounted || prefersReducedMotion) return;

    if (trigger === 'scroll' && isInView && !isPlaying) {
      setIsPlaying(true);
    }
  }, [isInView, trigger, mounted, isPlaying, prefersReducedMotion]);

  // Preload animation only for above-the-fold content that's visible immediately
  // Removed aggressive preloading to avoid browser warnings
  // The animation will load naturally when needed

  // Event handlers (not hooks, can be after hooks)
  const handleMouseEnter = () => {
    if (trigger === 'hover' && animationRef.current) {
      animationRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleMouseLeave = () => {
    if (trigger === 'hover' && animationRef.current) {
      animationRef.current.stop();
      setIsPlaying(false);
    }
  };

  const handleClick = () => {
    if (trigger === 'click' && animationRef.current) {
      animationRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete();
    }
    if (!loop) {
      setIsPlaying(false);
    }
  };

  // NOW we can do early returns after all hooks
  if (prefersReducedMotion && fallback) {
    return <>{fallback}</>;
  }

  if (!mounted) {
    return fallback ? <>{fallback}</> : <div style={{ width: width || '100%', height: height || '100%' }} />;
  }

  if (error) {
    return fallback ? <>{fallback}</> : <div style={{ width: width || '100%', height: height || '100%' }} />;
  }

  const animationProps = {
    className,
    style: {
      width: width || '100%',
      height: height || '100%',
    },
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onClick: handleClick,
  };

  try {
    if (isDotLottie) {
      // For dotLottie format, use regular Lottie fallback for now
      // DotLottie support can be added later if needed
      return fallback ? <>{fallback}</> : null;
    }

    // For URL sources, wait for animation data to load
    // Always show fallback while loading if available
    if (isUrl && !animationData && !error) {
      return fallback ? <>{fallback}</> : <div style={{ width: width || '100%', height: height || '100%' }} />;
    }

    // Render Lottie animation
    const dataToUse = isObject ? src : animationData;
    if (!dataToUse) {
      return fallback ? <>{fallback}</> : null;
    }

    return (
      <div ref={containerRef} {...animationProps}>
        <Lottie
          lottieRef={animationRef}
          animationData={dataToUse}
          loop={loop}
          autoplay={isPlaying}
          style={{
            width: width || '100%',
            height: height || '100%',
          }}
          onComplete={handleComplete}
          onError={() => setError(true)}
          onDataReady={() => {
            setError(false);
            // Trigger onComplete callback when data is ready (for icons that need to know when loaded)
            if (onComplete && trigger === 'hover') {
              // Small delay to ensure animation is ready
              setTimeout(() => {
                if (onComplete) onComplete();
              }, 100);
            }
          }}
        />
      </div>
    );
  } catch (err) {
    setError(true);
    return fallback ? <>{fallback}</> : null;
  }
}
