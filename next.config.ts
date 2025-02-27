import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  distDir: 'out', // Ensure output is placed in 'out' for GitHub Pages
  images: {
    unoptimized: true, // GitHub Pages does not support Next.js image optimization
  },
};

export default nextConfig;
