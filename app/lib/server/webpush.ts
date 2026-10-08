import webpush from "web-push";

let configured = false;

function configure(): void {
  if (configured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:you@example.com";
  if (!publicKey || !privateKey) {
    throw new Error(
      "VAPID keys missing. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY.",
    );
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export type PushPayload = {
  title: string;
  body?: string;
  url?: string;
  tag?: string;
};

export type PushTarget = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export type PushResult = {
  endpoint: string;
  ok: boolean;
  statusCode?: number;
  error?: string;
};

export async function sendPush(
  target: PushTarget,
  payload: PushPayload,
): Promise<PushResult> {
  configure();
  try {
    const res = await webpush.sendNotification(
      target,
      JSON.stringify(payload),
    );
    return { endpoint: target.endpoint, ok: true, statusCode: res.statusCode };
  } catch (err) {
    const e = err as { statusCode?: number; body?: string; message?: string };
    return {
      endpoint: target.endpoint,
      ok: false,
      statusCode: e.statusCode,
      error: e.message ?? e.body ?? "unknown",
    };
  }
}
