'use client';

import { useRef, useEffect, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface AnimatedTextProps {
  text: string;
  type?: 'reveal' | 'fade' | 'slide' | 'scale' | 'typewriter';
  splitBy?: 'letter' | 'word' | 'line';
  delay?: number;
  duration?: number;
  stagger?: number;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
  onComplete?: () => void;
  trigger?: 'scroll' | 'always';
  scrollTrigger?: {
    start?: string;
    end?: string;
    toggleActions?: string;
  };
}

export default function AnimatedText({
  text,
  type = 'reveal',
  splitBy = 'word',
  delay = 0,
  duration = 0.8,
  stagger = 0.05,
  className = '',
  as: Component = 'span',
  onComplete,
  trigger = 'always',
  scrollTrigger,
}: AnimatedTextProps) {
  const textRef = useRef<HTMLElement>(null);
  const [mounted, setMounted] = useState(false);
  const [splitElements, setSplitElements] = useState<HTMLElement[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Manual text splitting (no premium plugin needed)
  useEffect(() => {
    if (!textRef.current || !mounted) return;

    const element = textRef.current;
    const originalText = element.textContent || '';
    
    // Clear existing content
    element.innerHTML = '';

    if (splitBy === 'letter') {
      // Split by letters
      const letters = originalText.split('').map((char, index) => {
        if (char === ' ') {
          return { char: '\u00A0', isSpace: true, index };
        }
        return { char, isSpace: false, index };
      });

      letters.forEach(({ char, isSpace }) => {
        const span = document.createElement('span');
        span.textContent = char;
        span.style.display = 'inline-block';
        span.style.color = 'inherit';
        if (isSpace) {
          span.style.width = '0.35em';
        }
        element.appendChild(span);
      });
    } else if (splitBy === 'word') {
      // Split by words
      const words = originalText.split(/\s+/).filter(word => word.length > 0);
      words.forEach((word, index) => {
        const span = document.createElement('span');
        span.textContent = word;
        span.style.display = 'inline-block';
        span.style.whiteSpace = 'pre';
        span.style.color = 'inherit';
        if (index < words.length - 1) {
          span.style.marginRight = '0.35em';
        }
        element.appendChild(span);
      });
    } else {
      // Split by lines (just use the whole text)
      const span = document.createElement('span');
      span.textContent = originalText;
      element.appendChild(span);
    }

    // Get all split elements
    const elements = Array.from(element.children) as HTMLElement[];
    setSplitElements(elements);
  }, [text, splitBy, mounted]);

  useGSAP(
    () => {
      if (!textRef.current || !mounted || splitElements.length === 0) return;

      // Check if prefers-reduced-motion
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (prefersReducedMotion) {
        gsap.set(splitElements, { opacity: 1 });
        return;
      }

      // Set initial states based on animation type
      switch (type) {
        case 'reveal':
          gsap.set(splitElements, { opacity: 0, y: 20 });
          break;
        case 'fade':
          gsap.set(splitElements, { opacity: 0 });
          break;
        case 'slide':
          gsap.set(splitElements, { opacity: 0, x: -30 });
          break;
        case 'scale':
          gsap.set(splitElements, { opacity: 0, scale: 0.5 });
          break;
        case 'typewriter':
          gsap.set(splitElements, { opacity: 0 });
          break;
      }

      // Animate based on type
      const timelineOptions: gsap.TimelineVars = {
        delay,
        onComplete,
      };

      // Add scroll trigger if specified
      if (trigger === 'scroll' && scrollTrigger) {
        // Ensure parent has relative positioning for ScrollTrigger
        const parent = textRef.current?.parentElement;
        if (parent && window.getComputedStyle(parent).position === 'static') {
          parent.style.position = 'relative';
        }
        
        timelineOptions.scrollTrigger = {
          trigger: textRef.current,
          start: scrollTrigger.start || 'top 80%',
          end: scrollTrigger.end || 'bottom 20%',
          toggleActions: scrollTrigger.toggleActions || 'play none none reverse',
        };
      }

      const tl = gsap.timeline(timelineOptions);

      switch (type) {
        case 'reveal':
          tl.to(splitElements, {
            opacity: 1,
            y: 0,
            duration: duration / splitElements.length,
            stagger: stagger,
            ease: 'power3.out',
          });
          break;
        case 'fade':
          tl.to(splitElements, {
            opacity: 1,
            duration: duration / splitElements.length,
            stagger: stagger,
            ease: 'power2.out',
          });
          break;
        case 'slide':
          splitElements.forEach((el, i) => {
            gsap.fromTo(el, 
              { opacity: 0, x: -30, rotation: 0 },
              {
                opacity: 1,
                x: 0,
                rotation: 0,
                duration: duration / splitElements.length,
                delay: delay + i * stagger,
                ease: 'power3.out',
              }
            );
            // Add subtle rotation for kinetic effect
            gsap.to(el, {
              rotation: 2,
              duration: duration / splitElements.length / 2,
              delay: delay + i * stagger + duration / splitElements.length / 2,
              yoyo: true,
              repeat: 1,
              ease: 'sine.inOut',
            });
          });
          break;
        case 'scale':
          splitElements.forEach((el, i) => {
            gsap.fromTo(el,
              { opacity: 0, scale: 0.5, y: 10 },
              {
                opacity: 1,
                scale: 1,
                y: 0,
                duration: duration / splitElements.length,
                delay: delay + i * stagger,
                ease: 'elastic.out(1, 0.5)',
              }
            );
          });
          break;
        case 'typewriter':
          tl.to(splitElements, {
            opacity: 1,
            duration: duration / splitElements.length,
            stagger: stagger,
            ease: 'none',
          });
          break;
      }
    },
    { scope: textRef, dependencies: [mounted, splitElements, type, delay, duration, stagger] }
  );

  // Don't render split text until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <Component className={className} style={{ color: 'inherit' }}>
        {text}
      </Component>
    );
  }

  return (
    <Component ref={textRef as any} className={className} style={{ color: 'inherit' }}>
      {text}
    </Component>
  );
}

