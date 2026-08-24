'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastTone = 'success' | 'error' | 'info' | 'warning';
type Toast = { id: number; tone: ToastTone; title: string; body?: string };

const ToastCtx = createContext<{
  push: (t: Omit<Toast, 'id'>) => void;
  success: (title: string, body?: string) => void;
  error: (title: string, body?: string) => void;
  info: (title: string, body?: string) => void;
} | null>(null);

let seq = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (t: Omit<Toast, 'id'>) => {
      const id = ++seq;
      setToasts((list) => [...list.slice(-3), { ...t, id }]);
      // Errors linger — a failed payment message vanishing in 4s is hostile.
      window.setTimeout(() => dismiss(id), t.tone === 'error' ? 8000 : 4500);
    },
    [dismiss],
  );

  const api = useMemo(
    () => ({
      push,
      success: (title: string, body?: string) => push({ tone: 'success', title, body }),
      error: (title: string, body?: string) => push({ tone: 'error', title, body }),
      info: (title: string, body?: string) => push({ tone: 'info', title, body }),
    }),
    [push],
  );

  return (
    <ToastCtx.Provider value={api}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <div className="pointer-events-none fixed inset-x-0 bottom-0 z-200 flex flex-col items-center gap-2 p-4 sm:right-0 sm:bottom-0 sm:left-auto sm:items-end">
            {toasts.map((t) => (
              <ToastCard key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
            ))}
          </div>,
          document.body,
        )}
    </ToastCtx.Provider>
  );
}

const TONE_META: Record<ToastTone, { icon: typeof Info; ring: string; text: string }> = {
  success: { icon: CheckCircle2, ring: 'ring-good-500/30', text: 'text-good-400' },
  error: { icon: XCircle, ring: 'ring-bad-500/30', text: 'text-bad-400' },
  warning: { icon: AlertTriangle, ring: 'ring-warn-500/30', text: 'text-warn-400' },
  info: { icon: Info, ring: 'ring-volt-400/30', text: 'text-volt-300' },
};

function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const meta = TONE_META[toast.tone];
  const Icon = meta.icon;
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'animate-rise pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl bg-panel/95 px-4 py-3 ring-1 ring-inset shadow-lift backdrop-blur-xl',
        meta.ring,
      )}
    >
      <Icon className={cn('mt-0.5 size-4.5 shrink-0', meta.text)} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink">{toast.title}</p>
        {toast.body && <p className="mt-0.5 text-xs leading-relaxed text-ink-3">{toast.body}</p>}
      </div>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="-mr-1 shrink-0 rounded p-1 text-ink-4 transition-colors hover:text-ink"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

/**
 * Falls back to a no-op outside the provider so a component can be rendered in
 * isolation (or in a server-rendered island) without blowing up.
 */
export function useToast() {
  const ctx = useContext(ToastCtx);
  return (
    ctx ?? {
      push: () => undefined,
      success: () => undefined,
      error: () => undefined,
      info: () => undefined,
    }
  );
}
