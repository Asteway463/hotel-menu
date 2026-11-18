import type { NextConfig } from 'next';
import withPWA from 'next-pwa';

// Next.js 15 emits internal manifests that are not publicly served.
// Excluding them from precaching keeps SW installation reliable offline.
const buildExcludes = [
  ({ asset }: { asset: { name: string } }) =>
    /(^|\/)(app-build-manifest|build-manifest|react-loadable-manifest|middleware-build-manifest|middleware-react-loadable-manifest|next-font-manifest)\.(json|js)$/.test(
      asset.name
    ),
];

const withPWAConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  clientsClaim: true,
  disable: process.env.NODE_ENV === 'development',
  buildExcludes,
} as never);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
};

export default withPWAConfig(nextConfig);
