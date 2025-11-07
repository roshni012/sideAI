'use client';

import { useRef, useState, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Sparkles, Zap, ArrowRight, Chrome } from 'lucide-react';
import AnimatedGradient from './AnimatedGradient';
import AnimatedButton from './AnimatedButton';
import MorphingShapes from './MorphingShapes';
import ParticleSystem from './ParticleSystem';
import LottieAnimation from './LottieAnimation';
import AnimatedText from './AnimatedText';

gsap.registerPlugin(ScrollTrigger);

// Predefined particle positions to avoid hydration mismatch
const particleConfigs = [
  { width: 15, height: 18, left: 10, top: 20, color: '#6366f1' },
  { width: 18, height: 12, left: 85, top: 15, color: '#8b5cf6' },
  { width: 12, height: 20, left: 25, top: 60, color: '#ec4899' },
  { width: 20, height: 15, left: 70, top: 45, color: '#6366f1' },
  { width: 14, height: 16, left: 45, top: 80, color: '#8b5cf6' },
  { width: 16, height: 14, left: 90, top: 70, color: '#ec4899' },
  { width: 13, height: 19, left: 5, top: 50, color: '#6366f1' },
  { width: 19, height: 11, left: 60, top: 25, color: '#8b5cf6' },
  { width: 17, height: 17, left: 35, top: 75, color: '#ec4899' },
  { width: 11, height: 13, left: 75, top: 35, color: '#6366f1' },
  { width: 15, height: 16, left: 20, top: 90, color: '#8b5cf6' },
  { width: 18, height: 14, left: 55, top: 10, color: '#ec4899' },
];

