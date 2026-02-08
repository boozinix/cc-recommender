/**
 * Redis client for Vercel KV / Upstash Redis.
 * Supports both UPSTASH_* and KV_REST_API_* env vars (Vercel KV migration).
 */
import { Redis } from "@upstash/redis";

const url =
  process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL ?? "";
const token =
  process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN ?? "";

export const redis =
  url && token
    ? new Redis({ url, token })
    : null;

export const KV_KEY_USER_COUNT = "cc_user_count";
