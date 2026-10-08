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
      className="panel rounded-3xl px-6 py-5"
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="btn-primary flex h-7 w-7 items-center justify-center rounded-xl">
          <Zap className="h-4 w-4" strokeWidth={2.5} />
        </span>
        <h2 className="t-strong text-sm font-semibold uppercase tracking-widest">
          Rapid Entry
        </h2>
      </div>

      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Capture an assignment, reading, or mission..."
        aria-label="Task title"
        className="field w-full rounded-2xl px-5 py-4 text-lg"
      />

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {presets.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => capture(p)}
            className="pill rounded-full px-4 py-2.5 text-sm font-medium transition-all hover:-translate-y-0.5"
          >
            {DEADLINE_PRESET_LABELS[p]}
          </button>
        ))}
      </div>
    </section>
  );
}
