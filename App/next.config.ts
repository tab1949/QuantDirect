import type { NextConfig } from "next";

const enableStaticExport = process.env.NEXT_APP_EXPORT === "true";

const nextConfig: NextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  /* config options here */
};

if (enableStaticExport) {
  nextConfig.output = "export";
  // Ensure asset URLs remain relative when served via file:// inside Electron.
  nextConfig.assetPrefix = "./";
}

export default nextConfig;
