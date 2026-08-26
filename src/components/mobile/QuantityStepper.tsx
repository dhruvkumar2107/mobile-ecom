'use client';

import { forwardRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { mobileDesign } from '@/lib/mobile-design';
import { MobileImage } from './MobileImage';
import { cn } from '@/lib/utils';
import { Minus, Plus, Check, X, Loader2 } from 'lucide-react';

export interface QuantityStepperProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showInput?: boolean;
  ariaLabel?: string;
  className?: string;
  style?: React.CSSProperties;
}

const sizeStyles = {
  sm: { btnSize: 32, inputWidth: 40, fontSize: 14, iconSize: 16, borderRadius: 8 },
  md: { btnSize: 40, inputWidth: 50, fontSize: 15, iconSize: 18, borderRadius: 10 },
  lg: { btnSize: 48, inputWidth: 60, fontSize: 16, iconSize: 20, borderRadius: 12 },
};

export const QuantityStepper = forwardRef<HTMLDivElement, QuantityStepperProps>(
  (
    {
      value,
      min = 1,
      max = 99,
      step = 1,
      onChange,
      disabled = false,
      size = 'md',
      showInput = true,
      ariaLabel = 'Quantity',
      className,
      style,
    },
    ref
  ) => {
    const [localValue, setLocalValue] = useState(value);
    const [isEditing, setIsEditing] = useState(false);
    const [inputValue, setInputValue] = useState(String(value));

    const s = sizeStyles[size];

    useEffect(() => {
      setLocalValue(value);
      setInputValue(String(value));
    }, [value]);

    const clampValue = useCallback(
      (v: number) => Math.max(min, Math.min(max, v)),
      [min, max]
    );

    const handleIncrement = useCallback(() => {
      if (disabled) return;
      const newValue = clampValue(localValue + step);
      setLocalValue(newValue);
      onChange(newValue);
    }, [disabled, localValue, step, clampValue, onChange]);

    const handleDecrement = useCallback(() => {
      if (disabled) return;
      const newValue = clampValue(localValue - step);
      setLocalValue(newValue);
      onChange(newValue);
    }, [disabled, localValue, step, clampValue, onChange]);

    const handleInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val === '' || /^\d*$/.test(val)) {
          setInputValue(val);
        }
      },
      []
    );

    const handleInputBlur = useCallback(() => {
      const num = parseInt(inputValue, 10);
      if (!isNaN(num)) {
        const newValue = clampValue(num);
        setLocalValue(newValue);
        onChange(newValue);
        setInputValue(String(newValue));
      } else {
        setInputValue(String(localValue));
      }
      setIsEditing(false);
    }, [inputValue, localValue, clampValue, onChange]);

    const handleInputKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
          handleInputBlur();
        } else if (e.key === 'Escape') {
          setInputValue(String(localValue));
          setIsEditing(false);
        }
      },
      [localValue, handleInputBlur]
    );

    const canDecrement = localValue > min;
    const canIncrement = localValue < max;

    return (
      <div
        ref={ref}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0,
          border: `1px solid ${mobileDesign.colors.border}`,
          borderRadius: `${s.borderRadius}px`,
          background: mobileDesign.colors.surface,
          overflow: 'hidden',
          ...style,
        }}
        className={cn('mobile-quantity-stepper', className)}
        role="group"
        aria-label={ariaLabel}
      >
        <motion.button
          onClick={handleDecrement}
          disabled={disabled || !canDecrement}
          whileTap={{ scale: 0.9 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: `${s.btnSize}px`,
            height: `${s.btnSize}px`,
            border: 'none',
            background: canDecrement ? 'transparent' : mobileDesign.colors.borderLight,
            color: canDecrement ? mobileDesign.colors.textPrimary : mobileDesign.colors.textTertiary,
            cursor: disabled || !canDecrement ? 'not-allowed' : 'pointer',
            transition: `all ${mobileDesign.transitions.fast}`,
          }}
          aria-label="Decrease quantity"
          aria-disabled={disabled || !canDecrement}
        >
          <Minus style={{ width: s.iconSize, height: s.iconSize }} aria-hidden="true" />
        </motion.button>

        {showInput && (
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            onFocus={() => setIsEditing(true)}
            disabled={disabled}
            readOnly={!isEditing}
            style={{
              width: `${s.inputWidth}px`,
              height: `${s.btnSize}px`,
              border: 'none',
              background: 'transparent',
              fontSize: `${s.fontSize}px`,
              fontWeight: 600,
              fontFamily: mobileDesign.typography.fontFamily,
              color: mobileDesign.colors.textPrimary,
              textAlign: 'center',
              outline: 'none',
              appearance: 'textfield',
            }}
            className="mobile-no-spinner"
            aria-label="Quantity value"
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={localValue}
          />
        )}

        <motion.button
          onClick={handleIncrement}
          disabled={disabled || !canIncrement}
          whileTap={{ scale: 0.9 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: `${s.btnSize}px`,
            height: `${s.btnSize}px`,
            border: 'none',
            background: canIncrement ? 'transparent' : mobileDesign.colors.borderLight,
            color: canIncrement ? mobileDesign.colors.textPrimary : mobileDesign.colors.textTertiary,
            cursor: disabled || !canIncrement ? 'not-allowed' : 'pointer',
            transition: `all ${mobileDesign.transitions.fast}`,
          }}
          aria-label="Increase quantity"
          aria-disabled={disabled || !canIncrement}
        >
          <Plus style={{ width: s.iconSize, height: s.iconSize }} aria-hidden="true" />
        </motion.button>
      </div>
    );
  }
);

