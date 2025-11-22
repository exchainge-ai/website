import type { Metadata } from "next";
import "./globals.css";
import Footer from "@/components/layout/Footer";
import Navigation from "@/components/layout/Navigation";
import { Providers } from "./providers";
import "@/lib/console-override";
import { WebVitalsReporter } from "@/lib/web-vitals";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "ExchAInge - Physical AI Data Marketplace",
  description: "Build better AI with real-world robotics data you can trust. The marketplace for verified physical AI datasets.",
  openGraph: {
    title: "ExchAInge - Physical AI Data Marketplace",
    description: "Build better AI with real-world robotics data you can trust. The marketplace for verified physical AI datasets.",
    url: "https://exchainge.ai",
    siteName: "ExchAInge",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ExchAInge - Physical AI Data Marketplace",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ExchAInge - Physical AI Data Marketplace",
    description: "Build better AI with real-world robotics data you can trust. The marketplace for verified physical AI datasets.",
    images: ["/og-image.png"],
  },
};

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Force cache bust in development */}
        {process.env.NODE_ENV === "development" && (
          <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        )}
      </head>
      <body
        className="min-h-screen bg-background font-sans antialiased"
        suppressHydrationWarning={true}
      >
        <Providers>
          <WebVitalsReporter />
          <Analytics />
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1f2937',
                color: '#fff',
                border: '1px solid #374151',
              },
              success: {
                iconTheme: {
                  primary: '#6DF77E',
                  secondary: '#0C2B31',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
          <div className="relative flex min-h-screen flex-col">
            <Navigation />
            <main className="flex-1 pt-16">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
