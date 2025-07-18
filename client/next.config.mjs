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
  devIndicators: {
    buildActivity: process.env.NEXT_DEV_INDICATORS !== 'false',
    buildActivityPosition: 'bottom-right',
  },
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  // Disable error overlay in development
  ...(process.env.NODE_ENV === 'development' && {
    reactStrictMode: false,
    swcMinify: false,
  }),
}

export default nextConfig
