'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { mobileDesign } from '@/lib/mobile-design';

const segments = [
  { label: '10% Off', color: '#059669', reward: '10% discount' },
  { label: '50 Pts', color: '#8b5cf6', reward: '50 loyalty points' },
  { label: 'Free Ship', color: '#22d3ee', reward: 'Free shipping' },
  { label: '25 Pts', color: '#fbbf24', reward: '25 loyalty points' },
  { label: '₹100 Off', color: '#f43f5e', reward: '₹100 discount' },
  { label: '5 Pts', color: '#6b7a96', reward: '5 loyalty points' },
  { label: '20% Off', color: '#10b981', reward: '20% discount' },
  { label: '100 Pts', color: '#8b5cf6', reward: '100 loyalty points' },
];

interface SpinWheelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SpinWheel({ isOpen, onClose }: SpinWheelProps) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [reward, setReward] = useState<string | null>(null);
  const segmentAngle = 360 / segments.length;

  const spin = useCallback(() => {
    if (spinning) return;
    setSpinning(true);
    setReward(null);

    const winningIndex = Math.floor(Math.random() * segments.length);
    const targetAngle = 360 - (winningIndex * segmentAngle + segmentAngle / 2);
    const totalRotation = rotation + 360 * 5 + targetAngle;

    setRotation(totalRotation);

    setTimeout(() => {
      setSpinning(false);
      setReward(segments[winningIndex].reward);
    }, 4500);
  }, [spinning, rotation, segmentAngle]);

  const resetWheel = useCallback(() => {
    setReward(null);
    setRotation(0);
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 500,
            background: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#FFFFFF',
              borderRadius: '24px',
              padding: '24px',
              width: '100%',
              maxWidth: '340px',
              textAlign: 'center',
            }}
          >
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>
              Spin to Win!
            </h2>
            <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 20px' }}>
              Try your luck — every spin wins a reward
            </p>

            <div style={{ position: 'relative', width: 240, height: 240, margin: '0 auto 20px' }}>
              {/* Pointer */}
              <div style={{
                position: 'absolute',
                top: -8,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '10px solid transparent',
                borderRight: '10px solid transparent',
                borderTop: '16px solid #111827',
                zIndex: 10,
              }} />

              {/* Wheel */}
              <motion.div
                animate={{ rotate: rotation }}
                transition={{ duration: 4.5, ease: [0.17, 0.67, 0.12, 0.99] }}
                style={{
                  width: 240,
                  height: 240,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  position: 'relative',
                  border: '4px solid #111827',
                }}
              >
                <svg viewBox="0 0 240 240" width="240" height="240">
                  {segments.map((seg, i) => {
                    const startAngle = (i * segmentAngle * Math.PI) / 180;
                    const endAngle = ((i + 1) * segmentAngle * Math.PI) / 180;
                    const x1 = 120 + 120 * Math.cos(startAngle);
                    const y1 = 120 + 120 * Math.sin(startAngle);
                    const x2 = 120 + 120 * Math.cos(endAngle);
                    const y2 = 120 + 120 * Math.sin(endAngle);
                    const midAngle = ((i + 0.5) * segmentAngle * Math.PI) / 180;
                    const textX = 120 + 75 * Math.cos(midAngle);
                    const textY = 120 + 75 * Math.sin(midAngle);
                    const textRotation = (i + 0.5) * segmentAngle;

                    return (
                      <g key={i}>
                        <path
                          d={`M120,120 L${x1},${y1} A120,120 0 0,1 ${x2},${y2} Z`}
                          fill={seg.color}
                        />
                        <text
                          x={textX}
                          y={textY}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="white"
                          fontSize="11"
                          fontWeight="700"
                          transform={`rotate(${textRotation}, ${textX}, ${textY})`}
                          fontFamily="system-ui"
                        >
                          {seg.label}
                        </text>
                      </g>
                    );
                  })}
                  <circle cx="120" cy="120" r="20" fill="#111827" />
                  <circle cx="120" cy="120" r="16" fill="#FFFFFF" />
                </svg>
              </motion.div>
            </div>

            <AnimatePresence mode="wait">
              {reward ? (
                <motion.div
                  key="reward"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div style={{
                    padding: '16px',
                    borderRadius: '12px',
                    background: '#ECFDF5',
                    marginBottom: '12px',
                  }}>
                    <p style={{ fontSize: '13px', color: '#059669', margin: 0, fontWeight: 600 }}>
                      You won: {reward}
                    </p>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { resetWheel(); onClose(); }}
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: '12px',
                      border: 'none',
                      background: '#059669',
                      color: 'white',
                      fontSize: '15px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Claim Reward
                  </motion.button>
                </motion.div>
              ) : (
                <motion.button
                  key="spin"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={spin}
                  disabled={spinning}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '12px',
                    border: 'none',
                    background: spinning ? '#9CA3AF' : 'linear-gradient(135deg, #059669, #047857)',
                    color: 'white',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: spinning ? 'not-allowed' : 'pointer',
                  }}
                >
                  {spinning ? 'Spinning...' : 'Spin the Wheel'}
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
