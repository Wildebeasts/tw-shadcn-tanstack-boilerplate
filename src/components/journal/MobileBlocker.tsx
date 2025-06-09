import React, { useEffect } from 'react';
import beanLogo from "@/images/logo_bean_journal.png";
import { motion, useAnimation } from 'framer-motion';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';

const MobileBlocker: React.FC = () => {
  const logoControls = useAnimation();

  useEffect(() => {
    const sequence = async () => {
      // Entry animation: drop and bounce
      await logoControls.start({
        y: 0,
        opacity: 1,
        scale: 1,
        transition: { type: 'spring', stiffness: 100, damping: 10, delay: 0.2 }
      });
      // Loop animation: floating and rotating
      logoControls.start({
        y: ["0%", "-10%", "0%"],
        rotate: [0, 5, -5, 0],
        transition: {
          duration: 4,
          ease: "easeInOut",
          repeat: Infinity,
          repeatType: "mirror"
        }
      });
    };
    sequence();
  }, [logoControls]);

  const title = "Looks like this bean hasn't sprouted on mobile yet!";
  const titleWords = title.split(" ");

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.5 }
    }
  };

  const wordVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-gradient-to-br from-amber-100 to-orange-200 dark:from-[#2A2035] dark:to-[#1E1726] z-50 flex flex-col items-center justify-center text-center p-6 font-readex-pro overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.img
        src={beanLogo}
        alt="Bean Journal Logo"
        className="w-28 h-28 mb-8 drop-shadow-lg"
        initial={{ y: -100, opacity: 0, scale: 0.5 }}
        animate={logoControls}
      />
      <motion.h2
        className="text-3xl font-bold mb-4 text-gray-800 dark:text-white max-w-md"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {titleWords.map((word, index) => (
          <motion.span
            key={index}
            variants={wordVariants}
            style={{ display: 'inline-block', marginRight: '0.5rem' }}
          >
            {word}
          </motion.span>
        ))}
      </motion.h2>
      <motion.p
        className="text-lg text-gray-700 dark:text-gray-300 max-w-sm"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.8 }}
      >
        For the best experience, please switch to a desktop or laptop.
      </motion.p>
      <motion.div
        className="mt-8"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 2.2 }}
      >
        <Link to="/">
          <Button variant="outline" className="bg-white/20 backdrop-blur-sm border-white/30 text-gray-800 dark:text-white hover:bg-white/40">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Take me back
          </Button>
        </Link>
      </motion.div>
    </motion.div>
  );
};

export default MobileBlocker;