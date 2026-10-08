"use client";

import { Coffee, Moon, Target, type LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { MODE_LABELS, MODE_ORDER, type Mode, useAppState } from "../providers/AppState";
import { MusicPlayer } from "./MusicPlayer";

const MODE_ICON: Record<Mode, LucideIcon> = {
  focus: Target,
  short: Coffee,
  long: Moon,
};

type Quote = { text: string; author: string };

const QUOTES: Record<Mode, Quote[]> = {
  focus: [
    { text: "I can do this all day.", author: "Steve Rogers" },
    { text: "Whatever it takes.", author: "The Avengers" },
    { text: "We're in the endgame now.", author: "Doctor Strange" },
    { text: "Part of the journey is the end.", author: "Tony Stark" },
    { text: "Higher, further, faster.", author: "Carol Danvers" },
  ],
  short: [
    { text: "On your left.", author: "Steve Rogers" },
    { text: "We have a Hulk.", author: "Tony Stark" },
    { text: "That's my secret — I'm always angry.", author: "Bruce Banner" },
    { text: "I am Groot.", author: "Groot" },
  ],
  long: [
    { text: "Even the mighty must rest.", author: "Asgardian proverb" },
    { text: "The sun will shine on us again.", author: "Thor" },
    { text: "Rest. You've earned it, soldier.", author: "Nick Fury" },
    { text: "Wakanda forever.", author: "T'Challa" },
  ],
};

// Ring geometry
const RADIUS = 116;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

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

  // Rotate the quote every ~14s. The displayed quote also shifts when the
  // mode changes because each mode has its own pool and starting offset.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 14000);
    return () => window.clearInterval(id);
  }, []);

  const quote = useMemo(() => {
    const pool = QUOTES[mode];
    const offset = MODE_ORDER.indexOf(mode);
    return pool[(tick + offset) % pool.length];
  }, [mode, tick]);

  const dashOffset = CIRCUMFERENCE * (1 - progressPercent / 100);

  return (
    <section
      aria-label="Timer"
      className="panel relative w-full max-w-lg overflow-hidden rounded-4xl px-6 py-10 sm:px-10"
    >
      {/* Cinematic glows */}
      <div
        aria-hidden
        className="animate-hero-pulse pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: "var(--glow-1)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -right-16 h-64 w-64 rounded-full blur-3xl"
        style={{ background: "var(--glow-2)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full blur-3xl"
        style={{ background: "var(--glow-3)" }}
      />

      <div className="relative">
        {/* Mode tabs */}
        <div
          role="tablist"
          aria-label="Timer mode"
          className="surface-sunken mx-auto flex max-w-fit gap-1 rounded-full border p-1"
          style={{ borderColor: "var(--border-soft)" }}
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
                  active ? "tab-active" : "tab-inactive"
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={2} />
                <span>{MODE_LABELS[m]}</span>
              </button>
            );
          })}
        </div>

        {/* Circular progress ring with time in the center */}
        <div className="relative mx-auto mt-8 aspect-square w-full max-w-[18rem]">
          <svg
            viewBox="0 0 260 260"
            className="h-full w-full -rotate-90"
            aria-hidden
          >
            <defs>
              <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: "var(--ring-from)" }} />
                <stop offset="55%" style={{ stopColor: "var(--ring-via)" }} />
                <stop offset="100%" style={{ stopColor: "var(--ring-to)" }} />
              </linearGradient>
            </defs>
            <circle
              cx="130"
              cy="130"
              r={RADIUS}
              fill="none"
              strokeWidth="10"
              style={{ stroke: "var(--ring-track)" }}
            />
            <circle
              cx="130"
              cy="130"
              r={RADIUS}
              fill="none"
              stroke="url(#ringGradient)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              className="transition-[stroke-dashoffset] duration-500 ease-linear"
              style={{ filter: "drop-shadow(0 0 6px var(--ring-glow))" }}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-[11px] font-semibold uppercase tracking-[0.3em]"
              style={{ color: "var(--accent-text)" }}
            >
              {MODE_LABELS[mode]}
            </span>
            <div
              aria-live="polite"
              aria-atomic="true"
              className="mt-1 font-sans text-6xl font-bold leading-none tracking-tight tabular-nums sm:text-7xl"
              style={{ color: "var(--text-strong)" }}
            >
              {displayTime}
            </div>
            <span
              className="mt-2 text-[11px] font-medium uppercase tracking-widest"
              style={{ color: "var(--text-faint)" }}
            >
              {isRunning ? "Mission active" : "Standby"}
            </span>
          </div>
        </div>

        {/* Rotating Avengers quote */}
        <figure className="mx-auto mt-6 max-w-sm text-center">
          <blockquote
            className="text-lg font-medium italic"
            style={{ color: "var(--text-strong)" }}
          >
            &ldquo;{quote.text}&rdquo;
          </blockquote>
          <figcaption
            className="mt-1 text-xs uppercase tracking-widest"
            style={{ color: "var(--accent-text)" }}
          >
            — {quote.author}
          </figcaption>
        </figure>

        {/* Controls */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={start}
            disabled={isRunning}
            className="btn-primary rounded-full px-8 py-3 text-sm font-semibold uppercase tracking-wider transition-transform hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
          >
            Start
          </button>
          <button
            type="button"
            onClick={pause}
            disabled={!isRunning}
            className="btn-ghost rounded-full px-8 py-3 text-sm font-semibold uppercase tracking-wider transition-colors disabled:cursor-not-allowed disabled:opacity-40"
          >
            Pause
          </button>
          <button
            type="button"
            onClick={reset}
            className="btn-ghost rounded-full px-8 py-3 text-sm font-semibold uppercase tracking-wider transition-colors"
          >
            Reset
          </button>
        </div>

        <p className="t-faint mt-5 text-center text-xs">
          Press{" "}
          <kbd
            className="rounded border px-1.5 py-0.5 font-mono text-[11px]"
            style={{
              background: "var(--surface-raised)",
              borderColor: "var(--border-strong)",
              color: "var(--text-muted)",
            }}
          >
            Space
          </kbd>{" "}
          to start / pause
        </p>

        {/* Functional soundtrack player */}
        <MusicPlayer />
      </div>
    </section>
  );
}