export default function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  useGSAP(
    () => {
      if (!heroRef.current || !mounted) return;

      // Ensure hero section has relative positioning for ScrollTrigger
      if (window.getComputedStyle(heroRef.current).position === 'static') {
        heroRef.current.style.position = 'relative';
      }

      // Set initial hidden states before animation
      gsap.set(badgeRef.current, { opacity: 0, y: -30, scale: 0.9 });
      gsap.set(subtitleRef.current, { opacity: 0, y: 30, scale: 0.98 });
      gsap.set(buttonsRef.current?.children || [], { opacity: 0, y: 30, scale: 0.9 });

      // Animate to visible state
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' }, immediateRender: false });

      tl.to(badgeRef.current, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        ease: 'back.out(1.7)',
      })
        .to(
          subtitleRef.current,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 1,
            ease: 'power3.out',
          },
          '-=0.4'
        )
        .to(
          buttonsRef.current?.children || [],
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            stagger: 0.2,
            ease: 'back.out(1.7)',
          },
          '-=0.5'
        );

      if (mounted && particlesRef.current) {
        const particles = particlesRef.current.children;
        Array.from(particles).forEach((particle, i) => {
          gsap.to(particle, {
            y: `+=${40 + i * 8}`,
            x: `+=${(i % 2 === 0 ? 1 : -1) * (20 + i * 3)}`,
            opacity: 0.3,
            scale: 1.15,
            duration: 18 + i * 2,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            delay: i * 0.6,
          });
        });
      }

      gsap.to(heroRef.current?.querySelectorAll('.floating-gradient'), {
        y: '+=50',
        x: '+=30',
        scale: 1.2,
        duration: 20,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        stagger: 2,
      });
    },
    { scope: heroRef, dependencies: [mounted] }
  );

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20"
      style={{ position: 'relative' }}
    >
      <motion.div
        style={{ y, opacity }}
        className="absolute inset-0 pointer-events-none"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" />

      {/* Enhanced animated background gradients */}
      <AnimatedGradient
        className="floating-gradient top-1/4 left-1/4"
        colors={['#6366f1', '#8b5cf6']}
        size={500}
        speed="slow"
      />
      <AnimatedGradient
        className="floating-gradient bottom-1/4 right-1/4"
        colors={['#8b5cf6', '#ec4899']}
        size={500}
        speed="medium"
      />
      <AnimatedGradient
        className="floating-gradient top-1/2 right-1/3"
        colors={['#ec4899', '#f59e0b']}
        size={400}
        speed="slow"
      />

      {/* Morphing shapes background */}
      <MorphingShapes count={8} className="opacity-30" />

      {/* Enhanced particle system */}
      <ParticleSystem count={40} className="opacity-40" />

      {/* Subtle floating particles - no rotation */}
      <div ref={particlesRef} className="absolute inset-0 pointer-events-none">
        {particleConfigs.map((config, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full opacity-20"
            style={{
              width: `${config.width}px`,
              height: `${config.height}px`,
              left: `${config.left}%`,
              top: `${config.top}%`,
              background: `linear-gradient(135deg, ${config.color}, transparent)`,
            }}
            animate={{
              y: [0, 20, 0],
              opacity: [0.2, 0.25, 0.2],
            }}
            transition={{
              duration: 8 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.3,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          ref={badgeRef}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 text-indigo-700 dark:text-indigo-300 mb-8 shadow-xl backdrop-blur-sm border border-indigo-200/50 dark:border-indigo-800/50 mt-[2%]"
          whileHover={{ scale: 1.08, y: -2 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          style={{ opacity: 0 }}
        >
          <div className="w-4 h-4 flex items-center justify-center">
            <LottieAnimation
              src="/lottie/sparkles.json"
              width={16}
              height={16}
              loop={true}
              trigger="always"
              fallback={
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="w-4 h-4" />
                </motion.div>
              }
            />
          </div>
          <AnimatedText
            text="AI-Powered Browser Extension"
            type="fade"
            splitBy="word"
            delay={0.2}
            duration={0.6}
            stagger={0.08}
            className="text-sm font-semibold"
            as="span"
          />
        </motion.div>

        <h1
          ref={titleRef}
          className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-6 leading-tight"
        >
          <AnimatedText
            text="Transform Your Browsing"
            type="reveal"
            splitBy="word"
            delay={0.8}
            duration={1.5}
            stagger={0.1}
            className="block bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3 bg-[length:200%_auto] animate-gradient-text"
            as="span"
          />
          <AnimatedText
            text="with AI Magic"
            type="fade"
            splitBy="word"
            delay={1.2}
            duration={0.8}
            stagger={0.1}
            className="block text-gray-900 dark:text-white drop-shadow-lg mt-2"
            as="span"
          />
        </h1>

        <p
          ref={subtitleRef}
          className="text-xl md:text-2xl lg:text-3xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto font-light leading-relaxed"
          style={{ opacity: 0 }}
        >
          Chat with AI, translate content, summarize pages, improve your writing, and more—all without leaving your browser.
        </p>

        <div
          ref={buttonsRef}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
          style={{ opacity: 0 }}
        >
          <AnimatedButton
            href="#get-started"
            variant="primary"
            className="group relative overflow-hidden"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Chrome className="w-5 h-5 relative z-10" />
            <span className="relative z-10">Add to Chrome</span>
            <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
          </AnimatedButton>
          <AnimatedButton href="#features" variant="secondary">
            Learn More
          </AnimatedButton>
        </div>

        <motion.div
          // className="mt-16 flex flex-wrap items-center justify-center gap-8 text-gray-600 dark:text-gray-400"
          // initial={{ opacity: 0, y: 20 }}
          // animate={{ opacity: 1, y: 0 }}
          // transition={{ delay: 1, duration: 0.8 }}
        >
          <motion.div
           
          >
            <div className="w-5 h-5 flex items-center justify-center">
              <LottieAnimation
                src="/lottie/lightning.json"
                width={20}
                height={20}
                loop={true}
                trigger="hover"
                fallback={<Zap className="w-5 h-5 text-yellow-500" />}
              />
            </div>
            {/* <span className="font-semibold">Multi-Model AI</span> */}
          </motion.div>
          <motion.div
          
          >
            <div className="w-5 h-5 flex items-center justify-center">
              <LottieAnimation
                src="/lottie/sparkles.json"
                width={20}
                height={20}
                loop={true}
                trigger="hover"
                fallback={<Sparkles className="w-5 h-5 text-purple-500" />}
              />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
