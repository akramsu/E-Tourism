/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Hide Next.js error overlay and icons
  reactStrictMode: false,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Suppress warnings and errors in development
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
  // Custom webpack config
  webpack: (config, { dev, isServer }) => {
    // Suppress all warnings in development
    config.infrastructureLogging = {
      level: 'error',
    };
    
    config.stats = {
      warnings: false,
      errors: false,
    };
    
    // Hide source maps in development
    if (dev) {
      config.devtool = false;
    }
    
    return config;
  },
}

export default nextConfig
