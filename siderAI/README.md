# Webby-Sider Landing Page

A fully responsive and animated landing page for the Webby-Sider browser extension, built with Next.js, React, TypeScript, Tailwind CSS, and GSAP animations.

## Features

- 🎨 **Fully Responsive** - Works seamlessly on desktop, tablet, and mobile devices
- ✨ **GSAP Animations** - Smooth, professional animations using GreenSock Animation Platform
- 🎯 **Modern Design** - Clean, gradient-based design with dark mode support
- 🚀 **Performance Optimized** - Built with Next.js 16 for optimal performance
- 📱 **Mobile-First** - Responsive navigation with mobile menu

## Tech Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS v4** - Utility-first CSS framework
- **GSAP** - Professional animation library
- **@gsap/react** - React hooks for GSAP
- **Lucide React** - Beautiful icon library

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
```

### Production

```bash
npm start
```

## Project Structure

```
landing/
├── app/
│   ├── components/
│   │   ├── Navigation.tsx    # Responsive navigation with mobile menu
│   │   ├── Hero.tsx          # Hero section with GSAP animations
│   │   ├── Features.tsx      # Features showcase with scroll animations
│   │   ├── HowItWorks.tsx    # Step-by-step guide section
│   │   ├── Benefits.tsx      # Benefits grid with animations
│   │   ├── CTA.tsx           # Call-to-action section
│   │   └── Footer.tsx         # Footer with links and social media
│   ├── layout.tsx             # Root layout with metadata
│   ├── page.tsx               # Main landing page
│   └── globals.css            # Global styles and Tailwind config
├── public/                    # Static assets
└── package.json
```

## Animation Features

### GSAP Integration

The landing page uses GSAP for smooth, professional animations:

- **Hero Section**: Fade-in animations with floating gradient backgrounds
- **Features Section**: Staggered card animations on scroll
- **How It Works**: Sequential step animations
- **Benefits**: Scale and fade animations
- **CTA Section**: Elastic entrance animations with rotating icons

### ScrollTrigger

All sections use GSAP's ScrollTrigger plugin for scroll-based animations that trigger when elements enter the viewport.

## Customization

### Colors

Edit the color scheme in `app/globals.css`:

```css
:root {
  --primary: #6366f1;
  --accent: #8b5cf6;
  --gradient-start: #6366f1;
  --gradient-end: #8b5cf6;
}
```

### Content

Update component content in `app/components/` to reflect your branding and features.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT
