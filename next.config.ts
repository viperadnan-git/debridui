import type {NextConfig} from "next";

const nextConfig: NextConfig = {
  output : "standalone",
  env : {
    NEXT_PUBLIC_BUILD_TIME : new Date().toISOString(),
  },
  async rewrites() {
    return [
      {
        source : "/api/proxy/realdebrid/:path*",
        destination : "https://api.real-debrid.com/rest/1.0/:path*"
      },
      {
        source : "/api/proxy/torbox/:path*",
        destination : "https://api.torbox.app/v1/api/:path*"
      },
      {
        source : "/api/proxy/torbox-search/:path*",
        destination : "https://search-api.torbox.app/:path*"
      },
      {
        source : "/api/proxy/alldebrid/:path*",
        destination : "https://api.alldebrid.com/v4.1/:path*"
      },
    ];
  },
};

export default nextConfig;
