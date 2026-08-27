'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingBag, Share2, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { mobileDesign } from '@/lib/mobile-design';
import { formatINR } from '@/lib/money';

interface VideoProduct {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  thumbnail: string;
  videoUrl: string;
  likes: number;
  comments: number;
}

const mockVideos: VideoProduct[] = [
  {
    id: '1', name: 'iPhone 15 Pro Max', brand: 'Apple', price: 13490000, thumbnail: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&q=80', videoUrl: '', likes: 2340, comments: 89,
  },
  {
    id: '2', name: 'Galaxy S24 Ultra', brand: 'Samsung', price: 12999000, originalPrice: 13999000, thumbnail: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&q=80', videoUrl: '', likes: 1820, comments: 67,
  },
  {
    id: '3', name: 'Sony WH-1000XM5', brand: 'Sony', price: 2499000, thumbnail: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80', videoUrl: '', likes: 3100, comments: 142,
  },
  {
    id: '4', name: 'MacBook Air M3', brand: 'Apple', price: 11490000, thumbnail: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80', videoUrl: '', likes: 4200, comments: 201,
  },
];

export function VideoFeed() {
  const [currentVideo, setCurrentVideo] = useState(0);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const scrollTop = containerRef.current.scrollTop;
    const height = containerRef.current.clientHeight;
    const newIndex = Math.round(scrollTop / height);
    if (newIndex !== currentVideo) setCurrentVideo(newIndex);
  }, [currentVideo]);

  const toggleLike = useCallback((id: string) => {
    setLiked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{
        height: '100vh',
        overflowY: 'scroll',
        scrollSnapType: 'y mandatory',
        background: '#000',
      }}
    >
      {mockVideos.map((video, index) => (
        <div
          key={video.id}
          style={{
            height: '100vh',
            scrollSnapAlign: 'start',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#111',
          }}
        >
          <img
            src={video.thumbnail}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'brightness(0.6)',
            }}
          />

          {/* Gradient overlays */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '50%',
            background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
          }} />

          {/* Product info overlay */}
          <div style={{
            position: 'absolute',
            bottom: 80,
            left: 16,
            right: 80,
            color: 'white',
          }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#22d3ee', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: 1 }}>
              {video.brand}
            </p>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px', lineHeight: 1.3 }}>
              {video.name}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px', fontWeight: 700 }}>{formatINR(video.price)}</span>
              {video.originalPrice && (
                <span style={{ fontSize: '14px', textDecoration: 'line-through', opacity: 0.6 }}>
                  {formatINR(video.originalPrice)}
                </span>
              )}
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              style={{
                marginTop: '12px',
                padding: '10px 24px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #059669, #047857)',
                color: 'white',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <ShoppingBag style={{ width: 16, height: 16 }} />
              Add to Cart
            </motion.button>
          </div>

          {/* Right side actions */}
          <div style={{
            position: 'absolute',
            right: 12,
            bottom: 120,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
          }}>
            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={() => toggleLike(video.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                border: 'none',
                background: 'none',
                color: liked.has(video.id) ? '#f43f5e' : 'white',
                cursor: 'pointer',
              }}
              aria-label={liked.has(video.id) ? 'Unlike' : 'Like'}
            >
              <Heart style={{ width: 28, height: 28, fill: liked.has(video.id) ? '#f43f5e' : 'none' }} />
              <span style={{ fontSize: '11px' }}>{video.likes + (liked.has(video.id) ? 1 : 0)}</span>
            </motion.button>

            <button
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                border: 'none',
                background: 'none',
                color: 'white',
                cursor: 'pointer',
              }}
              aria-label="Comments"
            >
              <svg viewBox="0 0 24 24" fill="none" style={{ width: 28, height: 28 }}>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span style={{ fontSize: '11px' }}>{video.comments}</span>
            </button>

            <button
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                border: 'none',
                background: 'none',
                color: 'white',
                cursor: 'pointer',
              }}
              aria-label="Share"
            >
              <Share2 style={{ width: 24, height: 24 }} />
              <span style={{ fontSize: '11px' }}>Share</span>
            </button>

            <button
              onClick={() => setMuted(!muted)}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: 'none',
                background: 'rgba(0,0,0,0.4)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              aria-label={muted ? 'Unmute' : 'Mute'}
            >
              {muted ? <VolumeX style={{ width: 16, height: 16 }} /> : <Volume2 style={{ width: 16, height: 16 }} />}
            </button>
          </div>

          {/* Progress indicator */}
          <div style={{
            position: 'absolute',
            left: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}>
            {mockVideos.map((_, i) => (
              <div
                key={i}
                style={{
                  width: 3,
                  height: i === currentVideo ? 24 : 12,
                  borderRadius: 2,
                  background: i === currentVideo ? '#22d3ee' : 'rgba(255,255,255,0.3)',
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
