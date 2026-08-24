import { cn } from '@/lib/utils';
import { hashSeed } from '@/lib/utils';

/**
 * ════════════════════════════════════════════════════════════════════════
 *  DEVICE ART
 * ════════════════════════════════════════════════════════════════════════
 *  VOLTAGE ships no binary assets. Every product visual on the site is
 *  rendered here from three inputs the catalog already stores: the colour
 *  hex pair, the product `kind`, and the slug (used as a stable seed so the
 *  same SKU always gets the same specular angle and lens layout).
 *
 *  The payoff is real beyond "no images to host": a new colourway added by a
 *  merchandiser gets correct art the moment the variant row is saved, and the
 *  360° viewer is just a rotation of the same primitive rather than 36
 *  photographs per colour.
 */

export type DeviceKind = 'phone' | 'tablet' | 'wearable' | 'audio' | 'accessory';

type ArtProps = {
  colorHex: string;
  colorHex2?: string | null;
  finish?: string | null;
  kind?: string;
  /** Stable seed — pass the SKU or slug. */
  seed?: string;
  /** 0–35, drives the 360° viewer. */
  frame?: number;
  className?: string;
  brandMark?: string | null;
};

function normaliseKind(kind?: string): DeviceKind {
  if (kind === 'tablet' || kind === 'wearable' || kind === 'audio' || kind === 'accessory') return kind;
  return 'phone';
}

/** Body gradient. `finish` changes the character of the sheen, not the hue. */
function bodyStyle(hex: string, hex2: string | null | undefined, finish: string | null | undefined, angle: number) {
  const second = hex2 || hex;
  const sheen =
    finish === 'matte'
      ? 'rgb(255 255 255 / 0.05)'
      : finish === 'titanium'
        ? 'rgb(255 255 255 / 0.22)'
        : finish === 'ceramic'
          ? 'rgb(255 255 255 / 0.3)'
          : 'rgb(255 255 255 / 0.16)';
  return {
    backgroundImage: `linear-gradient(${angle}deg, ${hex} 0%, ${second} 62%, ${hex} 100%), linear-gradient(115deg, transparent 35%, ${sheen} 48%, transparent 60%)`,
    backgroundBlendMode: 'normal, screen',
  } as React.CSSProperties;
}

/**
 * The phone. An outer body, an inset screen with its own specular streak, a
 * camera island whose lens count varies by seed, and side buttons.
 */
function PhoneArt({ colorHex, colorHex2, finish, seed = '', frame = 0, brandMark }: ArtProps) {
  const r = hashSeed(seed);
  const lenses = r > 0.62 ? 3 : r > 0.28 ? 2 : 1;
  // Frame maps to a rotation and shifts the gradient angle, so spinning the
  // viewer moves the highlight across the body the way a real turntable would.
  const spin = (frame % 36) * 10;
  const angle = 145 + Math.sin((spin * Math.PI) / 180) * 40;
  const tilt = Math.sin((spin * Math.PI) / 180) * 16;

  return (
    <div
      className="relative aspect-[1/2] h-full max-h-full w-auto transition-transform duration-300 ease-out"
      style={{ transform: `perspective(900px) rotateY(${tilt}deg)` }}
    >
      {/* Body */}
      <div
        className="absolute inset-0 rounded-[14%] shadow-[0_30px_60px_-25px_rgb(0_0_0_/_0.9)] ring-1 ring-white/10"
        style={bodyStyle(colorHex, colorHex2, finish, angle)}
      >
        {/* Screen */}
        <div className="absolute inset-[3.5%] overflow-hidden rounded-[12%] bg-gradient-to-br from-black via-[#04070f] to-[#0a1220] ring-1 ring-black/60">
          {/* Specular streak across the glass */}
          <div
            className="absolute -inset-x-1/2 top-0 h-full opacity-60"
            style={{
              background: `linear-gradient(${105 + spin / 3}deg, transparent 40%, rgb(255 255 255 / 0.10) 50%, transparent 58%)`,
            }}
          />
          {/* Dynamic island */}
          <div className="absolute top-[2.5%] left-1/2 h-[2.2%] w-[26%] -translate-x-1/2 rounded-full bg-black/90" />
          {/* Faint on-screen wallpaper wash, tinted by the body colour */}
          <div
            className="absolute inset-0 opacity-35"
            style={{
              background: `radial-gradient(80% 55% at 50% 12%, ${colorHex}55, transparent 70%), radial-gradient(70% 50% at 50% 100%, ${colorHex2 || colorHex}44, transparent 65%)`,
            }}
          />
          {brandMark && (
            <span className="absolute inset-x-0 bottom-[7%] text-center text-[7px] font-semibold tracking-[0.3em] text-white/25 uppercase">
              {brandMark}
            </span>
          )}
        </div>

        {/* Camera island */}
        <div className="absolute top-[3%] left-[7%] flex gap-[6%] rounded-[22%] bg-black/35 p-[2%] ring-1 ring-white/10 backdrop-blur-sm">
          {Array.from({ length: lenses }).map((_, i) => (
            <span
              key={i}
              className="block aspect-square w-[calc(2.6vw+7px)] max-w-3 rounded-full bg-gradient-to-br from-[#1a2130] to-black ring-1 ring-white/15"
            >
              <span className="mt-[26%] ml-[26%] block size-[38%] rounded-full bg-volt-300/25" />
            </span>
          ))}
        </div>

        {/* Side buttons */}
        <div className="absolute top-[22%] -right-[1.2%] h-[9%] w-[1.6%] rounded-r-full bg-black/40" />
        <div className="absolute top-[36%] -right-[1.2%] h-[6%] w-[1.6%] rounded-r-full bg-black/40" />
        <div className="absolute top-[26%] -left-[1.2%] h-[12%] w-[1.6%] rounded-l-full bg-black/40" />
      </div>
    </div>
  );
}

