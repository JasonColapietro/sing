"use client";

import { useEffect } from "react";
import { revalidatePro } from "@/lib/pro";
import { startAutoSync } from "@/lib/sync";

/**
 * Once per page load: re-checks the Stripe subscription (throttled to twice
 * a day inside `revalidatePro`) and kicks off cloud sync for Pro members —
 * a pull-merge-push when the last sync is stale, plus a debounced upload
 * whenever practice writes new progress.
 */
export default function ProSync() {
  useEffect(() => {
    void revalidatePro();
    startAutoSync();
  }, []);
  return null;
}
