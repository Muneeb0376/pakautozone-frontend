import type { NextConfig } from "next";

const BACKEND_ORIGIN =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.BACKEND_ORIGIN ||
  'https://auto-marketplace-backend-production.up.railway.app';

// NextAuth ke apne endpoints. Yeh Next.js ke andar handle hote hain,
// backend (Railway) ko nahi jane chahiye.
const NEXTAUTH_ROUTES =
  'providers|session|csrf|signin|signout|callback|error|verify-request|_log';

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

  // /api ki requests backend ko proxy hoti hain, siwaye NextAuth ke endpoints ke.
  async rewrites() {
    return [
      {
        source: `/api/:path((?!auth/(?:${NEXTAUTH_ROUTES})).*)`,
        destination: `${BACKEND_ORIGIN}/api/:path`,
      },
      { source: '/uploads/:path*', destination: `${BACKEND_ORIGIN}/uploads/:path*` },
      { source: '/socket.io/:path*', destination: `${BACKEND_ORIGIN}/socket.io/:path*` },
    ];
  },
};

export default nextConfig;