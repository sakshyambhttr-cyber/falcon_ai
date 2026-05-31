/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  poweredByHeader: false,
  compiler: {
    // Remove console.log in production, keep console.error and console.warn
    removeConsole: process.env.NODE_ENV === 'production'
      ? { exclude: ['error', 'warn'] }
      : false
  },
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Force HTTPS for 1 year (preload-ready)
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          // Restrict browser feature access
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
          },
          // Content Security Policy
          // - default-src 'self': only load resources from same origin by default
          // - script-src: allow self + Next.js inline scripts (nonce not used here, so unsafe-inline needed for Next hydration)
          // - style-src: allow self + inline styles (Tailwind/CSS-in-JS)
          // - img-src: allow self, data URIs, and common CDNs
          // - connect-src: allow self + Firebase + Murf + Gemini APIs
          // - frame-ancestors 'none': equivalent to X-Frame-Options DENY
          (() => {
            const vercelHost = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ''
            const customHost = process.env.NEXT_PUBLIC_SITE_URL || ''
            const extraHosts = [vercelHost, customHost].filter(Boolean)
            const extraHostsForConnect = extraHosts.join(' ')
            const extraHostsForFrame = extraHosts.join(' ')

            return {
              key: 'Content-Security-Policy',
              value: [
                "default-src 'self'",
                "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://accounts.google.com https://apis.gstatic.com",
                "style-src 'self' 'unsafe-inline'",
                "img-src 'self' data: blob: https:",
                "font-src 'self' data:",
                "media-src 'self' blob: https://api.murf.ai",
                `connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.firebaseapp.com https://api.murf.ai https://generativelanguage.googleapis.com wss://*.firebaseio.com ${extraHostsForConnect}`,
                `frame-src https://accounts.google.com https://*.googleusercontent.com ${extraHostsForFrame}`,
                "frame-ancestors 'none'",
                "base-uri 'self'",
                "form-action 'self'",
              ].join('; '),
            }
          })(),
        ],
      },
    ]
  },
}

export default nextConfig
