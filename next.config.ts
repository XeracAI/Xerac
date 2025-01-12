import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: "standalone",
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    ppr: true,
  },
  images: {
    remotePatterns: [
      {
        hostname: 'avatar.vercel.sh',
      },
      {
        hostname: 'oaidalleapiprodscus.blob.core.windows.net',
      },
    ],
  },
};

export default nextConfig;
