import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: "standalone", //to deploy on docker. https://github.com/vercel/next.js/blob/canary/examples/with-docker-multi-env/next.config.js
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
    minimumCacheTTL: 1 * 60 * 60,
  },
};

export default nextConfig;
