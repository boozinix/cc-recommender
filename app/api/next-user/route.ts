import { NextResponse } from "next/server";
import { redis, KV_KEY_USER_COUNT } from "@/app/lib/redis";

const MAX_USERS = 500;

export async function GET() {
  if (!redis) {
    return NextResponse.json(
      { error: "Redis not configured. Add Upstash Redis from Vercel Marketplace." },
      { status: 503 }
    );
  }

  try {
    const count = await redis.incr(KV_KEY_USER_COUNT);
    if (count > MAX_USERS) {
      await redis.decr(KV_KEY_USER_COUNT);
      return NextResponse.json({ atLimit: true, userNumber: null });
    }
    return NextResponse.json({ atLimit: false, userNumber: count });
  } catch (e) {
    console.error("next-user error:", e);
    return NextResponse.json(
      { error: "Failed to assign user number" },
      { status: 500 }
    );
  }
}
