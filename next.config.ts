import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack(config) {
    // Allow importing YAML files as plain JavaScript objects
    config.module.rules.push({
      test: /\.ya?ml$/i,
      type: 'json', // let next handle it as json to avoid additional loaders where possible
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
};

export default nextConfig;
