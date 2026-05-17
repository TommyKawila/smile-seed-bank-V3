import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const SUPABASE_STORAGE_PATHS = [
  "/storage/v1/object/public/**",
  "/storage/v1/object/sign/**",
];

function supabaseStorageRemotePatterns() {
  const hosts = new Set();
  /** Canonical project host — also used as fallback in `lib/public-storage-url.ts`. */
  hosts.add("jysdfxxilyjmjdmhazbu.supabase.co");
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (raw) {
    try {
      hosts.add(new URL(raw.trim()).hostname);
    } catch {
      /* ignore invalid env */
    }
  }
  return [...hosts].flatMap((hostname) =>
    SUPABASE_STORAGE_PATHS.map((pathname) => ({
      protocol: "https",
      hostname,
      port: "",
      pathname,
    })),
  );
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
  transpilePackages: [
    "framer-motion",
    "embla-carousel-react",
    "embla-carousel",
    "lottie-react",
    "lottie-web",
    "recharts",
    "cmdk",
    "@dnd-kit/core",
    "@dnd-kit/sortable",
    "@dnd-kit/utilities",
    "emoji-picker-react",
  ],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "@radix-ui/react-icons",
      "recharts",
      "cmdk",
      "sonner",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-select",
      "@radix-ui/react-tabs",
      "@radix-ui/react-popover",
      "@radix-ui/react-scroll-area",
      "@radix-ui/react-tooltip",
      "@radix-ui/react-accordion",
    ],
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  images: {
    /** Serve originals from source hosts; skips `/_next/image` (avoids Vercel optimizer 400s on some WebP streams). Supabase paths often already use `/products/optimized/`. */
    unoptimized: true,
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
  webpack(config, { dev, isServer }) {
    if (!dev && !isServer) {
      if (config.optimization?.splitChunks?.cacheGroups) {
        config.optimization.splitChunks.cacheGroups.styles = {
          name: "styles",
          test: /\.css$/,
          chunks: "all",
          enforce: true,
          priority: 100, // Dominant override flag to group layout and dynamic streamed CSS together
        };
      }
    }
    return config;
  },
};

export default withBundleAnalyzer(nextConfig);
