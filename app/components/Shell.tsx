"use client";

import {
  ListTodo,
  Moon,
  Settings as SettingsIcon,
  Sun,
  Target,
  Timer as TimerIcon,
  type LucideIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { useAppState } from "../providers/AppState";
import { SettingsModal } from "./SettingsModal";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Timer", icon: TimerIcon },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
];

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-brand-blue dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-ai-cyan"
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}

function Brand() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-navy text-ai-cyan-light shadow-sm">
        <Target className="h-5 w-5" strokeWidth={2.25} />
      </span>
      <span className="text-sm font-semibold uppercase tracking-widest">
        Pomodoro
      </span>
    </Link>
  );
}

function Sidebar({ pathname }: { pathname: string }) {
  const { openSettings } = useAppState();
  return (
    <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:z-30 md:flex md:w-60 md:flex-col md:border-r md:border-zinc-100 md:bg-white md:px-5 md:py-6 dark:md:border-zinc-800 dark:md:bg-zinc-950">
      <Brand />

      <nav className="mt-10 flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-ai-cyan-light text-brand-navy dark:bg-brand-navy dark:text-ai-cyan"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex items-center gap-1 border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <ThemeToggle />
        <button
          type="button"
          onClick={openSettings}
          aria-label="Open settings"
          className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-brand-blue dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-ai-cyan"
        >
          <SettingsIcon className="h-5 w-5" />
        </button>
      </div>
    </aside>
  );
}

function MobileTopBar() {
  const { openSettings } = useAppState();
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-zinc-100 bg-white px-4 py-3 md:hidden dark:border-zinc-800 dark:bg-zinc-950">
      <Brand />
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <button
          type="button"
          onClick={openSettings}
          aria-label="Open settings"
          className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-brand-blue dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-ai-cyan"
        >
          <SettingsIcon className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}

function MobileTabBar({ pathname }: { pathname: string }) {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-20 flex border-t border-zinc-100 bg-white pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 md:hidden dark:border-zinc-800 dark:bg-zinc-950"
    >
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex flex-1 flex-col items-center gap-0.5 py-1 text-[11px] font-medium transition-colors ${
              active
                ? "text-brand-blue dark:text-ai-cyan"
                : "text-zinc-500 dark:text-zinc-400"
            }`}
          >
            <Icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  const { settings, settingsOpen, closeSettings, saveSettings } = useAppState();

  return (
    <>
      <Sidebar pathname={pathname} />
      <div className="flex min-h-screen flex-1 flex-col md:pl-60">
        <MobileTopBar />
        <main className="flex-1 px-4 pb-24 pt-6 sm:px-6 md:pb-10 md:pt-10">
          <div className="mx-auto w-full max-w-2xl">{children}</div>
        </main>
      </div>
      <MobileTabBar pathname={pathname} />

      <SettingsModal
        open={settingsOpen}
        settings={settings}
        onClose={closeSettings}
        onSave={saveSettings}
      />
    </>
  );
}
