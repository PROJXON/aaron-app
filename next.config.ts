import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",  // Enables static export (replaces `next export`)
  distDir: "out",    // Ensures build output goes to the correct folder
  images: {
    unoptimized: true,  // Since GitHub Pages doesn't support image optimization
  },
  basePath: "/aaron-app",  // Change this to match your GitHub repo name
  trailingSlash: true,  // Ensures proper routing on GitHub Pages
  assetPrefix: "/aaron-app/"
};

export default nextConfig;
