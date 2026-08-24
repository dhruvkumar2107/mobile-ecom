import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/ui/toast';
import { getSettings } from '@/lib/services/settings';

/**
 * Fonts come from the CSS token stack in globals.css rather than
 * `next/font/google`. next/font fetches the font files at build time, which
 * turns `next build` into a network-dependent step — the site renders
 * identically on the system stack, so the dependency is not worth it.
 */

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
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
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
