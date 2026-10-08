"use client";

import { Bell, BellOff } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useState } from "react";

import {
  getPushState,
  pushSupported,
  subscribeToPush,
  unsubscribeFromPush,
  type PushState,
} from "../lib/push";

export type Settings = {
  focus: number;
  short: number;
  long: number;
};

type Props = {
  open: boolean;
  settings: Settings;
  onClose: () => void;
  onSave: (next: Settings) => void;
};

const BOUNDS = { min: 1, max: 180 };

function clamp(n: number): number {
  if (!Number.isFinite(n)) return BOUNDS.min;
  return Math.min(BOUNDS.max, Math.max(BOUNDS.min, Math.floor(n)));
}

export function SettingsModal({ open, settings, onClose, onSave }: Props) {
  const [focus, setFocus] = useState(String(settings.focus));
  const [short, setShort] = useState(String(settings.short));
  const [long, setLong] = useState(String(settings.long));

  const [pushState, setPushState] = useState<PushState>("default");
  const [pushBusy, setPushBusy] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);

  const refreshPushState = useCallback(async () => {
    if (!pushSupported()) {
      setPushState("unsupported");
      return;
    }
    try {
      setPushState(await getPushState());
    } catch {
      // ignore; keep previous state
    }
  }, []);

  useEffect(() => {
    if (open) {
      setFocus(String(settings.focus));
      setShort(String(settings.short));
      setLong(String(settings.long));
      setPushError(null);
      void refreshPushState();
    }
  }, [open, settings, refreshPushState]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave({
      focus: clamp(parseInt(focus, 10)),
      short: clamp(parseInt(short, 10)),
      long: clamp(parseInt(long, 10)),
    });
    onClose();
  };

  const handleEnable = async () => {
    setPushBusy(true);
    setPushError(null);
    try {
      const next = await subscribeToPush();
      setPushState(next);
    } catch (err) {
      setPushError(err instanceof Error ? err.message : "Failed to subscribe");
    } finally {
      setPushBusy(false);
    }
  };

  const handleDisable = async () => {
    setPushBusy(true);
    setPushError(null);
    try {
      await unsubscribeFromPush();
      await refreshPushState();
    } catch (err) {
      setPushError(
        err instanceof Error ? err.message : "Failed to unsubscribe",
      );
    } finally {
      setPushBusy(false);
    }
  };

  const subscribed = pushState === "subscribed";
  const notifLabel = (() => {
    if (pushState === "unsupported")
      return "This browser does not support push notifications.";
    if (pushState === "denied")
      return "Notifications are blocked. Enable them in site settings.";
    if (pushState === "subscribed")
      return "Deadline alerts will be delivered to this device.";
    return "Receive deadline alerts even when the app is closed.";
  })();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <button
        type="button"
        aria-label="Close settings"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl dark:bg-zinc-900"
      >
        <h2
          id="settings-title"
          className="mb-5 text-base font-semibold uppercase tracking-widest text-zinc-900 dark:text-zinc-100"
        >
          Settings
        </h2>

        <p className="mb-3 text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
          Minutes per mode
        </p>

        <div className="mb-6 flex flex-col gap-3">
          <Field label="Focus" value={focus} onChange={setFocus} id="settings-focus" />
          <Field label="Short Break" value={short} onChange={setShort} id="settings-short" />
          <Field label="Long Break" value={long} onChange={setLong} id="settings-long" />
        </div>

        <p className="mb-2 text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
          Notifications
        </p>

        <div className="mb-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/60">
          <p className="mb-3 text-xs text-zinc-600 dark:text-zinc-300">
            {notifLabel}
          </p>
          {pushError && (
            <p className="mb-3 text-xs text-rose-600 dark:text-rose-400">
              {pushError}
            </p>
          )}
          <button
            type="button"
            onClick={subscribed ? handleDisable : handleEnable}
            disabled={
              pushBusy ||
              pushState === "unsupported" ||
              pushState === "denied"
            }
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              subscribed
                ? "border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                : "bg-brand-navy text-white hover:bg-brand-blue dark:bg-ai-cyan dark:text-brand-navy dark:hover:bg-ai-cyan-light"
            }`}
          >
            {subscribed ? (
              <>
                <BellOff className="h-4 w-4" />
                Disable Notifications
              </>
            ) : (
              <>
                <Bell className="h-4 w-4" />
                {pushBusy ? "Working..." : "Enable Notifications"}
              </>
            )}
          </button>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-zinc-300 px-5 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-full bg-brand-navy px-5 py-2 text-sm font-medium text-white hover:bg-brand-blue dark:bg-ai-cyan dark:text-brand-navy dark:hover:bg-ai-cyan-light"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  id,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  id: string;
}) {
  return (
    <label htmlFor={id} className="flex items-center justify-between gap-4">
      <span className="text-sm text-zinc-700 dark:text-zinc-300">{label}</span>
      <input
        id={id}
        type="number"
        min={BOUNDS.min}
        max={BOUNDS.max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-20 rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-right text-sm text-zinc-900 focus:border-brand-blue focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-ai-cyan"
      />
    </label>
  );
}
