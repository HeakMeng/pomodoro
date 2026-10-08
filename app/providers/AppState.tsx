"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { type Settings } from "../components/SettingsModal";
import { usePersistentState } from "../hooks/usePersistentState";
import { playChime } from "../lib/chime";
import { type DeadlinePreset } from "../lib/deadlines";

export type Mode = "focus" | "short" | "long";

export type Task = {
  id: string;
  title: string;
  estimated: number;
  completed: number;
  done: boolean;
  deadline?: number;
  preset?: DeadlinePreset;
};

export const DEFAULT_SETTINGS: Settings = { focus: 25, short: 5, long: 15 };

export const MODE_LABELS: Record<Mode, string> = {
  focus: "Focus",
  short: "Short Break",
  long: "Long Break",
};

export const MODE_ORDER: Mode[] = ["focus", "short", "long"];

export function formatTime(ms: number): string {
  const total = Math.ceil(Math.max(0, ms) / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

type AppStateValue = {
  // timer
  mode: Mode;
  isRunning: boolean;
  displayMs: number;
  displayTime: string;
  progressPercent: number;
  totalDurationMs: number;
  start: () => void;
  pause: () => void;
  reset: () => void;
  changeMode: (next: Mode) => void;
  toggleStartPause: () => void;

  // settings
  settings: Settings;
  saveSettings: (next: Settings) => void;
  settingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;

  // tasks
  tasks: Task[];
  activeTaskId: string | null;
  setActiveTaskId: (id: string | null) => void;
  addTask: (title: string, estimated: number) => void;
  captureRapidTask: (
    title: string,
    deadline: number,
    preset: DeadlinePreset,
  ) => void;
  toggleDone: (id: string) => void;
  deleteTask: (id: string) => void;
};

const Ctx = createContext<AppStateValue | null>(null);

export function useAppState(): AppStateValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAppState must be used within AppStateProvider");
  return v;
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = usePersistentState<Settings>(
    "pomodoro.settings",
    DEFAULT_SETTINGS,
  );

  const durationsMs = useMemo<Record<Mode, number>>(
    () => ({
      focus: settings.focus * 60 * 1000,
      short: settings.short * 60 * 1000,
      long: settings.long * 60 * 1000,
    }),
    [settings],
  );

  const [mode, setMode] = useState<Mode>("focus");
  const [isRunning, setIsRunning] = useState(false);
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [remainingMs, setRemainingMs] = useState<number>(
    DEFAULT_SETTINGS.focus * 60 * 1000,
  );
  const [, forceTick] = useState(0);

  const [tasks, setTasks] = usePersistentState<Task[]>("pomodoro.tasks", []);
  const [activeTaskIdRaw, setActiveTaskIdRaw] = usePersistentState<
    string | null
  >("pomodoro.activeTaskId", null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const isRunningRef = useRef(isRunning);
  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  useEffect(() => {
    if (isRunningRef.current) return;
    setRemainingMs(durationsMs[mode]);
  }, [durationsMs, mode]);

  useEffect(() => {
    if (!isRunning || endsAt == null) return;
    const id = window.setInterval(() => {
      if (Date.now() >= endsAt) {
        setIsRunning(false);
        setEndsAt(null);
        setRemainingMs(0);
        playChime();
        if (mode === "focus" && activeTaskIdRaw != null) {
          setTasks((prev) =>
            prev.map((t) =>
              t.id === activeTaskIdRaw
                ? { ...t, completed: t.completed + 1 }
                : t,
            ),
          );
        }
      } else {
        forceTick((n) => n + 1);
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [isRunning, endsAt, mode, activeTaskIdRaw, setTasks]);

  const displayMs =
    isRunning && endsAt != null
      ? Math.max(0, endsAt - Date.now())
      : remainingMs;
  const displayTime = formatTime(displayMs);

  useEffect(() => {
    document.title = `${displayTime} - ${MODE_LABELS[mode]}`;
  }, [displayTime, mode]);

  const start = useCallback(() => {
    if (isRunningRef.current) return;
    setRemainingMs((prevRem) => {
      const base = prevRem > 0 ? prevRem : durationsMs[mode];
      setEndsAt(Date.now() + base);
      setIsRunning(true);
      return base;
    });
  }, [mode, durationsMs]);

  const pause = useCallback(() => {
    setIsRunning((wasRunning) => {
      if (!wasRunning) return wasRunning;
      setEndsAt((end) => {
        if (end != null) setRemainingMs(Math.max(0, end - Date.now()));
        return null;
      });
      return false;
    });
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setEndsAt(null);
    setRemainingMs(durationsMs[mode]);
  }, [mode, durationsMs]);

  const changeMode = useCallback(
    (next: Mode) => {
      setIsRunning(false);
      setEndsAt(null);
      setRemainingMs(durationsMs[next]);
      setMode(next);
    },
    [durationsMs],
  );

  const toggleStartPause = useCallback(() => {
    if (isRunningRef.current) pause();
    else start();
  }, [pause, start]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          tag === "SELECT" ||
          target.isContentEditable
        ) {
          return;
        }
      }
      e.preventDefault();
      toggleStartPause();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleStartPause]);

  const addTask = useCallback(
    (title: string, estimated: number) => {
      const trimmed = title.trim();
      if (!trimmed) return;
      const task: Task = {
        id: crypto.randomUUID(),
        title: trimmed,
        estimated: Math.max(1, Math.floor(estimated)),
        completed: 0,
        done: false,
      };
      setTasks((prev) => [...prev, task]);
      setActiveTaskIdRaw((prev) => prev ?? task.id);
    },
    [setTasks, setActiveTaskIdRaw],
  );

  const captureRapidTask = useCallback(
    (title: string, deadline: number, preset: DeadlinePreset) => {
      const trimmed = title.trim();
      if (!trimmed) return;
      const task: Task = {
        id: crypto.randomUUID(),
        title: trimmed,
        estimated: 1,
        completed: 0,
        done: false,
        deadline,
        preset,
      };
      setTasks((prev) => [...prev, task]);
      setActiveTaskIdRaw((prev) => prev ?? task.id);
      void fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: task.id,
          title: task.title,
          deadline: task.deadline,
          preset: task.preset,
        }),
      }).catch(() => {});
    },
    [setTasks, setActiveTaskIdRaw],
  );

  const toggleDone = useCallback(
    (id: string) => {
      setTasks((prev) => {
        const next = prev.map((t) =>
          t.id === id ? { ...t, done: !t.done } : t,
        );
        const target = next.find((t) => t.id === id);
        if (target && target.deadline != null) {
          if (target.done) {
            void fetch(`/api/schedule?id=${encodeURIComponent(id)}`, {
              method: "DELETE",
            }).catch(() => {});
          } else {
            void fetch("/api/schedule", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: target.id,
                title: target.title,
                deadline: target.deadline,
                preset: target.preset,
              }),
            }).catch(() => {});
          }
        }
        return next;
      });
    },
    [setTasks],
  );

  const deleteTask = useCallback(
    (id: string) => {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      setActiveTaskIdRaw((prev) => (prev === id ? null : prev));
      void fetch(`/api/schedule?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      }).catch(() => {});
    },
    [setTasks, setActiveTaskIdRaw],
  );

  const saveSettings = useCallback(
    (next: Settings) => setSettings(next),
    [setSettings],
  );

  const setActiveTaskId = useCallback(
    (id: string | null) => setActiveTaskIdRaw(id),
    [setActiveTaskIdRaw],
  );

  const openSettings = useCallback(() => setSettingsOpen(true), []);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);

  const totalDurationMs = durationsMs[mode];
  const progressPercent =
    totalDurationMs > 0
      ? Math.min(100, Math.max(0, ((totalDurationMs - displayMs) / totalDurationMs) * 100))
      : 0;

  const value: AppStateValue = {
    mode,
    isRunning,
    displayMs,
    displayTime,
    progressPercent,
    totalDurationMs,
    start,
    pause,
    reset,
    changeMode,
    toggleStartPause,
    settings,
    saveSettings,
    settingsOpen,
    openSettings,
    closeSettings,
    tasks,
    activeTaskId: activeTaskIdRaw,
    setActiveTaskId,
    addTask,
    captureRapidTask,
    toggleDone,
    deleteTask,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
