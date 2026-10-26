// matcha/src/lib/rateLimit.ts
// In-memory sliding window rate limiter (single server process), for the auth and email routes.
import { NextResponse } from "next/server";

type Bucket = { windowMs: number; hits: number[] };

const buckets = new Map<string, Bucket>();
const SWEEP_EVERY_MS = 60_000;
let lastSweep = Date.now();

// Drop the keys whose hits all left their window, so that the map does not grow forever
function sweep(now: number) {
  if (now - lastSweep < SWEEP_EVERY_MS) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.hits.every((t) => now - t >= bucket.windowMs)) buckets.delete(key);
  }
}

function recentHits(key: string, windowMs: number, now: number): number[] {
  const bucket = buckets.get(key);
  const hits = bucket ? bucket.hits.filter((t) => now - t < windowMs) : [];
  buckets.set(key, { windowMs, hits });
  return hits;
}

/**
 * True when key already has limit hits in the last windowMs (the attempt is not recorded)
 */
export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  sweep(now);
  return recentHits(key, windowMs, now).length >= limit;
}

/**
 * Record one hit for key (to count only some attempts, e.g. failed logins)
 */
export function recordHit(key: string, windowMs: number) {
  const now = Date.now();
  recentHits(key, windowMs, now).push(now);
}

/**
 * Check then record: true when the attempt is refused
 */
export function hitRateLimit(key: string, limit: number, windowMs: number): boolean {
  if (isRateLimited(key, limit, windowMs)) return true;
  recordHit(key, windowMs);
  return false;
}

/**
 * Client IP as set by nginx (X-Real-IP overwrites any value sent by the client)
 */
export function clientIp(req: Request): string {
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

export function tooManyRequests() {
  return NextResponse.json(
    { error: "Too many attempts, please try again in a few minutes" },
    { status: 429 }
  );
}
