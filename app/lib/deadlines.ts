export type DeadlinePreset = "tonight" | "tomorrow" | "nextClass";

export const DEADLINE_PRESET_LABELS: Record<DeadlinePreset, string> = {
  tonight: "Tonight 9:30 PM",
  tomorrow: "Tomorrow 8:00 AM",
  nextClass: "Next Class",
};

export function computeDeadline(preset: DeadlinePreset, from: Date = new Date()): number {
  const d = new Date(from);
  d.setSeconds(0, 0);

  switch (preset) {
    case "tonight": {
      d.setHours(21, 30, 0, 0);
      if (d.getTime() <= from.getTime()) d.setDate(d.getDate() + 1);
      return d.getTime();
    }
    case "tomorrow": {
      d.setDate(d.getDate() + 1);
      d.setHours(8, 0, 0, 0);
      return d.getTime();
    }
    case "nextClass": {
      // Treat "Next Class" as the next weekday at 09:00 local.
      // Skip Saturday / Sunday so Friday rolls forward to Monday.
      d.setDate(d.getDate() + 1);
      while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
      d.setHours(9, 0, 0, 0);
      return d.getTime();
    }
  }
}

export function formatDeadline(ts: number, now: Date = new Date()): string {
  const d = new Date(ts);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);

  const time = d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  if (target.getTime() === today.getTime()) return `Due ${time}`;
  if (target.getTime() === tomorrow.getTime()) return `Due tomorrow ${time}`;
  const day = d.toLocaleDateString(undefined, { weekday: "short" });
  return `Due ${day} ${time}`;
}
