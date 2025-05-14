/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com'
      }
    ],
    domains: ['avatars.githubusercontent.com'],
    minimumCacheTTL: 0,
  },
  webpack: (config) => {
    config.resolve.fallback = { 
      fs: false,
      path: false,
      os: false,
      crypto: false,
      stream: false,
      pino: false,
      'pino-pretty': false
    };
    return config;
  },
  transpilePackages: ['@solana/wallet-adapter-react', '@solana/wallet-adapter-base'],
  async headers() {
    return [
      {
        source: '/assets/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig; 