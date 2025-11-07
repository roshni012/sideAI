'use client';

import { useRef, useState, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';
import { Chrome, ArrowRight, Sparkles } from 'lucide-react';
import AnimatedButton from './AnimatedButton';
import LottieAnimation from './LottieAnimation';
import AnimatedText from './AnimatedText';

gsap.registerPlugin(ScrollTrigger);

// Predefined particle positions to avoid hydration mismatch
const ctaParticleConfigs = [
  { width: 8, height: 10, left: 15, top: 20, opacity: 0.2 },
  { width: 12, height: 8, left: 85, top: 15, opacity: 0.15 },
  { width: 6, height: 14, left: 25, top: 60, opacity: 0.25 },
  { width: 10, height: 12, left: 70, top: 45, opacity: 0.2 },
  { width: 7, height: 11, left: 45, top: 80, opacity: 0.18 },
  { width: 9, height: 13, left: 90, top: 70, opacity: 0.22 },
  { width: 11, height: 7, left: 5, top: 50, opacity: 0.2 },
  { width: 13, height: 9, left: 60, top: 25, opacity: 0.15 },
  { width: 8, height: 10, left: 35, top: 75, opacity: 0.2 },
  { width: 14, height: 6, left: 75, top: 35, opacity: 0.18 },
];

export default function CTA() {
  const sectionRef = useRef<HTMLElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);
  const confettiRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useGSAP(
    () => {
      if (!sectionRef.current || !mounted) return;

      // Ensure section has relative positioning for ScrollTrigger
      if (window.getComputedStyle(sectionRef.current).position === 'static') {
        sectionRef.current.style.position = 'relative';
      }

      // Set initial states
      gsap.set(iconRef.current, { opacity: 0, scale: 0, y: -30 });
      gsap.set(subtitleRef.current, { opacity: 0, y: 20 });
      gsap.set(buttonRef.current, { opacity: 0, scale: 0.8, y: 20 });
      gsap.set('#cta-footer', { opacity: 0 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          toggleActions: 'play none none reverse',
        },
        immediateRender: false,
      });

      // Icon bounce-in (no rotation)
      tl.to(iconRef.current, {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.8,
        ease: 'back.out(1.7)',
      })
        // Subtitle fade-in
        .to(
          subtitleRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: 'power2.out',
          },
          '-=0.4'
        )
        // Button bounce-in
        .to(
          buttonRef.current,
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.8,
            ease: 'back.out(1.7)',
          },
          '-=0.3'
        )
        // Footer fade-in
        .to(
          '#cta-footer',
          {
            opacity: 1,
            duration: 0.6,
            ease: 'power2.out',
          },
          '-=0.2'
        );

      // Subtle pulse on icon (no rotation)
      gsap.to(iconRef.current, {
        scale: 1.1,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      // Gentle floating particles (no rotation)
      if (mounted && particlesRef.current) {
        const particles = particlesRef.current.children;
        Array.from(particles).forEach((particle, i) => {
          gsap.to(particle, {
            y: `+=${30 + i * 5}`,
            x: `+=${(i % 2 === 0 ? 1 : -1) * (15 + i * 2)}`,
            opacity: ctaParticleConfigs[i].opacity * 1.3,
            duration: 12 + i * 0.5,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            delay: i * 0.3,
          });
        });
      }

      // Pulsing background gradients
      gsap.to(sectionRef.current?.querySelector('.bg-pulse-1'), {
        scale: 1.15,
        opacity: 0.25,
        duration: 4,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      gsap.to(sectionRef.current?.querySelector('.bg-pulse-2'), {
        scale: 1.2,
        opacity: 0.2,
        duration: 5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    },
    { scope: sectionRef, dependencies: [mounted] }
  );

  return (
    <section
      id="get-started"
      ref={sectionRef}
      className="relative py-32 overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600"
    >
      {/* Animated background gradients */}
      <div className="absolute inset-0">
        <div className="bg-pulse-1 absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="bg-pulse-2 absolute bottom-0 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-white/5 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2" />
      </div>

      {/* Subtle floating particles - no rotation */}
      <div ref={particlesRef} className="absolute inset-0 pointer-events-none">
        {ctaParticleConfigs.map((config, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/20"
            style={{
              width: `${config.width}px`,
              height: `${config.height}px`,
              left: `${config.left}%`,
              top: `${config.top}%`,
              opacity: config.opacity,
            }}
            animate={{
              y: [0, 20, 0],
              opacity: [config.opacity, config.opacity * 1.3, config.opacity],
            }}
            transition={{
              duration: 6 + i * 0.3,
              repeat: Infinity,
              delay: i * 0.2,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          ref={iconRef}
          className="inline-block mb-8"
          style={{ opacity: 0 }}
          whileHover={{ scale: 1.1 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <div className="w-16 h-16 flex items-center justify-center">
            <LottieAnimation
              src="/lottie/celebration.json"
              width={64}
              height={64}
              loop={true}
              trigger="always"
              fallback={<Sparkles className="w-16 h-16 text-white drop-shadow-lg" />}
            />
          </div>
        </motion.div>

        {/* Confetti animation on button click */}
        {showConfetti && (
          <div
            ref={confettiRef}
            className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
          >
            <LottieAnimation
              src="/lottie/confetti.json"
              width="100%"
              height="100%"
              loop={false}
              trigger="always"
              fallback={null}
            />
          </div>
        )}

        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white drop-shadow-lg">
          <AnimatedText
            text="Ready to Transform Your Browsing?"
            type="scale"
            splitBy="word"
            delay={0.8}
            duration={1.2}
            stagger={0.1}
            className="inline-block"
            as="span"
            trigger="scroll"
            scrollTrigger={{
              start: 'top 80%',
              toggleActions: 'play none none reverse',
            }}
          />
        </h2>

        <p
          ref={subtitleRef}
          className="text-xl md:text-2xl text-white/90 mb-12 max-w-2xl mx-auto drop-shadow-md"
          style={{ opacity: 0 }}
        >
          Join thousands of users who are already enhancing their productivity with AI-powered browsing.
        </p>

        <div
          ref={buttonRef}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
          style={{ opacity: 0 }}
        >
          <AnimatedButton
            href="#"
            variant="primary"
            className="group relative overflow-hidden bg-white text-indigo-600"
            onClick={(e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
              e.preventDefault();
              setShowConfetti(true);
              setTimeout(() => setShowConfetti(false), 3000);
            }}
          >
            <motion.span
              className="absolute inset-0 bg-gradient-to-r from-indigo-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              whileHover={{ scale: 1.05 }}
            />
            <Chrome className="w-6 h-6 relative z-10" />
            <span className="relative z-10">Add to Chrome - It's Free</span>
            <motion.span
              className="relative z-10"
              animate={{ x: [0, 3, 0] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <ArrowRight className="w-5 h-5" />
            </motion.span>
          </AnimatedButton>
        </div>

        <p
          className="mt-8 text-white/80 text-sm flex items-center justify-center gap-2"
          id="cta-footer"
          style={{ opacity: 0 }}
        >
          <motion.span
            className="w-2 h-2 bg-white rounded-full"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          No credit card required • Free forever • Install in seconds
        </p>
      </div>
    </section>
  );
}
