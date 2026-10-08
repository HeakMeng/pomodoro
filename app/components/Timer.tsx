"use client";

import { Coffee, Moon, Target, type LucideIcon } from "lucide-react";

import { MODE_LABELS, MODE_ORDER, type Mode, useAppState } from "../providers/AppState";

const MODE_ICON: Record<Mode, LucideIcon> = {
  focus: Target,
  short: Coffee,
  long: Moon,
};

export function Timer() {
  const {
    mode,
    isRunning,
    displayTime,
    progressPercent,
    start,
    pause,
    reset,
    changeMode,
  } = useAppState();

  return (
    <section
      aria-label="Timer"
      className="relative overflow-hidden rounded-3xl border border-transparent bg-white px-6 py-10 shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none"
    >
      <div
        role="tablist"
        aria-label="Timer mode"
        className="mx-auto flex max-w-fit gap-1 rounded-full bg-zinc-100 p-1 dark:bg-zinc-800/60"
      >
        {MODE_ORDER.map((m) => {
          const active = m === mode;
          const Icon = MODE_ICON[m];
          return (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => changeMode(m)}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-brand-blue text-white shadow-sm"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              <Icon className="h-4 w-4" strokeWidth={2} />
              <span>{MODE_LABELS[m]}</span>
            </button>
          );
        })}
      </div>

      <div
        aria-live="polite"
        aria-atomic="true"
        className="mt-10 text-center font-sans text-[7.5rem] font-bold leading-none tracking-tight tabular-nums text-zinc-900 sm:text-[9rem] dark:text-zinc-50"
      >
        {displayTime}
      </div>

      <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-blue to-ai-cyan transition-[width] duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={start}
          disabled={isRunning}
          className="rounded-full bg-brand-navy px-8 py-3 text-sm font-semibold uppercase tracking-wider text-white shadow-md transition-colors hover:bg-brand-blue disabled:cursor-not-allowed disabled:opacity-40 dark:bg-ai-cyan dark:text-brand-navy dark:shadow-none dark:hover:bg-ai-cyan-light"
        >
          Start
        </button>
        <button
          type="button"
          onClick={pause}
          disabled={!isRunning}
          className="rounded-full border border-zinc-200 bg-white px-8 py-3 text-sm font-semibold uppercase tracking-wider text-zinc-800 transition-colors hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
        >
          Pause
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-full border border-zinc-200 bg-white px-8 py-3 text-sm font-semibold uppercase tracking-wider text-zinc-800 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
        >
          Reset
        </button>
      </div>

      <p className="mt-5 text-center text-xs text-zinc-500 dark:text-zinc-500">
        Press{" "}
        <kbd className="rounded border border-zinc-300 bg-zinc-50 px-1.5 py-0.5 font-mono text-[11px] dark:border-zinc-700 dark:bg-zinc-800">
          Space
        </kbd>{" "}
        to start / pause
      </p>
    </section>
  );
}
