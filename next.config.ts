import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["tesseract.js", "canvas", "pdf-to-img"],
};

export default nextConfig;
