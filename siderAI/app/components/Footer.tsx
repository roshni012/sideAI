'use client';

import { Github, Twitter, Mail, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const footerRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!logoRef.current) return;

      gsap.to(logoRef.current.querySelector('svg'), {
        rotate: 360,
        duration: 30,
        repeat: -1,
        ease: 'none',
      });
    },
    { scope: footerRef }
  );

  const links = {
    product: [
      { name: 'Features', href: '#features' },
      { name: 'How It Works', href: '#how-it-works' },
      { name: 'Pricing', href: '#pricing' },
    ],
    resources: [
      { name: 'Documentation', href: '#' },
      { name: 'API Reference', href: '#' },
      { name: 'Support', href: '#' },
    ],
    company: [
      { name: 'About', href: '#' },
      { name: 'Blog', href: '#' },
      { name: 'Privacy', href: '#' },
      { name: 'Terms', href: '#' },
    ],
  };

  const socialLinks = [
    { icon: Github, href: '#', label: 'GitHub' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Mail, href: '#', label: 'Email' },
  ];

  return (
    <footer
      ref={footerRef}
      className="relative bg-gradient-to-b from-gray-900 to-gray-950 text-gray-300 overflow-hidden"
    >
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              ref={logoRef}
              className="flex items-center gap-2 mb-6"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              <Sparkles className="w-7 h-7 text-indigo-400 drop-shadow-lg" />
              <span className="text-2xl font-bold text-white bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Webby-Sider
              </span>
            </motion.div>
            <p className="text-gray-400 mb-4 max-w-md">
              Transform your browsing experience with AI. Chat, translate, summarize, and improve your content with multiple AI models directly in your browser.
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social, index) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 hover:from-indigo-600 hover:to-purple-600 flex items-center justify-center transition-all shadow-lg hover:shadow-xl border border-gray-700 hover:border-indigo-500"
                >
                  <social.icon className="w-5 h-5 text-white" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {[
            { title: 'Product', links: links.product },
            { title: 'Resources', links: links.resources },
            { title: 'Company', links: links.company },
          ].map((section, sectionIndex) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: sectionIndex * 0.1 }}
            >
              <h3 className="text-white font-bold mb-6 text-lg">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link, linkIndex) => (
                  <motion.li
                    key={link.name}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: sectionIndex * 0.1 + linkIndex * 0.05 }}
                  >
                    <motion.a
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors relative group inline-block"
                      whileHover={{ x: 5 }}
                    >
                      {link.name}
                      <motion.span
                        className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-400 to-purple-400 group-hover:w-full transition-all duration-300"
                        whileHover={{ width: '100%' }}
                      />
                    </motion.a>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="border-t border-gray-800 mt-16 pt-8 text-center text-gray-400"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-sm">
            &copy; {currentYear} Webby-Sider. All rights reserved.
          </p>
        </motion.div>
      </div>
    </footer>
  );
}

