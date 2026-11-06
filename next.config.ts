import type { NextConfig } from 'next';

const config: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.sanity.io', pathname: '/images/**' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  experimental: {
    // A finished piece plus up to 6 process shots. Per-file limits are checked in the action.
    serverActions: { bodySizeLimit: '30mb' },
  },
  poweredByHeader: false,
};

export default config;
