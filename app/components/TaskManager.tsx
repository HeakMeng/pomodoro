"use client";

import {
  BookOpen,
  Check,
  Code2,
  Dumbbell,
  Lightbulb,
  ListTodo,
  Palette,
  Target,
  Trash2,
  type LucideIcon,
} from "lucide-react";

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
    captureRapidTask,
    toggleDone,
    deleteTask,
  } = useAppState();

  return (
    <div className="flex w-full max-w-lg flex-col gap-6">
      <RapidEntry onCapture={captureRapidTask} />

      <section
        aria-label="Tasks"
        className="panel rounded-3xl px-6 py-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="t-strong text-base font-semibold uppercase tracking-widest">
            Tasks
          </h2>
          {tasks.length > 0 && (
            <span className="t-faint text-xs font-medium">
              {tasks.filter((t) => t.done).length} / {tasks.length} done
            </span>
          )}
        </div>

        {tasks.length === 0 ? (
          <div className="t-faint flex flex-col items-center gap-3 py-10 text-center text-sm">
            <ListTodo className="h-8 w-8 opacity-40" strokeWidth={1.5} />
            <p>No missions yet. Add one from Rapid Entry above.</p>
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
                    className={`group flex h-full w-full flex-col items-center gap-2 rounded-2xl p-4 pt-5 text-center transition-all ${
                      isActive ? "task-tile-active" : "task-tile"
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        isActive ? "btn-primary" : ""
                      }`}
                      style={
                        isActive
                          ? undefined
                          : {
                              background: "var(--surface-raised)",
                              color: "var(--text-muted)",
                            }
                      }
                    >
                      <Icon className="h-5 w-5" strokeWidth={2} />
                    </span>
                    <span
                      className={`line-clamp-2 text-sm font-medium ${
                        t.done ? "t-faint line-through" : "t-strong"
                      }`}
                    >
                      {t.title}
                    </span>
                    {t.deadline != null && (
                      <span
                        className={`text-[11px] font-medium ${
                          isActive ? "t-accent" : "t-faint"
                        }`}
                      >
                        {formatDeadline(t.deadline)}
                      </span>
                    )}
                    <span className="t-faint mt-auto flex items-center gap-1 font-mono text-xs tabular-nums">
                      {t.completed} / {t.estimated}
                    </span>
                    <span
                      aria-hidden="true"
                      className="h-1 w-full overflow-hidden rounded-full"
                      style={{ background: "var(--border-soft)" }}
                    >
                      <span
                        className="block h-full rounded-full transition-[width] duration-300"
                        style={{
                          width: `${Math.min(100, Math.max(0, ratio * 100))}%`,
                          backgroundImage: isActive
                            ? "linear-gradient(to right, var(--accent-from), var(--accent-to))"
                            : undefined,
                          background: isActive
                            ? undefined
                            : "var(--text-faint)",
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
                      aria-label={t.done ? "Mark as not done" : "Mark as done"}
                      aria-pressed={t.done}
                      className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors ${
                        t.done ? "btn-primary" : "mini-btn"
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
                      className="mini-btn mini-btn-danger flex h-6 w-6 items-center justify-center rounded-full transition-colors"
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
