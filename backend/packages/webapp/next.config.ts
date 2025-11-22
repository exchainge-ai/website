import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Configure turbopack with more stable settings
  turbopack: {
    root: "/Users/rtavarez/website", // Set explicit workspace root to fix warnings
    resolveAlias: {
      "@/*": "./src/*",
    },
  },

  // Improve build performance
  distDir: process.env.BUILD_DIR || ".next",

  // Skip type checking and linting during build (for Docker)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Optimize build-time performance
  eslint: {
    ignoreDuringBuilds: true,
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Security headers
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },

          // Performance headers
          {
            key: "Cache-Control",
            value: "public, max-age=3600, stale-while-revalidate=86400",
          },
        ],
      },
      // Separate rule for static assets with longer cache times
      {
        source: "/(.*).(jpe?g|png|gif|svg|webp|avif|mp4|webm|woff2?)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  // Performance optimizations
  // Next.js 15+ uses swcMinify by default, no need to specify it

  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "fxhrsbegdaleyfdhbnys.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  // Cache aggressive response headers for static assets
  async rewrites() {
    return {
      beforeFiles: [
        // Add any rewrites here if needed
      ],
      afterFiles: [
        // Add any rewrites here if needed
      ],
      fallback: [],
    };
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  // Improve development server performance
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 300 * 1000, // 5 minutes - much longer to reduce recompiles
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 12, // Increased for better stability
  },

  // Improve stability of development server
  devIndicators: {
    position: "bottom-right",
  },

  // Transpile workspace packages
  transpilePackages: ["@exchainge/supabase"],

  // Minimal webpack config - custom optimization was causing module loading errors
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Basic HMR configuration for monorepo
      config.watchOptions = {
        ...config.watchOptions,
        poll: 500,
        aggregateTimeout: 800,
        ignored: [
          "**/node_modules/**",
          "**/.next/**",
          "**/dist/**",
          "**/.git/**",
        ],
      };
      config.resolve.symlinks = false;
    }

    // Handle WASM files for Walrus SDK
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    config.module.rules.push({
      test: /\.wasm$/,
      type: "webassembly/async",
    });

    return config;
  },
};

export default nextConfig;