function TabletArt({ colorHex, colorHex2, finish, frame = 0, brandMark }: ArtProps) {
  const spin = (frame % 36) * 10;
  const tilt = Math.sin((spin * Math.PI) / 180) * 12;
  return (
    <div
      className="relative aspect-[3/4] h-full w-auto transition-transform duration-300"
      style={{ transform: `perspective(1100px) rotateY(${tilt}deg)` }}
    >
      <div
        className="absolute inset-0 rounded-[7%] shadow-[0_30px_60px_-25px_rgb(0_0_0_/_0.9)] ring-1 ring-white/10"
        style={bodyStyle(colorHex, colorHex2, finish, 150 + tilt)}
      >
        <div className="absolute inset-[3%] overflow-hidden rounded-[5%] bg-gradient-to-br from-black to-[#0a1220] ring-1 ring-black/60">
          <div
            className="absolute inset-0 opacity-40"
            style={{ background: `radial-gradient(70% 50% at 50% 10%, ${colorHex}55, transparent 70%)` }}
          />
          {brandMark && (
            <span className="absolute inset-x-0 bottom-[5%] text-center text-[8px] tracking-[0.3em] text-white/20 uppercase">
              {brandMark}
            </span>
          )}
        </div>
        <div className="absolute top-[4%] left-[6%] size-[7%] rounded-[28%] bg-black/40 ring-1 ring-white/10" />
      </div>
    </div>
  );
}

function WearableArt({ colorHex, colorHex2, finish, frame = 0 }: ArtProps) {
  const spin = (frame % 36) * 10;
  const tilt = Math.sin((spin * Math.PI) / 180) * 14;
  return (
    <div
      className="relative aspect-[3/4] h-full w-auto transition-transform duration-300"
      style={{ transform: `perspective(900px) rotateY(${tilt}deg)` }}
    >
      {/* Strap */}
      <div className="absolute inset-x-[30%] inset-y-0 rounded-[30%] bg-gradient-to-b from-black/60 via-black/25 to-black/60" />
      {/* Case */}
      <div
        className="absolute inset-x-[10%] top-[22%] aspect-[7/8] rounded-[26%] shadow-[0_20px_44px_-18px_rgb(0_0_0_/_0.9)] ring-1 ring-white/12"
        style={bodyStyle(colorHex, colorHex2, finish, 140 + tilt)}
      >
        <div className="absolute inset-[9%] overflow-hidden rounded-[22%] bg-black ring-1 ring-black/70">
          <div
            className="absolute inset-0 opacity-70"
            style={{ background: `radial-gradient(80% 70% at 50% 25%, ${colorHex}66, transparent 72%)` }}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[9px] font-semibold text-white/70">09:41</span>
            <span className="mt-0.5 h-0.5 w-4 rounded-full bg-volt-400/60" />
          </div>
        </div>
        {/* Crown */}
        <div className="absolute top-[36%] -right-[5%] h-[16%] w-[6%] rounded-r-full bg-black/50" />
      </div>
    </div>
  );
}

