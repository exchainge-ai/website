/**
 * Script to add web vitals tracking to the application
 * This helps monitor Core Web Vitals like LCP, CLS, and INP
 */

"use client";

import { useEffect } from "react";

// Threshold values based on Google's recommendations
const LCP_THRESHOLD_GOOD = 2500; // ms
const LCP_THRESHOLD_NEEDS_IMPROVEMENT = 4000; // ms

const CLS_THRESHOLD_GOOD = 0.1;
const CLS_THRESHOLD_NEEDS_IMPROVEMENT = 0.25;

const INP_THRESHOLD_GOOD = 200; // ms
const INP_THRESHOLD_NEEDS_IMPROVEMENT = 500; // ms

/**
 * WebVitalsReporter component to measure and report web vitals metrics
 * Add this to your layout or root component
 */
export function WebVitalsReporter() {
  useEffect(() => {
    // Only run in the browser
    if (typeof window === "undefined") {
      return;
    }

    // LCP measurement
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      const lcp = lastEntry.startTime;

      let status = "good";
      if (lcp > LCP_THRESHOLD_NEEDS_IMPROVEMENT) {
        status = "poor";
      } else if (lcp > LCP_THRESHOLD_GOOD) {
        status = "needs-improvement";
      }

      console.log(`[WebVitals] LCP: ${Math.round(lcp)}ms (${status})`);

      // Send to analytics in production
      if (process.env.NODE_ENV === "production") {
        // sendToAnalytics({ name: 'LCP', value: lcp, status });
      }
    });

    // CLS measurement
    let clsValue = 0;
    let clsEntries = [];

    const clsObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();

      entries.forEach((entry) => {
        // Only count layout shifts without recent user input
        // Need to use type assertion since LayoutShift is not in standard TS types
        const layoutShift = entry as PerformanceEntry & {
          hadRecentInput?: boolean;
          value: number;
        };

        if (!layoutShift.hadRecentInput) {
          clsValue += layoutShift.value;
          clsEntries.push(layoutShift);
        }
      });

      let status = "good";
      if (clsValue > CLS_THRESHOLD_NEEDS_IMPROVEMENT) {
        status = "poor";
      } else if (clsValue > CLS_THRESHOLD_GOOD) {
        status = "needs-improvement";
      }

      console.log(`[WebVitals] CLS: ${clsValue.toFixed(3)} (${status})`);
    });

    // INP measurement (Interaction to Next Paint)
    const inpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      let maxDuration = 0;
      let maxEntry;

      entries.forEach((entry) => {
        if (entry.duration > maxDuration) {
          maxDuration = entry.duration;
          maxEntry = entry;
        }
      });

      if (maxEntry) {
        let status = "good";
        if (maxDuration > INP_THRESHOLD_NEEDS_IMPROVEMENT) {
          status = "poor";
        } else if (maxDuration > INP_THRESHOLD_GOOD) {
          status = "needs-improvement";
        }

        console.log(
          `[WebVitals] INP: ${Math.round(maxDuration)}ms (${status})`,
        );
      }
    });

    // Start observing
    try {
      lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
      clsObserver.observe({ type: "layout-shift", buffered: true });

      // First Input Delay is deprecated, use Interaction to Next Paint instead
      // Need to use type assertion for custom options
      inpObserver.observe({
        type: "event",
        buffered: true,
        // Using type assertion for non-standard options
        ...({ durationThreshold: 16 } as unknown as PerformanceObserverInit),
      });

      return () => {
        lcpObserver.disconnect();
        clsObserver.disconnect();
        inpObserver.disconnect();
      };
    } catch (e) {
      console.warn(
        "[WebVitals] PerformanceObserver not supported in this browser",
      );
    }
  }, []);

  return null;
}

// Export a hook for easier integration
export function useWebVitals() {
  useEffect(() => {
    // Add optimization hints
    if (typeof document !== "undefined") {
      document.documentElement.style.setProperty("content-visibility", "auto");
    }
  }, []);
}
