/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Server Action ve Worker Pool stabilitesi için
  experimental: {
    serverActions: {
      allowedOrigins: ["vidanjorcum.com", "*.vidanjorcum.com"],
    },
  },
  trailingSlash: false,
};

export default nextConfig;
