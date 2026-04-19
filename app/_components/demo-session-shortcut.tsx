"use client";

import * as React from "react";
import { useWorker } from "@/src/hooks/use-worker";

export function DemoSessionShortcut() {
  const { state, signIn } = useWorker();
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.localStorage.getItem("gpubnb-demo-session") === "enabled" && !state.signedIn) {
      signIn("Priya");
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "k") return;
      event.preventDefault();
      window.localStorage.setItem("gpubnb-demo-session", "enabled");
      signIn("Priya");
      setVisible(true);
      window.setTimeout(() => setVisible(false), 2400);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [signIn, state.signedIn]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: 16,
        bottom: 16,
        zIndex: 60,
        border: "1px solid rgba(20,20,16,0.16)",
        background: "rgba(244,241,234,0.94)",
        color: "var(--ink)",
        padding: "10px 14px",
        borderRadius: 2,
        boxShadow: "0 12px 40px rgba(20,20,16,0.12)",
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        letterSpacing: 0.04,
        textTransform: "uppercase"
      }}
    >
      Demo session enabled · signed in as Priya
    </div>
  );
}
