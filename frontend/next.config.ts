import type { NextConfig } from "next";

const internalGraphqlOrigin =
  process.env.INTERNAL_GRAPHQL_ORIGIN || "http://localhost:4000";

const nextConfig: NextConfig = {
  output: "standalone",
  async redirects() {
    return [{ source: "/favicon.ico", destination: "/globe.svg", permanent: false }];
  },
  async rewrites() {
    return [
      {
        source: "/graphql",
        destination: `${internalGraphqlOrigin}/graphql`,
      },
    ];
  },
};

export default nextConfig;
