import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * ════════════════════════════════════════════════════════════════════════
 *  BRAND MARK
 * ════════════════════════════════════════════════════════════════════════
 *  The VOLTAGE logo, rendered entirely from type and gradients — there is no
 *  logo file in this repo. The glyph is a lucide bolt sitting in a bevelled
 *  cyan tile; the wordmark is wide-tracked semibold caps carrying
 *  `.text-gradient` (ink → cyan → violet), which is the one place on the site
 *  where all three accents are allowed to appear together.
 *
 *  `compact` drops to the tile alone for the mobile bar and the app-icon-sized
 *  slots, keeping the accessible name via a visually hidden wordmark.
 */

const SIZES = {
  sm: { tile: 'size-6 rounded-md', bolt: 'size-3.5', word: 'text-[15px]', gap: 'gap-1.5' },
  md: { tile: 'size-8 rounded-lg', bolt: 'size-[18px]', word: 'text-lg', gap: 'gap-2' },
  lg: { tile: 'size-11 rounded-xl', bolt: 'size-6', word: 'text-2xl', gap: 'gap-2.5' },
} as const;

export type BrandMarkSize = keyof typeof SIZES;

export function BrandMark({
  size = 'md',
  compact = false,
  className,
}: {
  size?: BrandMarkSize;
  compact?: boolean;
  className?: string;
}) {
  const s = SIZES[size];

  return (
    <span className={cn('inline-flex items-center', s.gap, className)}>
      <span
        aria-hidden
        className={cn(
          'relative inline-flex shrink-0 items-center justify-center bg-gradient-to-br from-volt-400 to-volt-600 text-void ring-1 ring-inset ring-white/25',
          'shadow-[0_6px_22px_-8px_rgb(34_211_238_/_0.75)]',
          s.tile,
        )}
      >
        <Zap className={cn('fill-current', s.bolt)} strokeWidth={1.5} />
      </span>

      <span
        className={cn(
          'text-gradient font-semibold tracking-[0.2em] whitespace-nowrap uppercase',
          s.word,
          // The gradient clips to the glyphs, so the trailing letter-space has
          // to be reclaimed or the mark reads as off-centre.
          '-mr-[0.2em]',
          compact && 'sr-only',
        )}
      >
        Voltage
      </span>
    </span>
  );
}
