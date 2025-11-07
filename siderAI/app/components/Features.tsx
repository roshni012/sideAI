'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';
import {
  MessageCircle,
  Languages,
  FileText,
  Sparkles,
  PenTool,
  CheckCircle2,
  FileSearch,
  Youtube,
  Globe,
  Zap,
} from 'lucide-react';
import LottieIcon from './LottieIcon';
import AnimatedText from './AnimatedText';

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    icon: MessageCircle,
    lottieSrc: '/lottie/chat.json',
    title: 'Multi-Model AI Chat',
    description: 'Chat with ChatGPT, GPT-4, Claude, or Gemini directly in your browser. Switch between models instantly.',
    color: 'from-blue-500 to-cyan-500',
    animation: 'slide-up',
  },
  {
    icon: Languages,
    lottieSrc: '/lottie/translation.json',
    title: 'Smart Translation',
    description: 'Translate text and PDFs to any language instantly. Supports multiple source and target languages.',
    color: 'from-green-500 to-emerald-500',
    animation: 'fade-in',
  },
  {
    icon: FileText,
    lottieSrc: '/lottie/document.json',
    title: 'Text Summarization',
    description: 'Summarize any text, document, webpage, or YouTube video with AI-powered concise summaries.',
    color: 'from-purple-500 to-pink-500',
    animation: 'scale-in',
  },
  {
    icon: Youtube,
    lottieSrc: '/lottie/video.json',
    title: 'YouTube Summaries',
    description: 'Get instant summaries of YouTube videos. Understand long-form content in seconds.',
    color: 'from-red-500 to-orange-500',
    animation: 'slide-left',
  },
  {
    icon: Globe,
    lottieSrc: '/lottie/globe.json',
    title: 'Webpage Analysis',
    description: 'Summarize entire webpages and extract key information without reading everything.',
    color: 'from-indigo-500 to-blue-500',
    animation: 'slide-right',
  },
  {
    icon: PenTool,
    lottieSrc: '/lottie/writing.json',
    title: 'Writing Assistant',
    description: 'Improve, rewrite, and compose content with AI. Get grammar checks and style suggestions.',
    color: 'from-pink-500 to-rose-500',
    animation: 'slide-up',
  },
  {
    icon: FileSearch,
    lottieSrc: '/lottie/file-search.json',
    title: 'File Analysis',
    description: 'Upload and analyze documents, PDFs, images, and more. Extract insights from any file type.',
    color: 'from-amber-500 to-yellow-500',
    animation: 'fade-in',
  },
  {
    icon: CheckCircle2,
    lottieSrc: '/lottie/checkmark.json',
    title: 'Grammar Check',
    description: 'Real-time grammar checking and correction. Improve your writing quality instantly.',
    color: 'from-teal-500 to-cyan-500',
    animation: 'scale-in',
  },
  {
    icon: Sparkles,
    lottieSrc: '/lottie/sparkles.json',
    title: 'Note Polishing',
    description: 'Transform rough notes into polished, well-structured documents with AI assistance.',
    color: 'from-violet-500 to-purple-500',
    animation: 'slide-left',
  },
];

export default function Features() {
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
      gsap.set(subtitleRef.current, { opacity: 0, y: 20 });

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

      // Cards with different animations per card
      cardsRef.current?.childNodes.forEach((card, i) => {
        const cardElement = card as HTMLElement;
        const feature = features[i];
        
        let animationProps = {};
        
        switch (feature.animation) {
          case 'slide-up':
            animationProps = { opacity: 0, y: 60, scale: 0.95 };
            break;
          case 'fade-in':
            animationProps = { opacity: 0, scale: 0.9 };
            break;
          case 'scale-in':
            animationProps = { opacity: 0, scale: 0.8 };
            break;
          case 'slide-left':
            animationProps = { opacity: 0, x: -60, scale: 0.95 };
            break;
          case 'slide-right':
            animationProps = { opacity: 0, x: 60, scale: 0.95 };
            break;
          default:
            animationProps = { opacity: 0, y: 40 };
        }

        // Set initial state
        gsap.set(cardElement, animationProps);

        // Animate to visible
        gsap.to(cardElement, {
          opacity: 1,
          y: 0,
          x: 0,
          scale: 1,
          rotationX: 0,
          rotationY: 0,
          duration: 0.8,
          delay: i * 0.1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: cardElement,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        });

        // Enhanced hover: 3D tilt and lift
        cardElement.addEventListener('mouseenter', () => {
          gsap.to(cardElement, {
            scale: 1.05,
            y: -12,
            rotationY: 2,
            rotationX: -2,
            duration: 0.4,
            ease: 'power2.out',
          });
          gsap.to(cardElement.querySelector('.feature-icon'), {
            scale: 1.2,
            rotation: 5,
            duration: 0.4,
            ease: 'power2.out',
          });
        });

        cardElement.addEventListener('mouseleave', () => {
          gsap.to(cardElement, {
            scale: 1,
            y: 0,
            rotationY: 0,
            rotationX: 0,
            duration: 0.4,
            ease: 'power2.out',
          });
          gsap.to(cardElement.querySelector('.feature-icon'), {
            scale: 1,
            rotation: 0,
            duration: 0.4,
            ease: 'power2.out',
          });
          });
      });

      // Animate footer badge
      gsap.set('#features-footer', { opacity: 0, scale: 0.95 });
      gsap.to('#features-footer', {
        opacity: 1,
        scale: 1,
        duration: 0.5,
        delay: 0.3,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '#features-footer',
          start: 'top 80%',
          toggleActions: 'play none none reverse',
        },
      });
    },
    { scope: sectionRef }
  );

  return (
    <section
      id="features"
      ref={sectionRef}
      className="py-24 bg-white dark:bg-gray-900 relative overflow-hidden"
    >
      {/* Subtle background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={titleRef}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            <AnimatedText
              text="Powerful Features"
              type="slide"
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
            Everything you need to enhance your browsing and productivity with AI
          </p>
        </div>

        <div
          ref={cardsRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="group relative p-8 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl hover:shadow-2xl transition-all border border-white/20 dark:border-gray-700/30 overflow-hidden"
              style={{ transformStyle: 'preserve-3d', perspective: '1000px', opacity: 0 }}
              whileHover={{ y: -8, rotateY: 2, rotateX: -2 }}
              transition={{ 
                type: 'spring', 
                stiffness: 300, 
                damping: 20,
                mass: 0.9
              }}
            >
              {/* Glassmorphic hover effect background */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-purple-50/30 to-pink-50/50 dark:from-indigo-900/20 dark:via-purple-900/10 dark:to-pink-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out backdrop-blur-sm" />
              
              {/* Liquid motion effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />

              <div className="relative z-10">
                <div
                  className={`feature-icon w-14 h-14 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-xl group-hover:shadow-2xl`}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <LottieIcon
                    src={feature.lottieSrc}
                    fallbackIcon={feature.icon}
                    size={28}
                    trigger="hover"
                    loop={true}
                  />
                </div>
                <h3 className="text-xl md:text-2xl font-bold mb-3 text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {feature.description}
                </p>
              </div>

              {/* Animated border on hover */}
              <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-indigo-500/30 transition-all duration-300" />
            </motion.div>
          ))}
        </div>

        <div className="mt-16 text-center" id="features-footer" style={{ opacity: 0 }}>
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-full shadow-lg">
            <Zap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span className="text-gray-900 dark:text-white font-medium">
              All features support real-time streaming responses
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
