'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';
import { Clock, Shield, Globe, Zap, Lock, TrendingUp } from 'lucide-react';
import LottieIcon from './LottieIcon';
import AnimatedText from './AnimatedText';

gsap.registerPlugin(ScrollTrigger);

const benefits = [
  {
    icon: Clock,
    lottieSrc: '/lottie/time.json',
    title: 'Save Time',
    description: 'Get instant AI responses without switching tabs or apps. Everything happens right where you need it.',
    stat: '10x faster',
    animation: 'flip-x',
  },
  {
    icon: Shield,
    lottieSrc: '/lottie/shield.json',
    title: 'Secure & Private',
    description: 'Your data is encrypted and secure. We never store your conversations or personal information.',
    stat: '100% secure',
    animation: 'flip-y',
  },
  {
    icon: Globe,
    lottieSrc: '/lottie/globe.json',
    title: 'Works Everywhere',
    description: 'Use Webby-Sider on any website. Translate, summarize, or chat on any page you visit.',
    stat: 'Universal',
    animation: 'zoom',
  },
  {
    icon: Zap,
    lottieSrc: '/lottie/lightning.json',
    title: 'Lightning Fast',
    description: 'Real-time streaming responses powered by advanced AI models. Get answers in seconds.',
    stat: 'Instant',
    animation: 'flip-x',
  },
  {
    icon: Lock,
    lottieSrc: '/lottie/lock.json',
    title: 'No API Keys Needed',
    description: 'We handle all API keys securely. Just install and start using. No configuration required.',
    stat: 'Zero setup',
    animation: 'flip-y',
  },
  {
    icon: TrendingUp,
    lottieSrc: '/lottie/growth.json',
    title: 'Always Improving',
    description: 'Regular updates with new features and AI models. Your extension gets better over time.',
    stat: 'Updated',
    animation: 'zoom',
  },
];

export default function Benefits() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!sectionRef.current) return;

      // Ensure section has relative positioning for ScrollTrigger
      if (window.getComputedStyle(sectionRef.current).position === 'static') {
        sectionRef.current.style.position = 'relative';
      }

      // Set initial states
      gsap.set(subtitleRef.current, { opacity: 0, y: 30 });

      // Subtitle fade-in
      gsap.to(subtitleRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: subtitleRef.current,
          start: 'top 80%',
          toggleActions: 'play none none reverse',
        },
      });

      // Cards with flip animations (different per card)
      cardsRef.current?.childNodes.forEach((card, i) => {
        const cardElement = card as HTMLElement;
        const benefit = benefits[i];
        const iconElement = cardElement.querySelector('.benefit-icon');
        const statElement = cardElement.querySelector('.benefit-stat');

        let animationProps = {};
        
        switch (benefit.animation) {
          case 'flip-x':
            animationProps = { opacity: 0, rotationX: -90, scale: 0.9 };
            break;
          case 'flip-y':
            animationProps = { opacity: 0, rotationY: -90, scale: 0.9 };
            break;
          case 'zoom':
            animationProps = { opacity: 0, scale: 0.8 };
            break;
          default:
            animationProps = { opacity: 0, y: 40 };
        }

        // Set initial state
        gsap.set(cardElement, animationProps);

        // Animate to visible
        gsap.to(cardElement, {
          opacity: 1,
          rotationX: 0,
          rotationY: 0,
          scale: 1,
          duration: 0.8,
          delay: i * 0.1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: cardElement,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        });

        // Hover: gentle scale and lift (no rotation)
        cardElement.addEventListener('mouseenter', () => {
          gsap.to(cardElement, {
            scale: 1.05,
            y: -8,
            duration: 0.3,
            ease: 'power2.out',
          });
          gsap.to(iconElement, {
            scale: 1.15,
            duration: 0.3,
            ease: 'power2.out',
          });
          gsap.to(statElement, {
            scale: 1.1,
            y: -3,
            duration: 0.3,
            ease: 'power2.out',
          });
        });

        cardElement.addEventListener('mouseleave', () => {
          gsap.to(cardElement, {
            scale: 1,
            y: 0,
            duration: 0.3,
            ease: 'power2.out',
          });
          gsap.to(iconElement, {
            scale: 1,
            duration: 0.3,
            ease: 'power2.out',
          });
          gsap.to(statElement, {
            scale: 1,
            y: 0,
            duration: 0.3,
            ease: 'power2.out',
          });
        });
      });
    },
    { scope: sectionRef }
  );

  return (
    <section
      id="benefits"
      ref={sectionRef}
      className="py-24 bg-white dark:bg-gray-900 relative overflow-hidden"
    >
      {/* Subtle background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={titleRef}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            <AnimatedText
              text="Why Choose Webby-Sider"
              type="reveal"
              splitBy="word"
              delay={0}
              duration={1}
              stagger={0.08}
              className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent inline-block"
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
            className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
          >
            Experience the future of browser-based AI assistance
          </p>
        </div>

        <div
          ref={cardsRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              className="group relative p-6 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/30 dark:border-gray-600/30 overflow-hidden"
              style={{ opacity: 0 }}
              whileHover={{ y: -5, scale: 1.02 }}
              transition={{ 
                type: 'spring', 
                stiffness: 300, 
                damping: 20,
                mass: 0.9
              }}
            >
              {/* Glassmorphic hover effect background */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-indigo-50/60 via-purple-50/40 to-pink-50/60 dark:from-indigo-900/30 dark:via-purple-900/20 dark:to-pink-900/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out backdrop-blur-sm"
                whileHover={{ scale: 1.05 }}
              />
              
              {/* Liquid motion shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="benefit-icon w-12 h-12 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
                    <LottieIcon
                      src={benefit.lottieSrc}
                      fallbackIcon={benefit.icon}
                      size={24}
                      trigger="hover"
                      loop={true}
                    />
                  </div>
                  <motion.span
                    className="benefit-stat text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/30 px-3 py-1 rounded-full"
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                  >
                    {benefit.stat}
                  </motion.span>
                </div>
                <h3 className="text-xl md:text-2xl font-bold mb-3 text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {benefit.description}
                </p>
              </div>

              {/* Animated border on hover */}
              <motion.div
                className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-indigo-500/30 transition-all duration-300"
                whileHover={{ scale: 1.02 }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
