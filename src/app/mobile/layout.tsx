import type { Metadata, Viewport } from 'next';
import { MobileShell } from '@/components/mobile/MobileShell';
import './mobile.css';

export const metadata: Metadata = {
  title: {
    default: 'Voltage',
    template: '%s · Voltage',
  },
  description: 'Premium mobiles and electronics, delivered fast. Best prices on iPhone, Samsung, OnePlus, Xiaomi and more.',
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
  openGraph: {
    title: 'Voltage - Premium Mobiles & Electronics',
    description: 'Best prices on iPhone, Samsung, OnePlus, Xiaomi and more. Fast delivery, EMI options, genuine warranty.',
    type: 'website',
    locale: 'en_IN',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F1F3F6' },
    { media: '(prefers-color-scheme: dark)', color: '#F1F3F6' },
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
