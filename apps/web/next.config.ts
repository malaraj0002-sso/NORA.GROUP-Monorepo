import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const baseSecurityHeaders = [
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
];

const productionSecurityHeaders = [
  ...baseSecurityHeaders,
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      "object-src 'none'",
      "img-src 'self' data: blob: https://cdn.sanity.io",
      "font-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "connect-src 'self' https://*.sanity.io https://cdn.sanity.io wss://*.sanity.io",
      "frame-src 'self' https://*.sanity.io",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  transpilePackages: ['next-intl', 'next-sanity', 'sanity'],
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.sanity.io' }],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  serverExternalPackages: ['@sanity/vision'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers:
          process.env.NODE_ENV === 'production' ? productionSecurityHeaders : baseSecurityHeaders,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
