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

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: supabaseStorageRemotePatterns(),
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

export default nextConfig;
