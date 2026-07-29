"use client";

import { useEffect } from "react";
import { revalidatePro } from "@/lib/pro";

/**
 * Re-checks the Stripe subscription once per load (throttled to twice a day
 * inside `revalidatePro`). Entitlement is cached in this browser, so without
 * this a cancellation or an expired card would never reach the UI.
 */
export default function ProSync() {
  useEffect(() => {
    void revalidatePro();
  }, []);
  return null;
}
