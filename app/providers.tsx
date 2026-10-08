"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

import { AppStateProvider } from "./providers/AppState";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <AppStateProvider>{children}</AppStateProvider>
    </ThemeProvider>
  );
}
