'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IconButton } from './button';

/**
 * Focus-trapping overlay used by both Modal and Sheet. Kept deliberately small:
 * Escape closes, background scroll locks, focus returns to the trigger.
 */
function useOverlay(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const restoreTo = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreTo.current = document.activeElement;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !ref.current) return;
      const focusables = ref.current.querySelectorAll<HTMLElement>(
        'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
      );
      if (!focusables.length) return;
      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey, true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Defer so the panel is mounted before we move focus into it.
    const t = window.setTimeout(() => {
      const target = ref.current?.querySelector<HTMLElement>(
        '[data-autofocus],input:not([type="hidden"]),button',
      );
      target?.focus();
    }, 40);

    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = prevOverflow;
      window.clearTimeout(t);
      (restoreTo.current as HTMLElement | null)?.focus?.();
    };
  }, [open, onClose]);

  return ref;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const ref = useOverlay(open, onClose);
  if (!open || typeof document === 'undefined') return null;

  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' } as const;

  return createPortal(
    <div className="fixed inset-0 z-100 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-void/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        className={cn(
          'animate-rise panel bevel relative flex max-h-[92vh] w-full flex-col rounded-b-none sm:rounded-panel',
          widths[size],
          className,
        )}
      >
        {(title || description) && (
          <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
            <div className="min-w-0">
              {title && <h2 className="text-base font-semibold tracking-tight text-ink">{title}</h2>}
              {description && <p className="mt-1 text-sm text-ink-3">{description}</p>}
            </div>
            <IconButton label="Close" onClick={onClose} size="icon-sm">
              <X className="size-4" />
            </IconButton>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-line bg-abyss/50 px-5 py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

/** Right-hand (or bottom, on mobile) drawer — filters, cart, quick edit. */
export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
  side = 'right',
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  side?: 'right' | 'left' | 'bottom';
  className?: string;
}) {
  const ref = useOverlay(open, onClose);
  if (!open || typeof document === 'undefined') return null;

  const pos =
    side === 'bottom'
      ? 'inset-x-0 bottom-0 max-h-[88vh] rounded-t-panel border-t'
      : side === 'left'
        ? 'inset-y-0 left-0 w-full max-w-md border-r'
        : 'inset-y-0 right-0 w-full max-w-md border-l';

  return createPortal(
    <div className="fixed inset-0 z-100">
      <div className="absolute inset-0 bg-void/80 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        className={cn(
          'absolute flex flex-col border-line bg-abyss/95 shadow-lift backdrop-blur-xl',
          pos,
          className,
        )}
      >
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
          <h2 className="text-base font-semibold tracking-tight text-ink">{title}</h2>
          <IconButton label="Close" onClick={onClose} size="icon-sm">
            <X className="size-4" />
          </IconButton>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="border-t border-line bg-void/60 px-5 py-4">{footer}</div>
        )}
      </div>
    </div>,
    document.body,
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  tone = 'primary',
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  tone?: 'primary' | 'danger';
  loading?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-lg px-3.5 text-sm text-ink-2 transition-colors hover:bg-panel-2 hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              'h-9 rounded-lg px-4 text-sm font-semibold transition-colors disabled:opacity-50',
              tone === 'danger'
                ? 'bg-bad-500 text-white hover:bg-bad-400'
                : 'bg-volt-400 text-void hover:bg-volt-300',
            )}
          >
            {loading ? 'Working…' : confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-ink-2">{message}</p>
    </Modal>
  );
}
