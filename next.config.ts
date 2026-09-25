import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Cho phep /_next/image toi uu anh bia blog luu tren Supabase Storage
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 2592000,
  },
};

export default nextConfig;
