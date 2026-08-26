import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/ui/toast';
import { CookieBanner } from '@/components/site/cookie-banner';
import { Onboarding } from '@/components/onboarding/Onboarding';
import { getSettings, DEFAULT_SETTINGS } from '@/lib/services/settings';

/**
 * Inter was named in every design token but never actually loaded, so the whole
 * site rendered in system-ui. next/font self-hosts it, so there is no runtime
 * request to Google and no layout shift on first paint.
 */
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  // No `weight` on purpose: Inter is a variable font, so omitting it ships ONE
  // file covering 100-900 instead of a separate static file per weight.
  fallback: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
  adjustFontFallback: true,
});

export async function generateMetadata(): Promise<Metadata> {
  let s = DEFAULT_SETTINGS;
  try {
    s = await getSettings();
  } catch {
    // DB unavailable — fall back to defaults so every page still renders
  }
  return {
    icons: {
      icon: '/favicon.ico',
      shortcut: '/favicon.ico',
      apple: '/favicon.ico',
    },
    title: {
      default: `${s.siteTitle} — ${s.siteTagline}`,
      template: `%s · ${s.siteTitle}`,
    },
    description: s.siteTagline,
    applicationName: s.siteTitle,
    formatDetection: { telephone: false },
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  themeColor: '#04060c',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <body className="min-h-dvh antialiased">
        <CookieBanner />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
