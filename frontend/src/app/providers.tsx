"use client";

import { PrivyWrapper } from "@/components/providers/PrivyWrapper";
import { SuiProvider } from "@/components/providers/SuiProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyWrapper>
      <SuiProvider>{children}</SuiProvider>
    </PrivyWrapper>
  );
}
