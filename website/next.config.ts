import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    localPatterns: [
      {
        pathname: "/images/**",
        search: "?v=2",
      },
    ],
  },
};

export default nextConfig;
