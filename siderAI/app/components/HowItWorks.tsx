'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';
import { Download, Zap, Sparkles } from 'lucide-react';
import LottieIcon from './LottieIcon';
import LottieAnimation from './LottieAnimation';
import AnimatedText from './AnimatedText';

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    number: '01',
    title: 'Install Extension',
    description: 'Add Webby-Sider to your Chrome browser with one click. No setup required.',
    icon: Download,
    lottieSrc: '/lottie/download.json',
    animation: 'slide-right',
  },
  {
    number: '02',
    title: 'Activate AI',
    description: 'Click the extension icon or use keyboard shortcuts to activate AI features anywhere on the web.',
    icon: Zap,
    lottieSrc: '/lottie/activate.json',
    animation: 'slide-up',
  },
  {
    number: '03',
    title: 'Get AI Magic',
    description: 'Chat, translate, summarize, or improve content instantly. All powered by advanced AI models.',
    icon: Sparkles,
    lottieSrc: '/lottie/sparkles.json',
    animation: 'slide-left',
  },
];

export default function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!sectionRef.current) return;

      // Set initial states
      gsap.set(subtitleRef.current, { opacity: 0, y: 20 });

      // Ensure section has relative positioning for ScrollTrigger
      if (sectionRef.current && window.getComputedStyle(sectionRef.current).position === 'static') {
        sectionRef.current.style.position = 'relative';
      }

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

      // Steps with different slide animations
      stepsRef.current?.childNodes.forEach((step, i) => {
        const stepElement = step as HTMLElement;
        const numberElement = stepElement.querySelector('.step-number');
        const iconElement = stepElement.querySelector('.step-icon');
        const connectorElement = stepElement.querySelector('.step-connector');
        const stepData = steps[i];

        let animationProps = {};
        
        switch (stepData.animation) {
          case 'slide-right':
            animationProps = { opacity: 0, x: -80, scale: 0.9 };
            break;
          case 'slide-up':
            animationProps = { opacity: 0, y: 80, scale: 0.9 };
            break;
          case 'slide-left':
            animationProps = { opacity: 0, x: 80, scale: 0.9 };
            break;
          default:
            animationProps = { opacity: 0, x: -60 };
        }

        // Set initial state
        gsap.set(stepElement, animationProps);

        // Animate to visible
        gsap.to(stepElement, {
          opacity: 1,
          x: 0,
          y: 0,
          scale: 1,
          duration: 0.8,
          delay: i * 0.2,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: stepElement,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        });

        // Gentle pulse on number (no rotation)
        gsap.to(numberElement, {
          scale: 1.08,
          duration: 2,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: i * 0.5,
        });

        // Hover: gentle scale and lift (no rotation)
        stepElement.addEventListener('mouseenter', () => {
          gsap.to(iconElement, {
            scale: 1.2,
            duration: 0.4,
            ease: 'power2.out',
          });
          gsap.to(numberElement, {
            scale: 1.15,
            duration: 0.4,
            ease: 'power2.out',
          });
        });

        stepElement.addEventListener('mouseleave', () => {
          gsap.to(iconElement, {
            scale: 1,
            duration: 0.3,
            ease: 'power2.out',
          });
          gsap.to(numberElement, {
            scale: 1.08,
            duration: 0.3,
            ease: 'power2.out',
          });
        });

        // Enhanced connector line animation
        if (connectorElement && i < steps.length - 1) {
          gsap.set(connectorElement, { scaleX: 0, opacity: 0 });
          gsap.to(connectorElement, {
            scaleX: 1,
            opacity: 0.6,
            duration: 1.2,
            delay: 0.8 + i * 0.3,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: stepElement,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
          });

          // Animated connector dots
          gsap.to(connectorElement, {
            backgroundPosition: '100% 0',
            duration: 2,
            repeat: -1,
            ease: 'none',
          });
        }
      });
    },
    { scope: sectionRef }
  );

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="py-24 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 relative overflow-hidden"
    >
      {/* Subtle background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-indigo-500 rounded-full blur-3xl transform -translate-y-1/2" />
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl transform -translate-y-1/2" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={titleRef}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            <AnimatedText
              text="How It Works"
              type="scale"
              splitBy="word"
              delay={0}
              duration={0.8}
              stagger={0.1}
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
            Get started in three simple steps
          </p>
        </div>

        <div ref={stepsRef} className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              className="relative group bg-white/50 dark:bg-gray-800/50 backdrop-blur-md rounded-2xl p-6 border border-white/20 dark:border-gray-700/30"
              style={{ opacity: 0 }}
              whileHover={{ scale: 1.03, y: -5, rotateY: 2 }}
              transition={{ 
                type: 'spring', 
                stiffness: 300, 
                damping: 20,
                mass: 0.9
              }}
            >
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <motion.div
                    className="step-number w-20 h-20 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-2xl shadow-2xl relative overflow-hidden"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      animate={{
                        x: ['-100%', '200%'],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: 'linear',
                        delay: index * 0.5,
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <LottieAnimation
                        src="/lottie/pulse.json"
                        width={80}
                        height={80}
                        loop={true}
                        trigger="always"
                        fallback={null}
                      />
                    </div>
                    <span className="relative z-10">{step.number}</span>
                  </motion.div>
                  <motion.div
                    className="step-icon w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 flex items-center justify-center shadow-xl border border-indigo-200 dark:border-indigo-800"
                    whileHover={{ scale: 1.15, rotate: -5 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                  >
                    <LottieIcon
                      src={step.lottieSrc}
                      fallbackIcon={step.icon}
                      size={28}
                      trigger="hover"
                      loop={true}
                    />
                  </motion.div>
                </div>
                <motion.h3
                  className="text-2xl font-bold mb-3 text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
                  whileHover={{ scale: 1.05 }}
                >
                  {step.title}
                </motion.h3>
                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                  {step.description}
                </p>
              </div>

              {index < steps.length - 1 && (
                <motion.div
                  className="step-connector hidden md:block absolute top-8 left-1/2 w-full h-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 transform translate-x-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity overflow-hidden"
                >
                  <LottieAnimation
                    src="/lottie/progress.json"
                    width="100%"
                    height={4}
                    loop={true}
                    trigger="scroll"
                    fallback={
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        animate={{
                          x: ['-100%', '200%'],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: 'linear',
                          delay: index * 0.5,
                        }}
                      />
                    }
                  />
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
