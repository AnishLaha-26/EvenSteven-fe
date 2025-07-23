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
  // Allow cross-origin requests from network addresses during development
  experimental: {
    allowedDevOrigins: ['172.27.19.63:3001'],
  },
}

export default nextConfig
