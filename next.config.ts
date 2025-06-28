import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack(config) {
    // Allow importing YAML files as plain JavaScript objects
    config.module.rules.push({
      test: /\.ya?ml$/i,
      type: 'javascript/auto', // allow yaml-loader to output JS module
      use: 'yaml-loader',
    });
    return config;
  },

  // Turbopack (dev) configuration
  turbopack: {
    rules: {
      '*.yaml': {
        loaders: ['yaml-loader'],
        as: '*.js',
      },
      '*.yml': {
        loaders: ['yaml-loader'],
        as: '*.js',
      },
    },
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
