"use client";

import { motion } from "framer-motion";
import { bookmarks } from "@/data/bookmarks";

interface BookmarksPanelProps {
  onSelect: (date: Date, latitude: number, longitude: number) => void;
}

export function BookmarksPanel({ onSelect }: BookmarksPanelProps) {
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
        {bookmarks.map((bookmark) => (
          <button
            key={bookmark.id}
            type="button"
            onClick={() => onSelect(new Date(bookmark.date), bookmark.latitude, bookmark.longitude)}
            className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-left transition-colors hover:bg-white/10"
          >
            <span className="block text-sm font-medium">{bookmark.label}</span>
            <span className="block text-xs text-zinc-400">{bookmark.description}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
