/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    config.resolve.fallback = { fs: false, net: false, tls: false, crypto: false };
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "sodium-native": false,
      };
    }
    return config;
  },
};

export default nextConfig;
