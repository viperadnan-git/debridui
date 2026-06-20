import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: "standalone",
    env: {
        NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
    },
    async redirects() {
        // Friendly aliases for the canonical /movies and /shows slug routes (307, temporary).
        return [
            { source: "/movie/:slug", destination: "/movies/:slug", permanent: false },
            { source: "/film/:slug", destination: "/movies/:slug", permanent: false },
            { source: "/show/:slug", destination: "/shows/:slug", permanent: false },
            { source: "/tv/:slug", destination: "/shows/:slug", permanent: false },
            { source: "/series/:slug", destination: "/shows/:slug", permanent: false },
        ];
    },
};

export default nextConfig;
