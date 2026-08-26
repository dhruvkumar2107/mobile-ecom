'use client';

import { useEffect, useCallback, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { mobileDesign } from '@/lib/mobile-design';
import { X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const sizeStyles = {
  sm: { maxWidth: '320px', width: 'calc(100% - 32px)' },
  md: { maxWidth: '400px', width: 'calc(100% - 32px)' },
  lg: { maxWidth: '520px', width: 'calc(100% - 32px)' },
  xl: { maxWidth: '640px', width: 'calc(100% - 32px)' },
  full: { maxWidth: '100%', width: '100%' },
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className,
  style,
}: ModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) {
        onClose();
      }
    },
    [closeOnEscape, onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const modalContent = (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: mobileDesign.zIndex.modal,
          background: mobileDesign.colors.overlay,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: `${mobileDesign.spacing.lg}px`,
        }}
        onClick={closeOnOverlayClick ? onClose : undefined}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        aria-describedby={description ? 'modal-description' : undefined}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{
            ...sizeStyles[size],
            maxHeight: 'calc(100vh - 64px)',
            background: mobileDesign.colors.surface,
            borderRadius: `${mobileDesign.borderRadius.xl}px`,
            boxShadow: mobileDesign.shadows.xl,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
          onClick={(e) => e.stopPropagation()}
          className={cn('mobile-modal', className)}
        >
          {(title || showCloseButton) && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: `${mobileDesign.spacing.lg}px ${mobileDesign.spacing.xl}px`,
                borderBottom: `1px solid ${mobileDesign.colors.borderLight}`,
                flexShrink: 0,
              }}
            >
              <div>
                {title && (
                  <h2
                    id="modal-title"
                    style={{
                      margin: 0,
                      fontSize: '18px',
                      fontWeight: 600,
                      fontFamily: mobileDesign.typography.fontFamily,
                      color: mobileDesign.colors.textPrimary,
                      lineHeight: 1.3,
                    }}
                  >
                    {title}
                  </h2>
                )}
                {description && (
                  <p
                    id="modal-description"
                    style={{
                      margin: `${mobileDesign.spacing.xs}px 0 0`,
                      fontSize: '14px',
                      fontWeight: 400,
                      fontFamily: mobileDesign.typography.fontFamily,
                      color: mobileDesign.colors.textSecondary,
                      lineHeight: 1.5,
                    }}
                  >
                    {description}
                  </p>
                )}
              </div>
              {showCloseButton && (
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  style={{
                    width: `${mobileDesign.touchTarget}px`,
                    height: `${mobileDesign.touchTarget}px`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    borderRadius: `${mobileDesign.borderRadius.md}px`,
                    background: mobileDesign.colors.borderLight,
                    color: mobileDesign.colors.textSecondary,
                    cursor: 'pointer',
                    transition: `all ${mobileDesign.transitions.fast}`,
                  }}
                  aria-label="Close modal"
                >
                  <X style={{ width: 20, height: 20 }} aria-hidden="true" />
                </motion.button>
              )}
            </div>
          )}

          <div
            style={{
              flex: 1,
              overflow: 'auto',
              padding: `${mobileDesign.spacing.lg}px ${mobileDesign.spacing.xl}px`,
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {children}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  if (typeof window === 'undefined') return null;

  return createPortal(modalContent, document.body);
}

export interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
  showDragIndicator?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const sheetSizeStyles = {
  sm: { height: '30%' },
  md: { height: '50%' },
  lg: { height: '75%' },
  full: { height: '100%' },
};

export function Sheet({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showDragIndicator = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className,
  style,
}: SheetProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) {
        onClose();
      }
    },
    [closeOnEscape, onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const sheetContent = (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: mobileDesign.zIndex.modal,
          background: mobileDesign.colors.overlay,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
        }}
        onClick={closeOnOverlayClick ? onClose : undefined}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'sheet-title' : undefined}
        aria-describedby={description ? 'sheet-description' : undefined}
      >
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{
            width: '100%',
            maxHeight: sheetSizeStyles[size].height,
            background: mobileDesign.colors.surface,
            borderTopLeftRadius: `${mobileDesign.borderRadius.xl}px`,
            borderTopRightRadius: `${mobileDesign.borderRadius.xl}px`,
            boxShadow: mobileDesign.shadows.xl,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
          onClick={(e) => e.stopPropagation()}
          className={cn('mobile-sheet', className)}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: `${mobileDesign.spacing.md}px ${mobileDesign.spacing.xl}px`,
              borderBottom: `1px solid ${mobileDesign.colors.borderLight}`,
              flexShrink: 0,
            }}
          >
            {showDragIndicator && (
              <motion.div
                style={{
                  width: '40px',
                  height: '5px',
                  borderRadius: `${mobileDesign.borderRadius.full}px`,
                  background: mobileDesign.colors.border,
                  marginBottom: title ? `${mobileDesign.spacing.md}px` : 0,
                }}
              />
            )}
            {(title || description) && (
              <div style={{ textAlign: 'center', width: '100%' }}>
                {title && (
                  <h2
                    id="sheet-title"
                    style={{
                      margin: 0,
                      fontSize: '18px',
                      fontWeight: 600,
                      fontFamily: mobileDesign.typography.fontFamily,
                      color: mobileDesign.colors.textPrimary,
                      lineHeight: 1.3,
                    }}
                  >
                    {title}
                  </h2>
                )}
                {description && (
                  <p
                    id="sheet-description"
                    style={{
                      margin: `${mobileDesign.spacing.xs}px 0 0`,
                      fontSize: '14px',
                      fontWeight: 400,
                      fontFamily: mobileDesign.typography.fontFamily,
                      color: mobileDesign.colors.textSecondary,
                      lineHeight: 1.5,
                    }}
                  >
                    {description}
                  </p>
                )}
              </div>
            )}
          </div>

          <div
            style={{
              flex: 1,
              overflow: 'auto',
              padding: `${mobileDesign.spacing.lg}px ${mobileDesign.spacing.xl}px`,
              paddingBottom: `calc(${mobileDesign.spacing.xl}px + env(safe-area-inset-bottom, 0))`,
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {children}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  if (typeof window === 'undefined') return null;

  return createPortal(sheetContent, document.body);
}

export interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  loading?: boolean;
}

