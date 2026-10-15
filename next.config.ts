import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/cozinhagourmet", destination: "/cozinhagourmet/index.html" },
      { source: "/isaacnewton", destination: "/isaacnewton/index.html" },
    ];
  },
};

export default nextConfig;
