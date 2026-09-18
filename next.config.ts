import type { NextConfig } from "next";

// Backend hamesha isi machine par localhost per chalta hai — kabhi tunnel nahi karna.
// Sirf frontend (port 3000) ko ngrok se tunnel karo; Next.js server khud
// backend se baat karega (server-to-server, same machine).
const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN || 'http://localhost:5000';

const nextConfig: NextConfig = {
  // Ngrok domain allow taake mobile par HMR/dev resources block na hon
  allowedDevOrigins: [
    'coasting-diner-cannon.ngrok-free.dev',
    '192.168.0.117',
    'localhost:3000',
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