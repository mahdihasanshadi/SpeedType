"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { getGuestTests, clearGuestTests } from "@/lib/guest-tests";

/** Fires once per session the instant auth resolves to "authenticated" — covers signup, login,
 * and OAuth uniformly, wherever the user lands afterward. See ux-flows.md Flow 4. */
export function GuestMigration() {
  const { status } = useSession();
  const attemptedRef = useRef(false);

  useEffect(() => {
    if (status !== "authenticated") return;

    const guestTests = getGuestTests();
    if (guestTests.length === 0 || attemptedRef.current) return;
    attemptedRef.current = true;

    fetch("/api/tests/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(guestTests),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { imported: number } | null) => {
        if (!data || typeof data.imported !== "number") return;
        clearGuestTests();
        const count = data.imported;
        toast.success(`Imported ${count} test${count === 1 ? "" : "s"} from this device.`);
      })
      .catch(() => {});
  }, [status]);

  return null;
}
