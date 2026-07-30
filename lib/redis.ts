import "server-only";

import { Redis } from "@upstash/redis";

let client: Redis | null | undefined;

/**
 * The sync store, or null when the Upstash integration isn't provisioned
 * yet. Callers turn null into a clear "sync not configured" response rather
 * than crashing, so the app deploys and runs fine without the store and
 * lights up the moment the env vars exist.
 */
export function getRedis(): Redis | null {
  if (client !== undefined) return client;
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  client = url && token ? new Redis({ url, token }) : null;
  return client;
}
