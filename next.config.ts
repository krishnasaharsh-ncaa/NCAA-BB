import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/NCAA-BB",
  assetPrefix: "/NCAA-BB/",
  images: { unoptimized: true },
};

export default nextConfig;
