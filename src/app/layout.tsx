import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/ui/toast';
import { CookieBanner } from '@/components/site/cookie-banner';
import { Onboarding } from '@/components/onboarding/Onboarding';
import { ThemeProvider } from '@/lib/theme-provider';
import { getSettings, DEFAULT_SETTINGS } from '@/lib/services/settings';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  fallback: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
  adjustFontFallback: true,
});

export async function generateMetadata(): Promise<Metadata> {
  let s = DEFAULT_SETTINGS;
  try {
    s = await getSettings();
  } catch {
    // DB unavailable
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
    <html lang="en" className={`dark ${inter.variable}`} suppressHydrationWarning>
      <body className="min-h-dvh antialiased transition-colors duration-300">
        <ThemeProvider>
          <CookieBanner />
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
