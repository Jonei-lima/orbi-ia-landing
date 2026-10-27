import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/cozinhagourmet", destination: "/cozinhagourmet/index.html" },
      { source: "/isaacnewton", destination: "/isaacnewton/index.html" },
      { source: "/politica", destination: "/politica/index.html" },
      { source: "/termos", destination: "/termos/index.html" },
      { source: "/dom-barreto-7q4k", destination: "/dom-barreto-7q4k/index.html" },
    ];
  },
};

export default nextConfig;
