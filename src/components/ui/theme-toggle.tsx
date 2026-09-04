'use client';

import { useTheme } from '@/lib/theme-provider';
import { Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      onClick={toggleTheme}
      whileTap={{ scale: 0.9 }}
      className="fixed top-20 right-4 z-50 size-10 rounded-xl flex items-center justify-center border border-line/30 bg-panel/80 backdrop-blur-xl text-ink-3 hover:text-volt-300 hover:border-volt-500/30 hover:shadow-glow transition-all shadow-lg sm:top-4"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <motion.div
        key={theme}
        initial={{ rotate: -90, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        exit={{ rotate: 90, opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </motion.div>
    </motion.button>
  );
}
