"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { bookmarks, type Bookmark } from "@/data/bookmarks";

const STORAGE_KEY = "stellarmark:customMoments";

function formatMomentSummary(date: Date, latitude: number, longitude: number): string {
  const when = date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  return `${latitude.toFixed(2)}, ${longitude.toFixed(2)} — ${when}`;
}

interface BookmarksPanelProps {
  date: Date;
  latitude: number;
  longitude: number;
  onSelect: (date: Date, latitude: number, longitude: number) => void;
}

export function BookmarksPanel({ date, latitude, longitude, onSelect }: BookmarksPanelProps) {
  const [customMoments, setCustomMoments] = useState<Bookmark[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState("");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) setCustomMoments(parsed);
    } catch {
      // ignore malformed storage
    }
  }, []);

  function persist(next: Bookmark[]) {
    setCustomMoments(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function handleAdd() {
    const trimmed = label.trim();
    if (!trimmed) return;

    const moment: Bookmark = {
      id: `custom-${Date.now()}`,
      label: trimmed,
      description: formatMomentSummary(date, latitude, longitude),
      date: date.toISOString(),
      latitude,
      longitude,
    };

    persist([...customMoments, moment]);
    setLabel("");
    setShowForm(false);
  }

  function handleRemove(id: string) {
    persist(customMoments.filter((moment) => moment.id !== id));
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
      className="pointer-events-auto flex w-72 flex-col gap-2 rounded-xl border border-white/10 bg-black/60 p-4 text-sm text-zinc-100 shadow-xl backdrop-blur-md"
    >
      <div>
        <h2 className="text-sm font-semibold tracking-wide">Moments</h2>
        <p className="text-xs text-zinc-400">Jump to a meaningful place and time.</p>
      </div>

      <div className="flex flex-col gap-1.5">
        {[...bookmarks, ...customMoments].map((bookmark) => {
          const isCustom = bookmark.id.startsWith("custom-");
          return (
            <div key={bookmark.id} className="flex items-stretch gap-1.5">
              <button
                type="button"
                onClick={() => onSelect(new Date(bookmark.date), bookmark.latitude, bookmark.longitude)}
                className="flex-1 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-left transition-colors hover:bg-white/10"
              >
                <span className="block text-sm font-medium">{bookmark.label}</span>
                <span className="block text-xs text-zinc-400">{bookmark.description}</span>
              </button>
              {isCustom && (
                <button
                  type="button"
                  onClick={() => handleRemove(bookmark.id)}
                  aria-label={`Remove ${bookmark.label}`}
                  className="rounded-md border border-white/10 bg-white/5 px-2 text-xs text-zinc-400 transition-colors hover:bg-white/10 hover:text-zinc-100"
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}
      </div>

      {showForm ? (
        <div className="flex flex-col gap-2 rounded-md border border-white/10 bg-white/5 p-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-zinc-400">Label</span>
            <input
              autoFocus
              type="text"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleAdd();
                if (event.key === "Escape") setShowForm(false);
              }}
              placeholder="e.g. Graduation night"
              className="rounded-md border border-white/10 bg-black/40 px-2 py-1.5 text-zinc-100 outline-none focus:border-sky-400"
            />
          </label>
          <p className="text-[11px] text-zinc-500">Saves the current date and location.</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAdd}
              disabled={!label.trim()}
              className="flex-1 rounded-md border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-zinc-100 transition-colors hover:bg-white/20 disabled:opacity-40"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:bg-white/10"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="rounded-md border border-dashed border-white/15 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/5"
        >
          + Add current moment
        </button>
      )}
    </motion.div>
  );
}
