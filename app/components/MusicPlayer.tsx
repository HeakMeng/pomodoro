"use client";

import {
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { AmbientEngine, TRACKS } from "../lib/ambient";

function Equalizer({ active }: { active: boolean }) {
  return (
    <div className="flex h-5 items-end gap-0.5" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className={`w-1 rounded-full ${active ? "eq-bar" : ""}`}
          style={{
            height: "100%",
            background: active ? "var(--accent-text)" : "var(--border-strong)",
            animationDelay: `${i * 0.15}s`,
            transform: active ? undefined : "scaleY(0.4)",
          }}
        />
      ))}
    </div>
  );
}

export function MusicPlayer() {
  const engineRef = useRef<AmbientEngine | null>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);

  // Create the Web Audio engine on the client after mount, and tear it down
  // on unmount. (The AudioContext only resumes on a user gesture via play().)
  useEffect(() => {
    engineRef.current = new AmbientEngine();
    return () => {
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  const track = TRACKS[index];

  const toggle = async () => {
    const engine = engineRef.current;
    if (!engine) return;
    if (playing) {
      engine.pause();
      setPlaying(false);
    } else {
      engine.setTrack(track.id);
      engine.setVolume(volume);
      await engine.play();
      setPlaying(true);
    }
  };

  const change = (dir: 1 | -1) => {
    setIndex((prev) => {
      const next = (prev + dir + TRACKS.length) % TRACKS.length;
      const engine = engineRef.current;
      if (engine && playing) {
        engine.setTrack(TRACKS[next].id);
      }
      return next;
    });
  };

  const onVolume = (v: number) => {
    setVolume(v);
    engineRef.current?.setVolume(v);
  };

  return (
    <div
      className="surface-sunken mt-8 rounded-2xl border p-4"
      style={{ borderColor: "var(--border-soft)" }}
    >
      <div className="flex items-center gap-4">
        <Equalizer active={playing} />

        <div className="min-w-0 flex-1">
          <p className="t-strong truncate text-sm font-semibold">
            {track.title}
          </p>
          <p className="t-faint truncate text-xs">{track.artist}</p>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => change(-1)}
            aria-label="Previous track"
            className="icon-btn flex h-9 w-9 items-center justify-center rounded-full transition-colors"
          >
            <SkipBack className="h-4 w-4" fill="currentColor" />
          </button>
          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? "Pause music" : "Play music"}
            aria-pressed={playing}
            className="btn-primary flex h-11 w-11 items-center justify-center rounded-full transition-transform hover:scale-105 active:scale-95"
          >
            {playing ? (
              <Pause className="h-5 w-5" fill="currentColor" />
            ) : (
              <Play className="ml-0.5 h-5 w-5" fill="currentColor" />
            )}
          </button>
          <button
            type="button"
            onClick={() => change(1)}
            aria-label="Next track"
            className="icon-btn flex h-9 w-9 items-center justify-center rounded-full transition-colors"
          >
            <SkipForward className="h-4 w-4" fill="currentColor" />
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Volume2 className="t-faint h-4 w-4 shrink-0" />
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => onVolume(Number(e.target.value))}
          aria-label="Music volume"
          className="h-1 w-full cursor-pointer appearance-none rounded-full"
          style={{
            background: "var(--border-strong)",
            accentColor: "var(--accent)",
          }}
        />
      </div>
    </div>
  );
}
