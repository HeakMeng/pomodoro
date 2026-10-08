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
      // Re-sync the form fields to the latest settings each time the modal
      // opens. Intentional prop->state sync, hence the scoped rule disable.
      /* eslint-disable react-hooks/set-state-in-effect */
      setFocus(String(settings.focus));
      setShort(String(settings.short));
      setLong(String(settings.long));
      setPushError(null);
      /* eslint-enable react-hooks/set-state-in-effect */
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
        className="panel relative w-full max-w-sm rounded-3xl p-6"
      >
        <h2
          id="settings-title"
          className="t-strong mb-5 text-base font-semibold uppercase tracking-widest"
        >
          Settings
        </h2>

        <p className="t-faint mb-3 text-xs uppercase tracking-widest">
          Minutes per mode
        </p>

        <div className="mb-6 flex flex-col gap-3">
          <Field label="Focus" value={focus} onChange={setFocus} id="settings-focus" />
          <Field label="Short Break" value={short} onChange={setShort} id="settings-short" />
          <Field label="Long Break" value={long} onChange={setLong} id="settings-long" />
        </div>

        <p className="t-faint mb-2 text-xs uppercase tracking-widest">
          Notifications
        </p>

        <div
          className="surface-sunken mb-6 rounded-2xl border p-4"
          style={{ borderColor: "var(--border-soft)" }}
        >
          <p className="t-muted mb-3 text-xs">
            {notifLabel}
          </p>
          {pushError && (
            <p className="mb-3 text-xs text-rose-400">
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
              subscribed ? "btn-ghost" : "btn-primary"
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
            className="btn-ghost rounded-full px-5 py-2 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary rounded-full px-5 py-2 text-sm font-medium"
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
      <span className="t-muted text-sm">{label}</span>
      <input
        id={id}
        type="number"
        min={BOUNDS.min}
        max={BOUNDS.max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="field w-20 rounded-full px-3 py-1.5 text-right text-sm"
      />
    </label>
  );
}
