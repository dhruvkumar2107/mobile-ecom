'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export function EmptyCartIllustration() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="relative mb-8"
      >
        <svg width="200" height="200" viewBox="0 0 200 200" fill="none">
          {/* Shopping bag */}
          <path d="M60 70h80l10 90H50L60 70z" fill="#0b111d" stroke="#1b2537" strokeWidth="2" />
          <path d="M60 70h80l10 90H50L60 70z" fill="url(#bagGrad)" />
          {/* Handles */}
          <path d="M75 70V55c0-13.8 11.2-25 25-25s25 11.2 25 25v15" stroke="#22d3ee" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          {/* Sad face */}
          <circle cx="100" cy="110" r="4" fill="#22d3ee" opacity="0.6" />
          <circle cx="120" cy="110" r="4" fill="#22d3ee" opacity="0.6" />
          <path d="M92 125c2.5-4 6-6 8-6s5.5 2 8 6" stroke="#22d3ee" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6" />
          {/* Sparkles */}
          <circle cx="40" cy="60" r="2" fill="#8b5cf6" opacity="0.5">
            <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="160" cy="50" r="2.5" fill="#22d3ee" opacity="0.5">
            <animate attributeName="opacity" values="0.5;1;0.5" dur="1.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="155" cy="150" r="1.5" fill="#10b981" opacity="0.5">
            <animate attributeName="opacity" values="0.5;1;0.5" dur="1.8s" repeatCount="indefinite" />
          </circle>
          <defs>
            <linearGradient id="bagGrad" x1="50" y1="70" x2="150" y2="160">
              <stop stopColor="#22d3ee" stopOpacity="0.05" />
              <stop offset="1" stopColor="#8b5cf6" stopOpacity="0.05" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-xl font-semibold text-ink mb-2">Your cart is empty</h2>
        <p className="text-sm text-ink-3 max-w-xs mx-auto mb-8">
          Looks like you haven&apos;t added anything yet. Explore our collection and find something you love.
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-volt-500 text-void font-semibold text-sm hover:bg-volt-400 transition-colors"
        >
          Start Shopping
          <svg viewBox="0 0 24 24" fill="none" className="size-4">
            <path d="M5 12h14m-7-7l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </motion.div>
    </div>
  );
}

export function NotFoundIllustration() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="relative mb-8"
      >
        <svg width="280" height="200" viewBox="0 0 280 200" fill="none">
          {/* Phone outline */}
          <rect x="90" y="20" width="100" height="160" rx="20" fill="#0b111d" stroke="#1b2537" strokeWidth="2" />
          <rect x="100" y="40" width="80" height="120" rx="10" fill="url(#phoneScreen)" />
          {/* Dynamic island */}
          <rect x="125" y="30" width="30" height="8" rx="4" fill="#1b2537" />
          {/* 404 text */}
          <text x="140" y="105" textAnchor="middle" fill="#22d3ee" fontSize="28" fontWeight="700" fontFamily="monospace" opacity="0.8">
            404
          </text>
          {/* Broken link icon */}
          <g transform="translate(118, 115)" opacity="0.6">
            <path d="M10 4h4a5 5 0 0 1 0 10h-4" stroke="#8b5cf6" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M16 12H4a5 5 0 0 1 0-10h12" stroke="#22d3ee" strokeWidth="2" fill="none" strokeLinecap="round" />
            <circle cx="2" cy="2" r="2" fill="#8b5cf6" />
            <circle cx="18" cy="14" r="2" fill="#22d3ee" />
          </g>
          {/* Floating particles */}
          <circle cx="40" cy="50" r="3" fill="#22d3ee" opacity="0.3">
            <animate attributeName="cy" values="50;40;50" dur="3s" repeatCount="indefinite" />
          </circle>
          <circle cx="240" cy="70" r="2" fill="#8b5cf6" opacity="0.3">
            <animate attributeName="cy" values="70;55;70" dur="2.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="50" cy="150" r="2.5" fill="#10b981" opacity="0.3">
            <animate attributeName="cy" values="150;138;150" dur="2.8s" repeatCount="indefinite" />
          </circle>
          <circle cx="230" cy="140" r="2" fill="#fbbf24" opacity="0.3">
            <animate attributeName="cy" values="140;128;140" dur="3.2s" repeatCount="indefinite" />
          </circle>
          {/* VOLTAGE text */}
          <text x="140" y="185" textAnchor="middle" fill="#1b2537" fontSize="10" fontWeight="600" letterSpacing="4" fontFamily="monospace">
            VOLTAGE
          </text>
          <defs>
            <linearGradient id="phoneScreen" x1="100" y1="40" x2="180" y2="160">
              <stop stopColor="#22d3ee" stopOpacity="0.08" />
              <stop offset="1" stopColor="#8b5cf6" stopOpacity="0.04" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h1 className="text-3xl font-bold text-ink mb-3">Page not found</h1>
        <p className="text-ink-3 max-w-sm mx-auto mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you back on track.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-volt-500 text-void font-semibold text-sm hover:bg-volt-400 transition-colors"
          >
            Back to Home
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-line text-ink-2 font-medium text-sm hover:bg-panel-2 transition-colors"
          >
            Browse Products
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
