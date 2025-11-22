"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class PrivyErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Log Privy-specific errors but don't crash the app
    if (process.env.NODE_ENV === "development") {
      // Only log critical errors, suppress known Privy issues
      if (
        !error.message.includes("key prop") &&
        !error.message.includes("ERROR: {}") &&
        !(typeof error === "object" && Object.keys(error).length === 0)
      ) {
        console.warn("Privy component error (non-critical):", error.message);
      }
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex items-center justify-center p-4">
            <span className="text-gray-400">Authentication loading...</span>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
