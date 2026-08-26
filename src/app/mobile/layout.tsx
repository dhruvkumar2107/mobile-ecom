import type { Metadata, Viewport } from 'next';
import { MobileShell } from '@/components/mobile/MobileShell';
import './mobile.css';

export const metadata: Metadata = {
  title: {
    default: 'Voltage',
    template: '%s · Voltage',
  },
  description: 'Premium mobiles and electronics, delivered fast.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  appleWebApp: {
    capable: true,
    title: 'Voltage',
    statusBarStyle: 'default',
  },
};

/**
 * The mobile app is a light-theme surface, unlike the dark desktop site.
 * `viewportFit: 'cover'` lets the tab bar and sticky footers extend into the
 * home-indicator area, which the screens pad back out with env(safe-area-inset-*).
 */
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAFAFA' },
    { media: '(prefers-color-scheme: dark)', color: '#FAFAFA' },
  ],
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
};

export default function MobileRootLayout({ children }: { children: React.ReactNode }) {
  return <MobileShell>{children}</MobileShell>;
}
