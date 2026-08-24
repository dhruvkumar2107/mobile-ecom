import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/ui/toast';
import { CookieBanner } from '@/components/site/cookie-banner';
import { Onboarding } from '@/components/onboarding/Onboarding';
import { getSettings, DEFAULT_SETTINGS } from '@/lib/services/settings';

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
    <html lang="en" className="dark">
      <body className="min-h-dvh antialiased">
        <CookieBanner />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
