/**
 * Priority components for optimized page loading
 * Simplified version without excessive performance monitoring
 */

import React from "react";

/**
 * Priority heading component for important text
 */
export function PriorityHeading({
  children,
  className = "",
  id = "hero-heading",
  priority = true,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  priority?: boolean;
}) {
  // Simple implementation without performance monitoring

  return (
    <h1 id={id} className={className}>
      {children}
    </h1>
  );
}

/**
 * Priority Text Component for Hero Sections
 * - Uses priority rendering
 * - Minimizes layout shifts by pre-setting height
 * - Optimized for faster LCP time
 */
export function PriorityText({
  children,
  className = "",
  id = "hero-text",
  priority = true,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  priority?: boolean;
}) {
  // Simple implementation without performance monitoring

  return (
    <p id={id} className={className}>
      {children}
    </p>
  );
}

/**
 * Hero Section Wrapper with optimizations for LCP
 */
export function OptimizedHero({
  children,
  className = "",
  onLoad,
}: {
  children: React.ReactNode;
  className?: string;
  onLoad?: () => void;
}) {
  React.useEffect(() => {
    // Mark hero section as loaded
    if (onLoad) {
      onLoad();
    }
  }, [onLoad]);

  return (
    <section className={`relative overflow-hidden ${className}`}>
      {children}
    </section>
  );
}
