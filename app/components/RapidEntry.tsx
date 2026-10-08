"use client";

import { Zap } from "lucide-react";
import { useRef, useState } from "react";

import {
  DEADLINE_PRESET_LABELS,
  type DeadlinePreset,
  computeDeadline,
} from "../lib/deadlines";

type Props = {
  onCapture: (title: string, deadline: number, preset: DeadlinePreset) => void;
};

export function RapidEntry({ onCapture }: Props) {
  const [title, setTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const capture = (preset: DeadlinePreset) => {
    const trimmed = title.trim();
    if (!trimmed) {
      inputRef.current?.focus();
      return;
    }
    onCapture(trimmed, computeDeadline(preset), preset);
    setTitle("");
    inputRef.current?.focus();
  };

  const presets: DeadlinePreset[] = ["tonight", "tomorrow", "nextClass"];

  return (
    <section
      aria-label="Rapid entry"
      className="rounded-3xl border border-transparent bg-white px-6 py-5 shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none"
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-ai-cyan-light text-brand-navy dark:bg-brand-navy dark:text-ai-cyan">
          <Zap className="h-4 w-4" strokeWidth={2.5} />
        </span>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-800 dark:text-zinc-200">
          Rapid Entry
        </h2>
      </div>

      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Capture an assignment, reading, or project..."
        aria-label="Task title"
        className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-4 text-lg text-zinc-900 placeholder:text-zinc-400 focus:border-brand-blue focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-ai-cyan dark:focus:bg-zinc-900 dark:focus:ring-ai-cyan/20"
      />

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {presets.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => capture(p)}
            className="rounded-full border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-blue hover:text-brand-blue hover:shadow-md dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:shadow-none dark:hover:border-ai-cyan dark:hover:text-ai-cyan"
          >
            {DEADLINE_PRESET_LABELS[p]}
          </button>
        ))}
      </div>
    </section>
  );
}
