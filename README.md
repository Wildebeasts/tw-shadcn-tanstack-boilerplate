<scheme>://woodpecker.beanjournal.site/api/badges/1/status.svg
![repository-open-graph-template(1)](https://github.com/user-attachments/assets/2117493b-d280-41b5-b081-30e94247f52e)

[![Better Stack Badge](https://uptime.betterstack.com/status-badges/v1/monitor/1yl5d.svg)](https://uptime.betterstack.com/?utm_source=status_badge)
# Bean Journal

A digital companion for coffee enthusiasts to track their coffee journey, explore new beans, and connect with other coffee lovers.

## Tech Stack

- React + TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Shadcn UI for component library
- Tanstack Router for routing
- Anime.js v4 for animations

## Features

- **Bean Journal Page**: Learn about coffee from seed to cup
- **Responsive Design**: Works on all devices
- **Animations**: Smooth animations powered by Anime.js
- **Dark Mode**: Toggle between light and dark themes

## Getting Started

1. Clone the repository
2. Install dependencies

```bash
npm install
```

3. Start the development server

```bash
npm run dev
```

4. Open your browser to `http://localhost:5173`

## Adding Anime.js v4 to Your Project

1. Install Anime.js v4 and its TypeScript types:

```bash
npm install animejs@4.0.0
npm install @types/animejs@3.1.13 --save-dev
```

2. Import the specific functions you need in your component:

```typescript
import { animate, stagger } from "animejs";
```

3. Use the new API in your component:

```typescript
useEffect(() => {
  // Target first, then properties
  animate('.element', {
    opacity: [0, 1],
    translateY: [20, 0],
    duration: 1000,
    easing: 'outExpo' // Note: easing names changed in v4
  });
  
  // With stagger
  animate('.multiple-elements', {
    translateX: [0, 100],
    delay: stagger(100)
  });
}, []);
```

4. Working with animation instances:

```typescript
const animationRef = useRef<{ pause: () => void } | null>(null);

// Store animation reference
const animation = animate('.element', { /* properties */ });
animationRef.current = animation;

// Control the animation
animation.pause();
animation.play();
```

## Project Structure

- `src/components/`: UI components
- `src/routes/`: Application routes
- `src/components/bean-journal/`: Bean Journal components
- `public/images/`: Static images

## License

MIT


