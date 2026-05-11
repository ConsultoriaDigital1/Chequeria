/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true
  },
  serverExternalPackages: ["@anthropic-ai/sdk"]
};

export default nextConfig;
