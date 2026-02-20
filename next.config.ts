import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Fix workspace root detection when project lives inside a parent directory
  // that also has a package.json / lockfile (e.g. a monorepo-like layout)
  outputFileTracingRoot: path.resolve(__dirname),
};

export default nextConfig;
