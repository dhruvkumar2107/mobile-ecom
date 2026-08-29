'use client';

import { useEffect } from 'react';

export default function ShopError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-8 text-center">
      <h2 className="text-lg font-semibold text-ink">Something went wrong</h2>
      <p className="mt-2 text-sm text-ink-3">We hit a snag loading this page. Please try again.</p>
      <button
        onClick={reset}
        className="mt-4 rounded-lg bg-volt-500 px-4 py-2 text-sm font-medium text-void hover:bg-volt-400 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
