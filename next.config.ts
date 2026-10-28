import type { NextConfig } from "next";

// Cache Components is off: the app is auth-gated and fully dynamic, so
// it would only force Suspense boundaries around every cookie read.
const nextConfig: NextConfig = {
  // Tailwind v4 loader for Turbopack (from the create-next-app template).
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
