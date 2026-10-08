"use client";

import {
  BookOpen,
  Check,
  Code2,
  Dumbbell,
  Lightbulb,
  ListTodo,
  Palette,
  Plus,
  Target,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { type FormEvent, useState } from "react";

import { useAppState } from "../providers/AppState";
import { formatDeadline } from "../lib/deadlines";
import { RapidEntry } from "./RapidEntry";

const TASK_ICONS: LucideIcon[] = [
  Target,
  BookOpen,
  Code2,
  Dumbbell,
  Palette,
  Lightbulb,
  ListTodo,
];

function taskIconFor(id: string): LucideIcon {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return TASK_ICONS[Math.abs(hash) % TASK_ICONS.length];
}

export function TaskManager() {
  const {
    tasks,
    activeTaskId,
    setActiveTaskId,
    addTask,
    captureRapidTask,
    toggleDone,
    deleteTask,
  } = useAppState();

  const [newTitle, setNewTitle] = useState("");
  const [newEstimated, setNewEstimated] = useState("1");

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(newEstimated, 10);
    const estimated = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
    addTask(newTitle, estimated);
    setNewTitle("");
    setNewEstimated("1");
  };

  return (
    <div className="flex flex-col gap-6">
      <RapidEntry onCapture={captureRapidTask} />

      <section
        aria-label="Tasks"
        className="rounded-3xl border border-transparent bg-white px-6 py-6 shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold uppercase tracking-widest text-zinc-800 dark:text-zinc-200">
            Tasks
          </h2>
          {tasks.length > 0 && (
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {tasks.filter((t) => t.done).length} / {tasks.length} done
            </span>
          )}
        </div>

        <form onSubmit={handleAdd} className="mb-5 flex gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="What are you working on?"
            className="flex-1 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-ai-cyan dark:focus:ring-ai-cyan/20"
          />
          <input
            type="number"
            min={1}
            value={newEstimated}
            onChange={(e) => setNewEstimated(e.target.value)}
            aria-label="Estimated pomodoros"
            className="w-16 rounded-full border border-zinc-200 bg-white px-3 py-2 text-center text-sm text-zinc-900 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-ai-cyan dark:focus:ring-ai-cyan/20"
          />
          <button
            type="submit"
            aria-label="Add task"
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-navy text-white shadow-sm transition-colors hover:bg-brand-blue dark:bg-ai-cyan dark:text-brand-navy dark:hover:bg-ai-cyan-light"
          >
            <Plus className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </form>

        {tasks.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center text-sm text-zinc-500 dark:text-zinc-500">
            <ListTodo className="h-8 w-8 opacity-40" strokeWidth={1.5} />
            <p>No tasks yet. Add one above to get started.</p>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {tasks.map((t) => {
              const Icon = taskIconFor(t.id);
              const isActive = t.id === activeTaskId;
              const ratio = t.estimated > 0 ? t.completed / t.estimated : 0;
              return (
                <li key={t.id} className="relative">
                  <button
                    type="button"
                    onClick={() => setActiveTaskId(t.id)}
                    aria-pressed={isActive}
                    className={`group flex h-full w-full flex-col items-center gap-2 rounded-2xl border p-4 pt-5 text-center transition-all ${
                      isActive
                        ? "border-brand-blue bg-ai-cyan-light shadow-sm dark:border-ai-cyan dark:bg-brand-navy/40 dark:shadow-none"
                        : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        isActive
                          ? "bg-brand-blue text-white dark:bg-ai-cyan dark:text-brand-navy"
                          : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                      }`}
                    >
                      <Icon className="h-5 w-5" strokeWidth={2} />
                    </span>
                    <span
                      className={`line-clamp-2 text-sm font-medium ${
                        t.done
                          ? "text-zinc-400 line-through dark:text-zinc-600"
                          : "text-zinc-900 dark:text-zinc-100"
                      }`}
                    >
                      {t.title}
                    </span>
                    {t.deadline != null && (
                      <span
                        className={`text-[11px] font-medium ${
                          isActive
                            ? "text-brand-blue dark:text-ai-cyan"
                            : "text-zinc-500 dark:text-zinc-400"
                        }`}
                      >
                        {formatDeadline(t.deadline)}
                      </span>
                    )}
                    <span className="mt-auto flex items-center gap-1 font-mono text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
                      {t.completed} / {t.estimated}
                    </span>
                    <span
                      aria-hidden="true"
                      className="h-1 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
                    >
                      <span
                        className={`block h-full rounded-full transition-[width] duration-300 ${
                          isActive
                            ? "bg-brand-blue dark:bg-ai-cyan"
                            : "bg-zinc-300 dark:bg-zinc-700"
                        }`}
                        style={{
                          width: `${Math.min(100, Math.max(0, ratio * 100))}%`,
                        }}
                      />
                    </span>
                  </button>

                  <div className="absolute right-1.5 top-1.5 flex gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 hover:opacity-100">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleDone(t.id);
                      }}
                      aria-label={
                        t.done ? "Mark as not done" : "Mark as done"
                      }
                      aria-pressed={t.done}
                      className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors ${
                        t.done
                          ? "bg-brand-blue text-white dark:bg-ai-cyan dark:text-brand-navy"
                          : "bg-white text-zinc-500 hover:text-brand-blue dark:bg-zinc-800 dark:text-zinc-400 dark:hover:text-ai-cyan"
                      }`}
                    >
                      <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTask(t.id);
                      }}
                      aria-label="Delete task"
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-zinc-500 transition-colors hover:text-rose-500 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:text-rose-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
