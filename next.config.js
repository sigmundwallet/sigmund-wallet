// @ts-check
const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  swcMinify: true,
  webpack(config, { isServer }) {
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ["@svgr/webpack"],
    });

    if (isServer && config.name === "server") {
      const oldEntry = config.entry;

      return {
        ...config,
        async entry(...args) {
          const entries = await oldEntry(...args);
          return {
            ...entries,
            bitcoinTracker: path.resolve(
              process.cwd(),
              "bitcoin-tracker/index.ts"
            ),
          };
        },
      };
    }

    return config;
  },
};

module.exports = nextConfig;
