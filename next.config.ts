import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  /**
   * The Open Graph routes read their three faces (Brunson, plus Inter regular
   * and semibold) out of `public/fonts` at request time — see `lib/og.tsx`.
   *
   * Next's tracer follows imports, not `fs.readFile(join(process.cwd(), …))`,
   * and files under `public/` are served from the CDN rather than bundled into
   * the function. Without this the fonts are missing in production and every
   * card renders in the generic fallback face; listing them here copies them
   * next to each of these serverless functions.
   */
  outputFileTracingIncludes: {
    "/opengraph-image": ["./public/fonts/*.ttf"],
    "/projects/opengraph-image": ["./public/fonts/*.ttf"],
    "/projects/[slug]/opengraph-image": ["./public/fonts/*.ttf"],
    "/achievements/opengraph-image": ["./public/fonts/*.ttf"],
  },
};

export default nextConfig;
