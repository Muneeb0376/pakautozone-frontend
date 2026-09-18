import type { NextConfig } from "next";

const BACKEND_ORIGIN =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.BACKEND_ORIGIN ||
  'https://auto-marketplace-backend-production.up.railway.app';

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    'localhost:3000',
    '127.0.0.1:3000',
    'pakautozone-frontend.vercel.app',
  ],

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/**' },
    ],
  },

  // ASAL FIX: /api, /uploads, /socket.io ki har request ko Next.js server
  // ke zariye seedha backend (localhost:5000) tak proxy karo. Phone/browser
  // ko backend ka URL kabhi pata nahi chalta — hamesha sirf ngrok domain se
  // baat karta hai. Isse CORS, mixed-content, aur ngrok-port masla khatam.
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${BACKEND_ORIGIN}/api/:path*` },
      { source: '/uploads/:path*', destination: `${BACKEND_ORIGIN}/uploads/:path*` },
      { source: '/socket.io/:path*', destination: `${BACKEND_ORIGIN}/socket.io/:path*` },
    ];
  },
};

export default nextConfig;