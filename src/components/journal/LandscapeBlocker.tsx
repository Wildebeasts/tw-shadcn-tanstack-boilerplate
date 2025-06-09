import React from 'react';
import { motion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';

const LandscapeBlocker: React.FC = () => {
  return (
    <motion.div
      className="fixed inset-0 bg-gradient-to-br from-gray-800 to-gray-900 z-50 flex flex-col items-center justify-center text-center p-6 font-readex-pro overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
        animate={{ rotate: 0, scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 100, damping: 15, delay: 0.2 }}
      >
        <RotateCcw className="w-16 h-16 text-white mb-6" />
      </motion.div>
      <motion.h2
        className="text-2xl font-bold mb-4 text-white"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        Please rotate your device
      </motion.h2>
      <motion.p
        className="text-lg text-gray-300 max-w-sm"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        This app is best viewed in portrait mode.
      </motion.p>
    </motion.div>
  );
};

export default LandscapeBlocker; 