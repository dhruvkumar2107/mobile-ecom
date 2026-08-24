'use client';

import { useEffect, useState } from 'react';
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageZoomModalProps {
  images: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export function ImageZoomModal({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
}: ImageZoomModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, [initialIndex, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          previousImage();
          break;
        case 'ArrowRight':
          nextImage();
          break;
        case '+':
        case '=':
          zoomIn();
          break;
        case '-':
          zoomOut();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex]);

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const previousImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const zoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.5, 3));
  };

  const zoomOut = () => {
    setZoom((prev) => {
      const newZoom = Math.max(prev - 0.5, 1);
      if (newZoom === 1) {
        setPosition({ x: 0, y: 0 });
      }
      return newZoom;
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom === 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-void/95 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 rounded-full bg-void/80 p-2 text-ink-3 hover:bg-void hover:text-ink transition-all"
        aria-label="Close"
      >
        <X className="size-6" />
      </button>

      {/* Zoom Controls */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 rounded-full bg-void/80 px-4 py-2 backdrop-blur">
        <button
          onClick={(e) => {
            e.stopPropagation();
            zoomOut();
          }}
          disabled={zoom <= 1}
          className="p-1 text-ink-3 hover:text-ink disabled:opacity-30"
          aria-label="Zoom out"
        >
          <ZoomOut className="size-5" />
        </button>
        <span className="min-w-[4rem] text-center text-sm text-ink">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            zoomIn();
          }}
          disabled={zoom >= 3}
          className="p-1 text-ink-3 hover:text-ink disabled:opacity-30"
          aria-label="Zoom in"
        >
          <ZoomIn className="size-5" />
        </button>
      </div>

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              previousImage();
            }}
            className="absolute left-4 z-10 rounded-full bg-void/80 p-2 text-ink-3 hover:bg-void hover:text-ink transition-all"
            aria-label="Previous image"
          >
            <ChevronLeft className="size-6" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              nextImage();
            }}
            className="absolute right-4 z-10 rounded-full bg-void/80 p-2 text-ink-3 hover:bg-void hover:text-ink transition-all"
            aria-label="Next image"
          >
            <ChevronRight className="size-6" />
          </button>
        </>
      )}

      {/* Image Counter */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 rounded-full bg-void/80 px-4 py-2 text-sm text-ink backdrop-blur">
          {currentIndex + 1} / {images.length}
        </div>
      )}

      {/* Image Container */}
      <div
        className="relative flex items-center justify-center w-full h-full p-20"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
      >
        <img
          src={images[currentIndex]}
          alt={`Product image ${currentIndex + 1}`}
          className={cn(
            'max-w-full max-h-full object-contain transition-transform',
            zoom > 1 && 'select-none'
          )}
          style={{
            transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
          }}
          draggable={false}
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10 flex gap-2 rounded-full bg-void/80 p-2 backdrop-blur">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(idx);
                setZoom(1);
                setPosition({ x: 0, y: 0 });
              }}
              className={cn(
                'size-12 rounded overflow-hidden border-2 transition-all',
                idx === currentIndex
                  ? 'border-volt-400 scale-110'
                  : 'border-transparent hover:border-ink-6'
              )}
            >
              <img
                src={img}
                alt={`Thumbnail ${idx + 1}`}
                className="size-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
