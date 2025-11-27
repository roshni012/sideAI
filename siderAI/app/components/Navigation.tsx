'use client';

import { useState, useEffect, useRef, type MouseEvent } from 'react';
import { Menu, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useRouter } from 'next/navigation';
import LoginDialog from './LoginDialog';
import SignUpDialog from './SignUpDialog';

export default function Navigation({ isAuthenticated = false }: { isAuthenticated?: boolean }) {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [isSignUpDialogOpen, setIsSignUpDialogOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useGSAP(() => {
    if (!logoRef.current) return;
    gsap.to(logoRef.current.querySelector('svg'), {
      rotate: 360,
      duration: 20,
      repeat: -1,
      ease: 'none',
    });
  });

  const navLinks = [
    { name: 'Features', href: '#features' },
    { name: 'Chat', href: '/chat' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Benefits', href: '#benefits' },
    { name: 'Pricing', href: '#pricing' },
  ];

  const navClassName = isScrolled
    ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-lg border-b border-gray-200/50 dark:border-gray-800/50'
    : 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50';

  return (
    <>
      <motion.nav
        ref={navRef}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${navClassName}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <motion.div
              ref={logoRef}
              initial={{ opacity: 0, x: -30, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-6 h-6 text-indigo-600 dark:text-indigo-400 drop-shadow-lg" />
              <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Webby-Sider
              </span>
            </motion.div>

            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link, i) => (
                <motion.a
                  key={i}
                  href={link.href}
                  onClick={(e: MouseEvent<HTMLAnchorElement>) => {
                    if (link.href === '/chat') {
                      e.preventDefault();
                      if (isAuthenticated) {
                        router.push(link.href);
                      } else {
                        setIsLoginDialogOpen(true);
                      }
                    }
                  }}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors"
                >
                  {link.name}
                </motion.a>
              ))}

              <motion.button
                onClick={() => setIsLoginDialogOpen(true)}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.6 }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-full font-medium shadow-lg hover:shadow-xl transition-all"
              >
                Get Started
              </motion.button>
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </motion.button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800"
            >
              <div className="px-4 py-4 space-y-3">
                {navLinks.map((link, i) => (
                  <a
                    key={i}
                    href={link.href}
                    className="block px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.name}
                  </a>
                ))}

                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsLoginDialogOpen(true);
                  }}
                  className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full font-medium shadow-lg hover:shadow-xl transition-all"
                >
                  Get Started
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

       {/* Login Dialog */}
       <LoginDialog
         isOpen={isLoginDialogOpen}
         onClose={() => setIsLoginDialogOpen(false)}
         onSwitchToSignUp={() => {
           setIsLoginDialogOpen(false);
           setIsSignUpDialogOpen(true);
         }}
       />

       {/* Sign Up Dialog */}
       <SignUpDialog
         isOpen={isSignUpDialogOpen}
         onClose={() => setIsSignUpDialogOpen(false)}
         onSwitchToLogin={() => {
           setIsSignUpDialogOpen(false);
           setIsLoginDialogOpen(true);
         }}
       />
     </>
   );
 }
