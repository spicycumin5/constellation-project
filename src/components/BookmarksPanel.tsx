"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { bookmarks, type Bookmark } from "@/data/bookmarks";

const STORAGE_KEY = "stellarmark:moments";
const LEGACY_CUSTOM_KEY = "stellarmark:customMoments";

function formatMomentSummary(date: Date, latitude: number, longitude: number): string {
  const when = date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  return `${latitude.toFixed(2)}, ${longitude.toFixed(2)} — ${when}`;
}

/** Formats a Date as a `datetime-local` input value in the browser's local time. */
function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

interface BookmarksPanelProps {
  date: Date;
  latitude: number;
  longitude: number;
  onSelect: (date: Date, latitude: number, longitude: number) => void;
}

export function BookmarksPanel({ date, latitude, longitude, onSelect }: BookmarksPanelProps) {
  const [moments, setMoments] = useState<Bookmark[]>(bookmarks);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [momentDateTime, setMomentDateTime] = useState("");
  const [momentLatitude, setMomentLatitude] = useState("");
  const [momentLongitude, setMomentLongitude] = useState("");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setMoments(parsed);
          return;
        }
      } catch {
        // ignore malformed storage, fall through to migration/defaults
      }
    }

    // Migrate from the older "custom moments on top of built-ins" scheme so
    // existing saved moments aren't lost.
    let legacyCustom: Bookmark[] = [];
    const legacyStored = window.localStorage.getItem(LEGACY_CUSTOM_KEY);
    if (legacyStored) {
      try {
        const parsed = JSON.parse(legacyStored);
        if (Array.isArray(parsed)) legacyCustom = parsed;
      } catch {
        // ignore malformed storage
      }
    }

    const seeded = [...bookmarks, ...legacyCustom];
    setMoments(seeded);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  }, []);

  function persist(next: Bookmark[]) {
    setMoments(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function resetForm() {
    setShowForm(false);
    setEditingId(null);
    setLabel("");
  }

  function openAddForm() {
    setEditingId(null);
    setLabel("");
    setMomentDateTime(toDatetimeLocalValue(date));
    setMomentLatitude(latitude.toFixed(4));
    setMomentLongitude(longitude.toFixed(4));
    setShowForm(true);
  }

  function openEditForm(moment: Bookmark) {
    setEditingId(moment.id);
    setLabel(moment.label);
    setMomentDateTime(toDatetimeLocalValue(new Date(moment.date)));
    setMomentLatitude(String(moment.latitude));
    setMomentLongitude(String(moment.longitude));
    setShowForm(true);
  }

  function handleSave() {
    const trimmed = label.trim();
    if (!trimmed || !momentDateTime) return;

    const parsedDate = new Date(momentDateTime);
    const parsedLatitude = Number(momentLatitude);
    const parsedLongitude = Number(momentLongitude);
    if (
      Number.isNaN(parsedDate.getTime()) ||
      Number.isNaN(parsedLatitude) ||
      Number.isNaN(parsedLongitude)
    ) {
      return;
    }

    const updated: Bookmark = {
      id: editingId ?? `custom-${Date.now()}`,
      label: trimmed,
      description: formatMomentSummary(parsedDate, parsedLatitude, parsedLongitude),
      date: parsedDate.toISOString(),
      latitude: parsedLatitude,
      longitude: parsedLongitude,
    };

    if (editingId) {
      persist(moments.map((moment) => (moment.id === editingId ? updated : moment)));
    } else {
      persist([...moments, updated]);
    }

    resetForm();
  }

  function handleRemove(id: string) {
    if (editingId === id) resetForm();
    persist(moments.filter((moment) => moment.id !== id));
  }

  const isValid =
    label.trim().length > 0 &&
    momentDateTime.length > 0 &&
    !Number.isNaN(Number(momentLatitude)) &&
    momentLatitude.trim().length > 0 &&
    !Number.isNaN(Number(momentLongitude)) &&
    momentLongitude.trim().length > 0;

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
        {moments.map((moment) => (
          <div key={moment.id} className="flex items-stretch gap-1.5">
            <button
              type="button"
              onClick={() => onSelect(new Date(moment.date), moment.latitude, moment.longitude)}
              className="flex-1 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-left transition-colors hover:bg-white/10"
            >
              <span className="block text-sm font-medium">{moment.label}</span>
              <span className="block text-xs text-zinc-400">{moment.description}</span>
            </button>
            <button
              type="button"
              onClick={() => openEditForm(moment)}
              aria-label={`Edit ${moment.label}`}
              className="rounded-md border border-white/10 bg-white/5 px-2 text-xs text-zinc-400 transition-colors hover:bg-white/10 hover:text-zinc-100"
            >
              ✎
            </button>
            <button
              type="button"
              onClick={() => handleRemove(moment.id)}
              aria-label={`Remove ${moment.label}`}
              className="rounded-md border border-white/10 bg-white/5 px-2 text-xs text-zinc-400 transition-colors hover:bg-white/10 hover:text-zinc-100"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {showForm ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleSave();
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") resetForm();
          }}
          className="flex flex-col gap-2 rounded-md border border-white/10 bg-white/5 p-2"
        >
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-300">
            {editingId ? "Edit moment" : "Add moment"}
          </span>
          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-zinc-400">Detail name</span>
            <input
              autoFocus
              type="text"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="e.g. Graduation night"
              className="rounded-md border border-white/10 bg-black/40 px-2 py-1.5 text-zinc-100 outline-none focus:border-sky-400"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-zinc-400">Date &amp; time</span>
            <input
              type="datetime-local"
              value={momentDateTime}
              onChange={(event) => setMomentDateTime(event.target.value)}
              className="rounded-md border border-white/10 bg-black/40 px-2 py-1.5 text-zinc-100 outline-none focus:border-sky-400"
            />
          </label>
          <div className="flex gap-2">
            <label className="flex flex-1 flex-col gap-1">
              <span className="text-xs uppercase tracking-wide text-zinc-400">Latitude</span>
              <input
                type="number"
                step="any"
                min={-90}
                max={90}
                value={momentLatitude}
                onChange={(event) => setMomentLatitude(event.target.value)}
                placeholder="e.g. 34.05"
                className="rounded-md border border-white/10 bg-black/40 px-2 py-1.5 text-zinc-100 outline-none focus:border-sky-400"
              />
            </label>
            <label className="flex flex-1 flex-col gap-1">
              <span className="text-xs uppercase tracking-wide text-zinc-400">Longitude</span>
              <input
                type="number"
                step="any"
                min={-180}
                max={180}
                value={momentLongitude}
                onChange={(event) => setMomentLongitude(event.target.value)}
                placeholder="e.g. -118.24"
                className="rounded-md border border-white/10 bg-black/40 px-2 py-1.5 text-zinc-100 outline-none focus:border-sky-400"
              />
            </label>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!isValid}
              className="flex-1 rounded-md border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-zinc-100 transition-colors hover:bg-white/20 disabled:opacity-40"
            >
              Save
            </button>
            <button type="button" onClick={resetForm} className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:bg-white/10">
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={openAddForm}
          className="rounded-md border border-dashed border-white/15 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/5"
        >
          + Add moment
        </button>
      )}
    </motion.div>
  );
}
