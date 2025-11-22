import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone", // Required for Docker deployment
  outputFileTracingRoot: path.resolve(__dirname),
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],

  // Configure turbopack aliases for the standalone app
  turbopack: {
    resolveAlias: {
      "@/*": "./src/*",
    },
  },

  // Improve build performance
  distDir: process.env.BUILD_DIR || ".next",

  // Optimize build-time performance
  eslint: {
    // Only run ESLint on specific files when building for production
    dirs: ["src"],
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

          // Cache headers - disable caching in development
          {
            key: "Cache-Control",
            value: process.env.NODE_ENV === "development"
              ? "no-cache, no-store, must-revalidate"
              : "public, max-age=3600, stale-while-revalidate=86400",
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
    ],
  },

  // Cache aggressive response headers for static assets
  async rewrites() {
    return {
      beforeFiles: [
        // Proxy API requests to backend on port 3001
        {
          source: "/api/:path*",
          destination: "http://localhost:3001/api/:path*",
        },
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

  webpack: (config, { dev, isServer }) => {
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        minimize: !dev,
        moduleIds: "deterministic",
        splitChunks: {
          chunks: "all",
          cacheGroups: {
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              name: "react",
              chunks: "all",
              priority: 40,
            },
            privy: {
              test: /[\\/]node_modules[\\/]@privy-io[\\/]/,
              name: "privy",
              chunks: "all",
              priority: 30,
            },
            commons: {
              test: /[\\/]node_modules[\\/]/,
              name: "commons",
              chunks: "all",
              priority: 20,
            },
          },
        },
        runtimeChunk: {
          name: "runtime",
        },
      };
    }

    const solanaKitEntry = isServer
      ? path.resolve(__dirname, "node_modules/@solana/kit/dist/index.node.cjs")
      : path.resolve(__dirname, "node_modules/@solana/kit/dist/index.browser.mjs");

    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@solana/kit": solanaKitEntry,
    };

    if (dev && !isServer) {
      // Optimize HMR for client-side in development with more stability
      config.watchOptions = {
        ...config.watchOptions,
        poll: 500, // Reduced polling interval for better stability
        aggregateTimeout: 800, // Further increased to reduce temporary file collisions
        ignored: [
          "**/node_modules/**",
          "**/.next/**",
          "**/dist/**",
          "**/coverage/**",
          "**/.git/**",
          "**/.turbo/**",
          "**/_buildManifest.js.tmp*", // Ignore temp files that cause errors
        ],
      };

      // Improve module resolution for HMR
      config.resolve.symlinks = false;

      // Add better stability for file operations
      if (config.experiments) {
        config.experiments = {
          ...config.experiments,
          backCompat: true, // Better backward compatibility
        };
      }

      // Suppress React key warnings from third-party libraries during development
      const DefinePlugin = config.plugins.find(
        (plugin: any) => plugin.constructor.name === "DefinePlugin",
      );
      if (DefinePlugin) {
        DefinePlugin.definitions = {
          ...DefinePlugin.definitions,
          __SUPPRESS_PRIVY_WARNINGS__: JSON.stringify(true),
        };
      }
    }
    return config;
  },
};

export default nextConfig;
