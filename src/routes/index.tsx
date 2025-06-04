import { useRef, useEffect } from 'react';
import { motion, useScroll } from 'framer-motion';
import Footer from '@/components/layout/Footer';
import { createFileRoute } from '@tanstack/react-router'
import Hero from '@/components/hero-section';
import Features from '@/components/features';
//import Features10 from '@/components/features-10';
import Testimonials from '@/components/testimonials';
import Faq from '@/components/faqs';
import Cta from '@/components/call-to-action';
import { HeroHeader } from "@/components/hero5-header";
import TeamSection from '@/components/team';

// Import landing page specific styles
import '../landing-page-theme.css'; 
import '../landing-page-app.css';

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();

  // Apply theme class to body when component mounts, remove on unmount
  useEffect(() => {
    document.body.classList.add('landing-page-theme');
    return () => {
      document.body.classList.remove('landing-page-theme');
    };
  }, []);

  return (
    <div ref={containerRef} className="landing-page-theme min-h-screen bg-white text-slate-900 relative overflow-hidden">

      {/* <Navbar /> */}
      <HeroHeader />

      <main className="relative z-10">
        <Hero />
        <Features />
        {/* <Features10 /> */}
        <Testimonials />
        <TeamSection />
        <Faq />
        <Cta />
      </main>

      <Footer />

      {/* Scroll progress indicator */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#E4EFE7] to-[#B6D78A] origin-left z-50"
        style={{ scaleX: scrollYProgress }}
      />
    </div>
  );
}

// Exporting the component directly as default is common practice
// export default Index; // No longer needed as it's the route component
