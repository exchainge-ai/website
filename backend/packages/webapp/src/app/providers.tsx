"use client";

import { PrivyWrapper } from "@/components/providers/PrivyWrapper";

export function Providers({ children }: { children: React.ReactNode }) {
  return <PrivyWrapper>{children}</PrivyWrapper>;
}
