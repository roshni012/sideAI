# Lottie Animations Setup Guide

This guide explains how to add Lottie animations to the landing page.

## Directory Structure

Place your Lottie animation files in:
```
landing/public/lottie/
```

## Required Animation Files

Based on the implemented components, you need the following Lottie files:

### Hero Section
- `sparkles.json` - Sparkles animation for badge icon
- `lightning.json` - Lightning animation for "Multi-Model AI" badge

### Features Section
- `chat.json` - Chat/message animation
- `translation.json` - Translation/globe animation
- `document.json` - Document/file animation
- `video.json` - Video/play animation
- `globe.json` - Globe animation
- `writing.json` - Writing/pen animation
- `file-search.json` - File search animation
- `checkmark.json` - Checkmark/success animation

### HowItWorks Section
- `download.json` - Download/install animation
- `activate.json` - Activate/click animation
- `pulse.json` - Pulse animation for number badges
- `progress.json` - Progress/flow animation for connector lines

### Benefits Section
- `time.json` - Clock/time animation
- `shield.json` - Shield/security animation
- `lock.json` - Lock/secure animation
- `growth.json` - Growth/chart animation

### CTA Section
- `celebration.json` - Celebration animation for sparkles icon
- `confetti.json` - Confetti animation for button click

## Where to Get Lottie Animations

1. **LottieFiles.com** - Browse 800,000+ free animations
   - Search for animations matching the names above
   - Download as JSON format
   - For better performance, consider converting to dotLottie format

2. **Recommended Search Terms:**
   - sparkles, magic, stars
   - chat, message, communication
   - translation, globe, language
   - document, file, text
   - download, install, arrow-down
   - celebration, confetti, success
   - shield, security, protection
   - lightning, zap, fast
   - time, clock, timer
   - checkmark, success, done

## Performance Optimization

1. **Use dotLottie format** (90% smaller than JSON)
   - Convert JSON to .lottie format using LottieFiles tools
   - Update file paths in components to use `.lottie` extension

2. **Lazy Loading**
   - Animations below the fold use `trigger="scroll"` for lazy loading
   - Above-the-fold animations use `trigger="always"` for immediate loading

3. **Accessibility**
   - Animations respect `prefers-reduced-motion` setting
   - Fallback icons are provided for all animations

## Component Usage

### Basic Usage
```tsx
import LottieAnimation from './components/LottieAnimation';

<LottieAnimation
  src="/lottie/sparkles.json"
  width={64}
  height={64}
  loop={true}
  trigger="always"
  fallback={<Sparkles className="w-16 h-16" />}
/>
```

### Icon Usage
```tsx
import LottieIcon from './components/LottieIcon';
import { Sparkles } from 'lucide-react';

<LottieIcon
  src="/lottie/sparkles.json"
  fallbackIcon={Sparkles}
  size={24}
  trigger="hover"
  loop={true}
/>
```

## Animation Triggers

- `always` - Play immediately (for above-the-fold content)
- `hover` - Play on hover (for interactive elements)
- `scroll` - Play when scrolled into view (for lazy loading)
- `click` - Play on click (for button interactions)

## Adding New Animations

1. Download animation from LottieFiles.com
2. Save to `landing/public/lottie/`
3. Update component to reference the new file
4. Add fallback icon for graceful degradation

## Notes

- All animations have fallback icons for reliability
- Animations are optimized for performance with lazy loading
- Supports both JSON and dotLottie formats
- Respects user preferences for reduced motion

## Current Status

⚠️ **Placeholder Files Created**: Minimal valid Lottie JSON files have been created as placeholders. These basic animations will load without 404 errors, but for better visual quality, replace them with professional animations from LottieFiles.com.

### To Replace Placeholders:

1. Visit [LottieFiles.com](https://lottiefiles.com)
2. Search for animations matching the names above
3. Download as JSON format
4. Replace the corresponding file in `landing/public/lottie/`
5. The animations will automatically update (no code changes needed)

### Quick Download Links:

- Search for "sparkles" or "magic sparkles"
- Search for "lightning" or "bolt"
- Search for "chat" or "message bubble"
- Search for "translation" or "globe"
- Search for "document" or "file"
- Search for "video play" or "play button"
- Search for "download" or "arrow down"
- Search for "celebration" or "confetti"
- And more...

