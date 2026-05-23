import bundleAnalyzer from "@next/bundle-analyzer";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const MODERN_POLYFILL = path.join(__dirname, "lib/next-modern-polyfill.js");
const NEXT_POLYFILL_MODULE = require.resolve(
  "next/dist/build/polyfills/polyfill-module.js",
);

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const SUPABASE_STORAGE_PATHS = [
  "/storage/v1/object/public/**",
  "/storage/v1/object/sign/**",
  "/storage/v1/render/image/public/**",
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
    /** Inline Tailwind into HTML — removes render-blocking `/_next/static/css/*` links (prod only). */
    inlineCss: true,
    /** Inline above-the-fold CSS; defer the rest to reduce render-blocking Tailwind. */
    optimizeCss: true,
    /** Tree-shake dense icon/motion vendors into smaller per-route chunks. */
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-icons",
      "framer-motion",
      "clsx",
      "tailwind-merge",
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
    /** Bypass Vercel Image Optimization (402 quota) — load Supabase/remote URLs directly. */
    unoptimized: true,
    formats: ["image/avif", "image/webp"],
    /** Hero LCP bucket **412** + trimmed set — avoids 1920+ overserve on mobile. */
    deviceSizes: [384, 412, 640, 750, 828, 1080],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000,
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
  webpack(config, { webpack }) {
    config.resolve.alias = {
      ...config.resolve.alias,
      [NEXT_POLYFILL_MODULE]: MODERN_POLYFILL,
    };
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /polyfills[\\/]polyfill-module(\.js)?$/,
        MODERN_POLYFILL,
      ),
    );
    return config;
  },
};

export default withBundleAnalyzer(nextConfig);