export function AlertDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  loading = false,
}: AlertDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} description={description} size="sm">
      <div style={{ display: 'flex', flexDirection: 'column', gap: `${mobileDesign.spacing.md}px` }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: `${mobileDesign.spacing.sm}px`,
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background:
                variant === 'destructive'
                  ? 'var(--mobile-color-error-light)'
                  : 'var(--mobile-color-accent-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {variant === 'destructive' ? (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                style={{ width: 24, height: 24, color: 'var(--mobile-color-error)' }}
                aria-hidden="true"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                style={{ width: 24, height: 24, color: 'var(--mobile-color-accent)' }}
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            )}
          </div>
          <h3
            style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: 600,
              fontFamily: mobileDesign.typography.fontFamily,
              color: mobileDesign.colors.textPrimary,
              lineHeight: 1.3,
            }}
          >
            {title}
          </h3>
          {description && (
            <p
              style={{
                margin: 0,
                fontSize: '14px',
                fontWeight: 400,
                fontFamily: mobileDesign.typography.fontFamily,
                color: mobileDesign.colors.textSecondary,
                lineHeight: 1.5,
              }}
            >
              {description}
            </p>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            gap: `${mobileDesign.spacing.md}px`,
            marginTop: `${mobileDesign.spacing.md}px`,
          }}
        >
          <motion.button
            onClick={onClose}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            style={{
              flex: 1,
              padding: `${mobileDesign.spacing.md}px ${mobileDesign.spacing.lg}px`,
              fontSize: '15px',
              fontWeight: 600,
              fontFamily: mobileDesign.typography.fontFamily,
              borderRadius: `${mobileDesign.borderRadius.lg}px`,
              border: `1px solid ${mobileDesign.colors.border}`,
              background: 'transparent',
              color: mobileDesign.colors.textPrimary,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: `all ${mobileDesign.transitions.fast}`,
            }}
          >
            {cancelText}
          </motion.button>

          <motion.button
            onClick={() => { onConfirm(); onClose(); }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            style={{
              flex: 1,
              padding: `${mobileDesign.spacing.md}px ${mobileDesign.spacing.lg}px`,
              fontSize: '15px',
              fontWeight: 600,
              fontFamily: mobileDesign.typography.fontFamily,
              borderRadius: `${mobileDesign.borderRadius.lg}px`,
              border: 'none',
              background:
                variant === 'destructive'
                  ? 'var(--mobile-color-error)'
                  : 'var(--mobile-color-accent)',
              color: mobileDesign.colors.textInverse,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: `all ${mobileDesign.transitions.fast}`,
            }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  style={{
                    width: 18,
                    height: 18,
                    animation: 'spin 1s linear infinite',
                  }}
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" strokeOpacity="1" strokeLinecap="round" />
                </svg>
                Loading...
              </span>
            ) : (
              confirmText
            )}
          </motion.button>
        </div>
      </div>
    </Modal>
  );
}

export interface ToastProps {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'warning';
  onClose: (id: string) => void;
  duration?: number;
}

