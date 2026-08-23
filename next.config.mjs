/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }
          // NOTE: X-Frame-Options intentionally omitted so the platform's
          // live-preview iframe can embed the app. Re-enable in production
          // if clickjacking protection is required.
        ]
      }
    ];
  }
};

export default nextConfig;
