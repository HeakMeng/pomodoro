import { NextResponse } from "next/server";

import {
  deleteSubscription,
  readSubscriptions,
} from "../../../lib/server/store";
import { sendPush, type PushPayload } from "../../../lib/server/webpush";

type SendBody = Partial<PushPayload> & { title?: string };

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const header = req.headers.get("authorization");
  if (header === `Bearer ${secret}`) return true;
  const query = new URL(req.url).searchParams.get("secret");
  return query === secret;
}

export async function POST(req: Request): Promise<NextResponse> {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as SendBody | null;
  const payload: PushPayload = {
    title: body?.title ?? "Pomodoro Timer",
    body: body?.body,
    url: body?.url ?? "/",
    tag: body?.tag,
  };

  const subs = await readSubscriptions();
  if (subs.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, results: [] });
  }

  const results = await Promise.all(
    subs.map((s) =>
      sendPush({ endpoint: s.endpoint, keys: s.keys }, payload),
    ),
  );

  await Promise.all(
    results
      .filter((r) => !r.ok && (r.statusCode === 404 || r.statusCode === 410))
      .map((r) => deleteSubscription(r.endpoint)),
  );

  return NextResponse.json({
    ok: true,
    sent: results.filter((r) => r.ok).length,
    results,
  });
}