export function Toast({ id, title, description, variant = 'default', onClose, duration = 4000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => onClose(id), duration);
    return () => clearTimeout(timer);
  }, [id, onClose, duration]);

  const variantStyles = {
    default: { bg: 'var(--mobile-color-surface)', border: 'var(--mobile-color-border)', iconColor: 'var(--mobile-color-accent)' },
    success: { bg: 'var(--mobile-color-success-light)', border: 'var(--mobile-color-success)', iconColor: 'var(--mobile-color-success)' },
    error: { bg: 'var(--mobile-color-error-light)', border: 'var(--mobile-color-error)', iconColor: 'var(--mobile-color-error)' },
    warning: { bg: 'var(--mobile-color-warning-light)', border: 'var(--mobile-color-warning)', iconColor: 'var(--mobile-color-warning)' },
  };

  const v = variantStyles[variant];

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{
        display: 'flex',
        gap: `${mobileDesign.spacing.md}px`,
        padding: `${mobileDesign.spacing.md}px ${mobileDesign.spacing.lg}px`,
        background: v.bg,
        border: `1px solid ${v.border}`,
        borderRadius: `${mobileDesign.borderRadius.lg}px`,
        boxShadow: mobileDesign.shadows.lg,
        minWidth: '280px',
        maxWidth: '400px',
      }}
      role="alert"
      aria-live="polite"
    >
      <div
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          background: v.iconColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: '2px',
        }}
      >
        {variant === 'success' && (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} style={{ width: 14, height: 14, color: 'white' }} aria-hidden="true">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        )}
        {variant === 'error' && (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} style={{ width: 14, height: 14, color: 'white' }} aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        )}
        {variant === 'warning' && (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} style={{ width: 14, height: 14, color: 'white' }} aria-hidden="true">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        )}
        {variant === 'default' && (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} style={{ width: 14, height: 14, color: 'white' }} aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: '14px',
            fontWeight: 600,
            fontFamily: mobileDesign.typography.fontFamily,
            color: mobileDesign.colors.textPrimary,
            lineHeight: 1.4,
          }}
        >
          {title}
        </p>
        {description && (
          <p
            style={{
              margin: `${mobileDesign.spacing.xs}px 0 0`,
              fontSize: '13px',
              fontWeight: 400,
              fontFamily: mobileDesign.typography.fontFamily,
              color: mobileDesign.colors.textSecondary,
              lineHeight: 1.4,
            }}
          >
            {description}
          </p>
        )}
      </div>

      <motion.button
        onClick={() => onClose(id)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '24px',
          height: '24px',
          border: 'none',
          background: 'transparent',
          color: mobileDesign.colors.textTertiary,
          borderRadius: `${mobileDesign.borderRadius.sm}px`,
          cursor: 'pointer',
          flexShrink: 0,
          transition: `all ${mobileDesign.transitions.fast}`,
        }}
        aria-label="Dismiss notification"
      >
        <X style={{ width: 16, height: 16 }} aria-hidden="true" />
      </motion.button>
    </motion.div>
  );
}

export interface ToastContainerProps {
  toasts: ToastProps[];
  onClose: (id: string) => void;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
}

const positionStyles = {
  'top-left': { top: '16px', left: '16px', right: 'auto', bottom: 'auto', flexDirection: 'column' as const, alignItems: 'flex-start' as const },
  'top-right': { top: '16px', right: '16px', left: 'auto', bottom: 'auto', flexDirection: 'column' as const, alignItems: 'flex-end' as const },
  'bottom-left': { bottom: '100px', left: '16px', right: 'auto', top: 'auto', flexDirection: 'column-reverse' as const, alignItems: 'flex-start' as const },
  'bottom-right': { bottom: '100px', right: '16px', left: 'auto', top: 'auto', flexDirection: 'column-reverse' as const, alignItems: 'flex-end' as const },
  'top-center': { top: '16px', left: '50%', transform: 'translateX(-50%)', right: 'auto', bottom: 'auto', flexDirection: 'column' as const, alignItems: 'center' as const },
  'bottom-center': { bottom: '100px', left: '50%', transform: 'translateX(-50%)', right: 'auto', top: 'auto', flexDirection: 'column-reverse' as const, alignItems: 'center' as const },
};

export function ToastContainer({ toasts, onClose, position = 'bottom-right' }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  const pos = positionStyles[position];

  return createPortal(
    <div
      style={{
        position: 'fixed',
        zIndex: mobileDesign.zIndex.toast,
        display: 'flex',
        gap: `${mobileDesign.spacing.sm}px`,
        padding: `${mobileDesign.spacing.sm}px`,
        pointerEvents: 'none',
        ...pos,
      }}
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => (
        <div key={toast.id} style={{ pointerEvents: 'auto', width: '100%' }}>
          <Toast {...toast} onClose={onClose} />
        </div>
      ))}
    </div>,
    document.body
  );
}