function AudioArt({ colorHex, colorHex2, finish, seed = '', frame = 0 }: ArtProps) {
  const overEar = hashSeed(seed) > 0.5;
  const spin = (frame % 36) * 10;
  const tilt = Math.sin((spin * Math.PI) / 180) * 14;

  if (overEar) {
    return (
      <div
        className="relative aspect-square h-full w-auto transition-transform duration-300"
        style={{ transform: `perspective(900px) rotateY(${tilt}deg)` }}
      >
        {/* Headband */}
        <div
          className="absolute inset-x-[18%] top-[8%] h-[46%] rounded-t-full border-[7px] border-b-0"
          style={{ borderColor: colorHex }}
        />
        {/* Cups */}
        {[
          'left-[8%]',
          'right-[8%]',
        ].map((pos) => (
          <div
            key={pos}
            className={cn('absolute top-[44%] aspect-[4/5] w-[30%] rounded-[38%] ring-1 ring-white/12', pos)}
            style={bodyStyle(colorHex, colorHex2, finish, 150 + tilt)}
          >
            <div className="absolute inset-[22%] rounded-full bg-black/55 ring-1 ring-white/8" />
          </div>
        ))}
      </div>
    );
  }

  // Earbud case + one bud
  return (
    <div
      className="relative aspect-square h-full w-auto transition-transform duration-300"
      style={{ transform: `perspective(900px) rotateY(${tilt}deg)` }}
    >
      <div
        className="absolute inset-x-[16%] top-[30%] aspect-[5/4] rounded-[26%] shadow-[0_18px_40px_-16px_rgb(0_0_0_/_0.85)] ring-1 ring-white/12"
        style={bodyStyle(colorHex, colorHex2, finish, 145 + tilt)}
      >
        <div className="absolute inset-x-[12%] top-[46%] h-[3%] rounded-full bg-black/35" />
        <div className="absolute inset-x-[42%] bottom-[10%] h-[4%] rounded-full bg-volt-400/50" />
      </div>
      <div
        className="absolute top-[14%] left-[24%] aspect-[2/5] w-[13%] rotate-[-14deg] rounded-full ring-1 ring-white/12"
        style={bodyStyle(colorHex, colorHex2, finish, 160)}
      >
        <div className="absolute inset-x-0 top-0 aspect-square rounded-full bg-white/12" />
      </div>
    </div>
  );
}

function AccessoryArt({ colorHex, colorHex2, finish, seed = '' }: ArtProps) {
  const r = hashSeed(seed);
  // Three silhouettes keep an accessory grid from looking like one repeated tile.
  const shape = r > 0.66 ? 'brick' : r > 0.33 ? 'puck' : 'cable';

  if (shape === 'cable') {
    return (
      <div className="relative aspect-square h-full w-auto">
        <svg viewBox="0 0 100 100" className="absolute inset-0 size-full">
          <path
            d="M22 18 C 22 46, 78 54, 78 82"
            fill="none"
            stroke={colorHex}
            strokeWidth="7"
            strokeLinecap="round"
          />
          <rect x="14" y="6" width="16" height="20" rx="5" fill={colorHex2 || colorHex} />
          <rect x="70" y="76" width="16" height="20" rx="5" fill={colorHex2 || colorHex} />
        </svg>
      </div>
    );
  }

  if (shape === 'puck') {
    return (
      <div className="relative aspect-square h-full w-auto">
        <div
          className="absolute inset-[16%] rounded-full shadow-[0_20px_44px_-18px_rgb(0_0_0_/_0.85)] ring-1 ring-white/12"
          style={bodyStyle(colorHex, colorHex2, finish, 150)}
        >
          <div className="absolute inset-[26%] rounded-full bg-black/25 ring-1 ring-white/10" />
          <div className="absolute inset-[44%] rounded-full bg-volt-400/40" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-square h-full w-auto">
      <div
        className="absolute inset-x-[14%] top-[26%] aspect-[8/5] rounded-[16%] shadow-[0_20px_44px_-18px_rgb(0_0_0_/_0.85)] ring-1 ring-white/12"
        style={bodyStyle(colorHex, colorHex2, finish, 145)}
      >
        <div className="absolute inset-x-[10%] bottom-[16%] flex gap-[6%]">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="h-1 flex-1 rounded-full bg-black/30" />
          ))}
        </div>
        <div className="absolute top-[16%] right-[12%] size-[9%] rounded-full bg-volt-400/60" />
      </div>
    </div>
  );
}

/** Dispatches to the right silhouette for the product kind. */
export function DeviceArt(props: ArtProps) {
  const kind = normaliseKind(props.kind);
  const Art =
    kind === 'tablet'
      ? TabletArt
      : kind === 'wearable'
        ? WearableArt
        : kind === 'audio'
          ? AudioArt
          : kind === 'accessory'
            ? AccessoryArt
            : PhoneArt;

  return (
    <div className={cn('flex h-full w-full items-center justify-center', props.className)}>
      <Art {...props} />
    </div>
  );
}

/**
 * Framed stage the art sits on. `heroGradient` comes straight from the product
 * row so merchandisers control the backdrop per product.
 */
export function DeviceStage({
  gradient,
  children,
  className,
  glow = true,
}: {
  gradient?: string | null;
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <div
      className={cn(
        'relative isolate flex items-center justify-center overflow-hidden rounded-tile bg-gradient-to-br',
        gradient || 'from-volt-500/25 to-blue-600/10',
        className,
      )}
    >
      <div className="grid-overlay absolute inset-0 opacity-40" aria-hidden />
      {glow && (
        <div
          className="absolute bottom-[-30%] left-1/2 h-[60%] w-[80%] -translate-x-1/2 rounded-full bg-white/10 blur-3xl"
          aria-hidden
        />
      )}
      <div className="relative z-10 flex size-full items-center justify-center p-[8%]">{children}</div>
    </div>
  );
}
