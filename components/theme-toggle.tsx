"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const { status: sessionStatus } = useSession();

  useEffect(() => {
    setMounted(true);
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");

    // The local-storage toggle above is what actually renders; this is just a background sync
    // so the choice follows a logged-in user across devices (part of the Settings panel feature).
    if (sessionStatus === "authenticated") {
      fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: next ? "dark" : "light" }),
      }).catch(() => {});
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label={mounted ? (isDark ? "Switch to light theme" : "Switch to dark theme") : "Toggle theme"}
      onClick={toggle}
      className="fixed top-4 right-4 z-50"
    >
      {mounted && !isDark ? <Sun /> : <Moon />}
    </Button>
  );
}
