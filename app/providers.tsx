"use client";

import { DemoSessionShortcut } from "@/app/_components/demo-session-shortcut";
import { WorkerProvider } from "@/src/hooks/use-worker";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WorkerProvider>
      {children}
      <DemoSessionShortcut />
    </WorkerProvider>
  );
}
