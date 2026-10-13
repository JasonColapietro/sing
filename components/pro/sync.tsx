"use client";

import { useEffect } from "react";
import { getProState, revalidatePro, subscribePro } from "@/lib/pro";
import { startAutoSync } from "@/lib/sync";

/**
 * Re-checks the Stripe subscription once per page load (throttled to twice a
 * day inside `revalidatePro`) and kicks off cloud sync for Pro members — a
 * pull-merge-push when the last sync is stale, plus a debounced upload
 * whenever practice writes new progress.
 *
 * Sync also starts when Pro arrives on a page that loaded without it: a
 * checkout, a restored Pro key or a redeemed pass all land on a page whose
 * layout never remounts, since every next step is a client navigation. It used
 * to wait for the next full load, so a restorer's history stayed empty and a
 * buyer's first sessions stayed local under copy saying sync was automatic.
 */
export default function ProSync() {
  useEffect(() => {
    void revalidatePro();
    startAutoSync();
    const currentKey = () => {
      const s = getProState();
      return s.active ? s.proKey : null;
    };
    let key = currentKey();
    return subscribePro(() => {
      const next = currentKey();
      if (next && next !== key) startAutoSync();
      key = next;
    });
  }, []);
  return null;
}
