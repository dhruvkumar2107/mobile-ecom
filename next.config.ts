import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: 'standalone',
  // A stray package-lock.json in the user's home dir makes Next guess the wrong
  // workspace root; pin it so file tracing stays inside the project.
  outputFileTracingRoot: process.cwd(),
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
  compiler: {
    // Strip console.* from client bundles in production, keeping error/warn.
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'framer-motion', 'date-fns'],
  },
  images: {
    // Product art is remote; without this next/image refuses to optimize it.
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'plus.unsplash.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
    formats: ['image/avif', 'image/webp'],
    // Phone-first widths — no point generating 2048px variants for a 390px viewport.
    deviceSizes: [360, 420, 640, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 56, 64, 80, 100, 128, 200, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
      {
        // Hashed build assets never change under the same URL.
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/_next/image',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' },
        ],
      },
    ];
  },
};

export default nextConfig;
