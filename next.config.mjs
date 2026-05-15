import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
function supabaseStorageRemotePatterns() {
  const hosts = new Set();
  /** Project ref: `jysdfxxilyjmjdmhazbu` (includes `i` after `xx`). */
  hosts.add("jysdfxxilyjmjdmhazbu.supabase.co");
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (raw) {
    try {
      hosts.add(new URL(raw).hostname);
    } catch {
      /* ignore invalid env */
    }
  }
  return [...hosts].map((hostname) => ({
    protocol: "https",
    hostname,
    port: "",
    pathname: "/storage/v1/object/public/**",
  }));
}

/** Extra hostnames for next/image (comma-separated), e.g. `mybucket.s3.ap-southeast-1.amazonaws.com`. */
function extraImageRemotePatterns() {
  const raw = process.env.NEXT_PUBLIC_IMAGE_REMOTE_HOSTS ?? "";
  const hosts = raw
    .split(",")
    .map((h) => h.trim())
    .filter(Boolean);
  return hosts.map((hostname) => ({
    protocol: "https",
    hostname,
    port: "",
    pathname: "/**",
  }));
}

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion", "@radix-ui/react-icons"],
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 2678400,
    qualities: [60, 65, 68, 70, 72, 74, 75],
    deviceSizes: [384, 390, 414, 480, 640, 750, 828, 960, 1080],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      ...supabaseStorageRemotePatterns(),
      ...extraImageRemotePatterns(),
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ucarecdn.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