QuantityStepper.displayName = 'QuantityStepper';

export interface SwipeableCartItemProps {
  id: string;
  name: string;
  brand?: string;
  price: number;
  originalPrice?: number;
  image: string;
  quantity: number;
  maxQuantity?: number;
  onQuantityChange: (id: string, quantity: number) => void;
  onDelete: (id: string) => void;
  onPress?: () => void;
  isDeleting?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function SwipeableCartItem({
  id,
  name,
  brand,
  price,
  originalPrice,
  image,
  quantity,
  maxQuantity = 99,
  onQuantityChange,
  onDelete,
  onPress,
  isDeleting = false,
  className,
  style,
}: SwipeableCartItemProps) {
  const [swipeX, setSwipeX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const DELETE_THRESHOLD = 100;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsSwiping(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isSwiping) return;
    const deltaX = e.touches[0].clientX - e.changedTouches[0].clientX;
    if (deltaX > 0) {
      setSwipeX(Math.min(deltaX * 0.5, DELETE_THRESHOLD * 1.5));
    }
  }, [isSwiping]);

  const handleTouchEnd = useCallback(() => {
    setIsSwiping(false);
    if (swipeX > DELETE_THRESHOLD) {
      onDelete(id);
    } else {
      setSwipeX(0);
    }
  }, [swipeX, onDelete, id]);

  const hasDiscount = originalPrice && originalPrice > price;

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
      className={cn('mobile-swipeable-cart-item', className)}
    >
      <motion.div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={onPress}
        style={{
          x: swipeX,
          background: mobileDesign.colors.surface,
          borderRadius: `${mobileDesign.borderRadius.lg}px`,
          boxShadow: mobileDesign.shadows.sm,
          transition: `transform ${mobileDesign.transitions.fast}`,
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        <div style={{ display: 'flex', gap: `${mobileDesign.spacing.md}px`, padding: `${mobileDesign.spacing.md}px` }}>
          <div
            style={{
              position: 'relative',
              width: '80px',
              height: '80px',
              borderRadius: `${mobileDesign.borderRadius.md}px`,
              background: mobileDesign.colors.borderLight,
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            <MobileImage src={image} alt="" sizes="80px" />
          </div>

          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              {brand && (
                <p
                  style={{
                    margin: 0,
                    fontSize: '11px',
                    fontWeight: 500,
                    fontFamily: mobileDesign.typography.fontFamily,
                    color: mobileDesign.colors.textTertiary,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  {brand}
                </p>
              )}
              <h3
                style={{
                  margin: '2px 0 0',
                  fontSize: '14px',
                  fontWeight: 600,
                  fontFamily: mobileDesign.typography.fontFamily,
                  color: mobileDesign.colors.textPrimary,
                  lineHeight: 1.3,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {name}
              </h3>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
              <QuantityStepper
                value={quantity}
                min={1}
                max={maxQuantity}
                onChange={(v) => onQuantityChange(id, v)}
                size="sm"
                disabled={isDeleting}
              />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                <span
                  style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    fontFamily: mobileDesign.typography.fontFamily,
                    color: mobileDesign.colors.textPrimary,
                  }}
                >
                  ₹{price.toLocaleString()}
                </span>
                {hasDiscount && (
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 400,
                      fontFamily: mobileDesign.typography.fontFamily,
                      color: mobileDesign.colors.textTertiary,
                      textDecoration: 'line-through',
                    }}
                  >
                    ₹{originalPrice!.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {swipeX > 20 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              width: Math.max(swipeX, DELETE_THRESHOLD),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: mobileDesign.colors.error,
              borderRadius: `${mobileDesign.borderRadius.lg}px`,
              color: mobileDesign.colors.textInverse,
              fontSize: '14px',
              fontWeight: 600,
              fontFamily: mobileDesign.typography.fontFamily,
              cursor: 'pointer',
            }}
            onClick={() => onDelete(id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onDelete(id)}
            aria-label="Delete item"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 24, height: 24 }} aria-hidden="true">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}