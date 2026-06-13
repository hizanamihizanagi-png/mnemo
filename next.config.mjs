/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["three"],
  eslint: {
    // Lint is run separately; don't fail production builds on lint.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
