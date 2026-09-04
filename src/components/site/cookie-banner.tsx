'use client';

import { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';

export function CookieBanner() {
  const [hasConsent, setHasConsent] = useState(true);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    setHasConsent(consent === 'true');
  }, []);

  if (hasConsent) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-line/50 bg-panel/95 backdrop-blur-xl px-4 py-4 text-sm text-ink-2"
      aria-live="polite"
    >
      <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-volt-400/10 text-volt-300 mt-0.5">
            <Shield className="size-4" aria-hidden />
          </div>
          <p className="text-sm leading-relaxed">
            We use cookies and similar technologies to provide the best experience on our site.{' '}
            <a href="/privacy" className="font-medium text-volt-300 underline underline-offset-2 hover:text-volt-200" rel="noopener noreferrer">
              Privacy Policy
            </a>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setHasConsent(true)}
            className="rounded-xl bg-panel-2 px-4 py-2 text-sm text-ink-2 ring-1 ring-inset ring-line-2 hover:bg-line hover:text-ink transition-colors"
          >
            Decline
          </button>
          <button
            onClick={() => {
              localStorage.setItem('cookie-consent', 'true');
              setHasConsent(true);
            }}
            className="rounded-xl bg-volt-400 px-4 py-2 text-sm font-medium text-void hover:bg-volt-300 transition-colors shadow-lg shadow-volt-500/20"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
