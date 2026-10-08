import { promises as fs } from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), ".data");

async function ensureDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  await ensureDir();
  const full = path.join(DATA_DIR, file);
  try {
    const raw = await fs.readFile(full, "utf8");
    return JSON.parse(raw) as T;
  } catch (err) {
    const code = (err as NodeJS.ErrnoException | undefined)?.code;
    if (code === "ENOENT") return fallback;
    throw err;
  }
}

async function writeJson<T>(file: string, value: T): Promise<void> {
  await ensureDir();
  const full = path.join(DATA_DIR, file);
  await fs.writeFile(full, JSON.stringify(value, null, 2), "utf8");
}

export type StoredSubscription = {
  endpoint: string;
  expirationTime: number | null;
  keys: { p256dh: string; auth: string };
  createdAt: number;
};

const SUB_FILE = "subscriptions.json";

export async function readSubscriptions(): Promise<StoredSubscription[]> {
  return readJson<StoredSubscription[]>(SUB_FILE, []);
}

export async function saveSubscription(sub: StoredSubscription): Promise<void> {
  const all = await readSubscriptions();
  const filtered = all.filter((s) => s.endpoint !== sub.endpoint);
  filtered.push(sub);
  await writeJson(SUB_FILE, filtered);
}

export async function deleteSubscription(endpoint: string): Promise<void> {
  const all = await readSubscriptions();
  const filtered = all.filter((s) => s.endpoint !== endpoint);
  await writeJson(SUB_FILE, filtered);
}

export type ScheduledAlert = {
  id: string;
  title: string;
  deadline: number;
  preset?: string;
  createdAt: number;
};

const ALERT_FILE = "alerts.json";

export async function readAlerts(): Promise<ScheduledAlert[]> {
  return readJson<ScheduledAlert[]>(ALERT_FILE, []);
}

export async function writeAlerts(alerts: ScheduledAlert[]): Promise<void> {
  await writeJson(ALERT_FILE, alerts);
}

export async function upsertAlert(alert: ScheduledAlert): Promise<void> {
  const all = await readAlerts();
  const filtered = all.filter((a) => a.id !== alert.id);
  filtered.push(alert);
  await writeAlerts(filtered);
}

export async function deleteAlert(id: string): Promise<void> {
  const all = await readAlerts();
  await writeAlerts(all.filter((a) => a.id !== id));
}
