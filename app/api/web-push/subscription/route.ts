import { NextResponse } from "next/server";

import {
  deleteSubscription,
  saveSubscription,
  type StoredSubscription,
} from "../../../lib/server/store";

type SubscriptionBody = {
  endpoint: string;
  expirationTime: number | null;
  keys: { p256dh: string; auth: string };
};

function isSubscriptionBody(x: unknown): x is SubscriptionBody {
  if (typeof x !== "object" || x == null) return false;
  const o = x as Record<string, unknown>;
  const keys = o.keys as Record<string, unknown> | null | undefined;
  return (
    typeof o.endpoint === "string" &&
    (o.expirationTime === null || typeof o.expirationTime === "number") &&
    typeof keys === "object" &&
    keys != null &&
    typeof keys.p256dh === "string" &&
    typeof keys.auth === "string"
  );
}

export async function POST(req: Request): Promise<NextResponse> {
  const payload = (await req.json().catch(() => null)) as unknown;
  if (!isSubscriptionBody(payload)) {
    return NextResponse.json(
      { ok: false, error: "Invalid subscription payload." },
      { status: 400 },
    );
  }
  const stored: StoredSubscription = {
    endpoint: payload.endpoint,
    expirationTime: payload.expirationTime,
    keys: payload.keys,
    createdAt: Date.now(),
  };
  await saveSubscription(stored);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request): Promise<NextResponse> {
  const url = new URL(req.url);
  const endpoint = url.searchParams.get("endpoint");
  if (endpoint) {
    await deleteSubscription(endpoint);
    return NextResponse.json({ ok: true });
  }
  const payload = (await req.json().catch(() => null)) as unknown;
  if (
    payload &&
    typeof payload === "object" &&
    typeof (payload as Record<string, unknown>).endpoint === "string"
  ) {
    await deleteSubscription((payload as { endpoint: string }).endpoint);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json(
    { ok: false, error: "endpoint required" },
    { status: 400 },
  );
}
