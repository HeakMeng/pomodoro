import { NextResponse } from "next/server";

import {
  deleteAlert,
  upsertAlert,
  type ScheduledAlert,
} from "../../lib/server/store";

type ScheduleBody = {
  id: unknown;
  title: unknown;
  deadline: unknown;
  preset?: unknown;
};

export async function POST(req: Request): Promise<NextResponse> {
  const body = (await req.json().catch(() => null)) as ScheduleBody | null;
  if (
    !body ||
    typeof body.id !== "string" ||
    typeof body.title !== "string" ||
    typeof body.deadline !== "number" ||
    !Number.isFinite(body.deadline)
  ) {
    return NextResponse.json(
      { ok: false, error: "Expected { id, title, deadline, preset? }." },
      { status: 400 },
    );
  }
  const alert: ScheduledAlert = {
    id: body.id,
    title: body.title,
    deadline: body.deadline,
    preset: typeof body.preset === "string" ? body.preset : undefined,
    createdAt: Date.now(),
  };
  await upsertAlert(alert);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request): Promise<NextResponse> {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { ok: false, error: "id query parameter required" },
      { status: 400 },
    );
  }
  await deleteAlert(id);
  return NextResponse.json({ ok: true });
}
