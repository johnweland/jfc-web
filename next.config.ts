import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // Amplify-provisioned S3 buckets — bucket name varies per environment/region
        protocol: "https",
        hostname: "*.s3.*.amazonaws.com",
        pathname: "/inventory/**",
      },
    ],
  },
};

export default nextConfig;
