import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Content Security Policy.
 * Trade-off (documented in Readme01.md): script-src allows 'unsafe-inline' because Next.js injects inline
 * hydration scripts and nonce-based CSP would force every page to render dynamically. All user content is
 * rendered as React text (escaped), never as HTML. Razorpay Checkout is the only third-party script.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://checkout.razorpay.com${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://api.razorpay.com https://lumberjack.razorpay.com",
  // YouTube (privacy-enhanced) and Vimeo are the only video embeds custom sections can show.
  "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://www.youtube-nocookie.com https://player.vimeo.com",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Cache Components is intentionally OFF: almost every page is per-user (session cookie) or must reflect
  // publish/unpublish immediately, so the request-time model is simpler and safer here. See AGENTS.md.
  experimental: {
    serverActions: { bodySizeLimit: "11mb" }, // gallery uploads go through Server Actions (API limit is 10 MB)
    // Video uploads (up to 30 MB) stream through the proxy to /api/weddings/[id]/videos; the API enforces the real limit.
    proxyClientMaxBodySize: "32mb",
    // Client cache for visited / prefetched dashboard sections, so switching back to a tab is instant.
    // Every mutation goes through a Server Action that calls revalidatePath, which clears these entries;
    // the editor additionally merges in its own newer edits (features/editor/useSections.ts).
    staleTimes: { dynamic: 30, static: 60 },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
