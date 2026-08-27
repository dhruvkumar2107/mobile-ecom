'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ruler, Check, ChevronDown } from 'lucide-react';

interface SizeRecommendationProps {
  category: string;
  onSelectSize?: (size: string) => void;
}

const sizeCharts: Record<string, { size: string; chest?: string; waist?: string; foot?: string; recommended?: boolean }[]> = {
  phones: [
    { size: 'Compact (< 6.1")', recommended: true },
    { size: 'Standard (6.1-6.5")' },
    { size: 'Large (6.5-6.8")' },
    { size: 'Phablet (6.8"+)' },
  ],
  tablets: [
    { size: 'Mini (8-9")' },
    { size: 'Standard (10-11")', recommended: true },
    { size: 'Pro (12-13")' },
  ],
  clothing: [
    { size: 'XS', chest: '34-36"', waist: '28-30"' },
    { size: 'S', chest: '36-38"', waist: '30-32"' },
    { size: 'M', chest: '38-40"', waist: '32-34"', recommended: true },
    { size: 'L', chest: '40-42"', waist: '34-36"' },
    { size: 'XL', chest: '42-44"', waist: '36-38"' },
    { size: 'XXL', chest: '44-46"', waist: '38-40"' },
  ],
  watches: [
    { size: 'Petite (< 38mm)' },
    { size: 'Standard (38-42mm)', recommended: true },
    { size: 'Large (42-46mm)' },
    { size: 'XL (46mm+)' },
  ],
};

export function SizeRecommendation({ category, onSelectSize }: SizeRecommendationProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [showChart, setShowChart] = useState(false);

  const chart = sizeCharts[category] || sizeCharts.phones;

  return (
    <div className="space-y-3">
      <button
        onClick={() => setShowChart(!showChart)}
        className="flex items-center gap-2 text-sm font-medium text-volt-300 hover:text-volt-200 transition-colors"
      >
        <Ruler className="size-4" />
        Size Guide & Recommendation
        <ChevronDown className={`size-3 transition-transform ${showChart ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {showChart && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-line/30 bg-panel-2/50 p-4 space-y-3">
              <p className="text-xs text-ink-3">
                Based on popular choices, we recommend:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {chart.map((s) => (
                  <motion.button
                    key={s.size}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedSize(s.size);
                      onSelectSize?.(s.size);
                    }}
                    className={`relative p-3 rounded-lg border text-left transition-all ${
                      selectedSize === s.size
                        ? 'border-volt-500 bg-volt-500/10'
                        : 'border-line/30 bg-panel/50 hover:border-line'
                    }`}
                  >
                    {s.recommended && (
                      <span className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full bg-volt-500 text-void text-[9px] font-bold uppercase">
                        Recommended
                      </span>
                    )}
                    <span className="text-sm font-medium text-ink">{s.size}</span>
                    {s.chest && <p className="text-[11px] text-ink-3 mt-1">Chest: {s.chest}</p>}
                    {s.waist && <p className="text-[11px] text-ink-3">Waist: {s.waist}</p>}
                    {selectedSize === s.size && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-2 right-2 size-4 rounded-full bg-volt-500 flex items-center justify-center"
                      >
                        <Check className="size-2.5 text-void" />
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
