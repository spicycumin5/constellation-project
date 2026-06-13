"use client";

import { motion } from "framer-motion";
import { dateToUtcInputValue, utcInputValueToDate } from "@/lib/dateUtc";
import { LocationSearch } from "./LocationSearch";

interface ControlsPanelProps {
  date: Date;
  latitude: number;
  longitude: number;
  showConstellations: boolean;
  onDateChange: (date: Date) => void;
  onLocationChange: (latitude: number, longitude: number) => void;
  onToggleConstellations: (show: boolean) => void;
}

export function ControlsPanel({
  date,
  latitude,
  longitude,
  showConstellations,
  onDateChange,
  onLocationChange,
  onToggleConstellations,
}: ControlsPanelProps) {
  function handleUseNow() {
    onDateChange(new Date());
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        onLocationChange(position.coords.latitude, position.coords.longitude);
      });
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="pointer-events-auto flex w-72 flex-col gap-4 rounded-xl border border-white/10 bg-black/60 p-4 text-sm text-zinc-100 shadow-xl backdrop-blur-md"
    >
      <div>
        <h1 className="text-lg font-semibold tracking-wide">Spaces</h1>
        <p className="text-xs text-zinc-400">See the sky exactly as it was.</p>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-wide text-zinc-400">Date &amp; time (UTC)</span>
        <input
          type="datetime-local"
          value={dateToUtcInputValue(date)}
          onChange={(event) => {
            if (!event.target.value) return;
            onDateChange(utcInputValueToDate(event.target.value));
          }}
          className="rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-zinc-100 outline-none focus:border-sky-400"
        />
      </label>

      <LocationSearch onSelect={(lat, lon) => onLocationChange(lat, lon)} />

      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-zinc-400">Latitude</span>
          <input
            type="number"
            step="0.0001"
            min={-90}
            max={90}
            value={latitude}
            onChange={(event) => onLocationChange(Number(event.target.value), longitude)}
            className="rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-zinc-100 outline-none focus:border-sky-400"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-zinc-400">Longitude</span>
          <input
            type="number"
            step="0.0001"
            min={-180}
            max={180}
            value={longitude}
            onChange={(event) => onLocationChange(latitude, Number(event.target.value))}
            className="rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-zinc-100 outline-none focus:border-sky-400"
          />
        </label>
      </div>

      <label className="flex items-center gap-2 text-xs text-zinc-300">
        <input
          type="checkbox"
          checked={showConstellations}
          onChange={(event) => onToggleConstellations(event.target.checked)}
          className="h-4 w-4 rounded border-white/20 bg-white/5"
        />
        Show constellation lines
      </label>

      <button
        type="button"
        onClick={handleUseNow}
        className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-100 transition-colors hover:bg-white/10"
      >
        Use current moment &amp; location
      </button>

      <p className="text-[11px] leading-relaxed text-zinc-500">
        Drag the sky to look around. Hover a star or planet for details.
      </p>
    </motion.div>
  );
}
