import type { NextConfig } from "next";
import ReactComponentNamePlugin from "@evolu/scan/react-component-name/webpack";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config) => {
    config.plugins.push(ReactComponentNamePlugin({}))
    return config
  }
};

export default nextConfig;
