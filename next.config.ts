import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  async redirects() {
    return [
      // People (and old links) guess /app for "the app"; land them in the studio.
      { source: "/app", destination: "/studio", permanent: false },
    ];
  },
};

export default nextConfig;
