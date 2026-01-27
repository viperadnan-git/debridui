import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // Note: "standalone" output is used for Docker builds
    // For Cloudflare Workers, use `bun run cf:build` which handles this automatically
    output: process.env.BUILD_STANDALONE === "true" ? "standalone" : undefined,
    env: {
        NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
    },
};

export default nextConfig;
