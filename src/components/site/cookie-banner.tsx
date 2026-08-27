'use client';

import { useState, useEffect } from 'react';

export function CookieBanner() {
  const [hasConsent, setHasConsent] = useState(true);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    setHasConsent(consent === 'true');
  }, []);

  if (hasConsent) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-void border-t border-line z-50 px-4 py-3 text-sm text-ink-2"
      aria-live="polite"
    >
      We use cookies and similar technologies to provide the best experience on our site. <a href="/privacy" className="underline underline-offset-2 hover:text-volt-300" rel="noopener noreferrer">Privacy Policy</a>.
      <div className="mt-2 flex gap-2">
        <button
          onClick={() => {
            localStorage.setItem('cookie-consent', 'true');
            setHasConsent(true);
          }}
          className="rounded bg-volt-400 px-3 py-1.5 text-void hover:bg-volt-300 transition-colors"
        >
          Accept
        </button>
        <button
          onClick={() => setHasConsent(true)}
          className="rounded bg-panel-2 px-3 py-1.5 text-volt-300 hover:text-volt-400 transition-colors"
        >
          Manage
        </button>
      </div>
    </div>
  );
}
