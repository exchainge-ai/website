"use client";

import { usePrivy } from "@privy-io/react-auth";
import { redirect } from "next/navigation";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { ready, authenticated } = usePrivy();

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!authenticated) {
    redirect("/");
    return null;
  }

  return <>{children}</>;
}
