import { NextResponse } from "next/server";

import {
  deleteSubscription,
  readAlerts,
  readSubscriptions,
  writeAlerts,
} from "../../lib/server/store";
import { sendPush, type PushPayload } from "../../lib/server/webpush";

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const header = req.headers.get("authorization");
  if (header === `Bearer ${secret}`) return true;
  const query = new URL(req.url).searchParams.get("secret");
  return query === secret;
}

async function fireAll(payload: PushPayload) {
  const subs = await readSubscriptions();
  if (subs.length === 0) return { sent: 0, pruned: 0 };
  const results = await Promise.all(
    subs.map((s) =>
      sendPush({ endpoint: s.endpoint, keys: s.keys }, payload),
    ),
  );
  const stale = results.filter(
    (r) => !r.ok && (r.statusCode === 404 || r.statusCode === 410),
  );
  await Promise.all(stale.map((r) => deleteSubscription(r.endpoint)));
  return {
    sent: results.filter((r) => r.ok).length,
    pruned: stale.length,
  };
}

export async function GET(req: Request): Promise<NextResponse> {
  if (!authorized(req)) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }

  const alerts = await readAlerts();
  const now = Date.now();
  const due = alerts.filter((a) => a.deadline <= now);
  if (due.length === 0) {
    return NextResponse.json({ ok: true, checked: alerts.length, fired: 0 });
  }

  let sent = 0;
  let pruned = 0;
  for (const a of due) {
    const res = await fireAll({
      title: `Due: ${a.title}`,
      body:
        a.preset === "tonight"
          ? "Scheduled for tonight."
          : "Your task is due now.",
      url: "/tasks",
      tag: `alert:${a.id}`,
    });
    sent += res.sent;
    pruned += res.pruned;
  }

  const remaining = alerts.filter((a) => a.deadline > now);
  await writeAlerts(remaining);

  return NextResponse.json({
    ok: true,
    checked: alerts.length,
    fired: due.length,
    sent,
    prunedSubscriptions: pruned,
  });
}

export const POST = GET;
