import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  // The Pro book PDFs live outside public/ so they can't be fetched without a
  // subscription check; make sure the serving route's bundle includes them.
  outputFileTracingIncludes: {
    "/api/book/pdf": ["./content/pdfs/**"],
  },
};

export default nextConfig;
