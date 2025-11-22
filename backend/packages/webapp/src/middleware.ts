import { NextRequest, NextResponse } from "next/server";

/**
 * CORS Middleware for API routes
 * Allows public frontend (https://exchainge.io) to call private backend API
 */

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  "https://exchainge.io",
  "https://www.exchainge.io",
  "https://exchainge-ai-frontend.vercel.app", // Vercel preview deployments
  "http://localhost:3000", // Local development
  "http://localhost:3001",
];

// For Vercel preview deployments: allow *.vercel.app
function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;

  // Check exact matches
  if (ALLOWED_ORIGINS.includes(origin)) return true;

  // Allow Vercel preview deployments
  if (origin.endsWith(".vercel.app")) return true;

  return false;
}

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin");

  // Handle preflight OPTIONS request
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": isAllowedOrigin(origin) ? origin! : "",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "86400", // 24 hours
      },
    });
  }

  // Clone response and add CORS headers
  const response = NextResponse.next();

  if (isAllowedOrigin(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin!);
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  }

  return response;
}

// Apply middleware only to API routes
export const config = {
  matcher: "/api/:path*",
};
