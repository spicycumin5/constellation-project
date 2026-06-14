"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ControlsPanel } from "@/components/ControlsPanel";
import { BookmarksPanel } from "@/components/BookmarksPanel";
import { InfoPanel } from "@/components/InfoPanel";
import { useSkyData } from "@/hooks/useSkyData";
import type { HoverTarget } from "@/types/sky";

const SkyScene = dynamic(() => import("@/components/sky/SkyScene").then((mod) => mod.SkyScene), {
  ssr: false,
});

const DEFAULT_DATE = new Date("2024-01-01T00:00:00.000Z");
const DEFAULT_LATITUDE = 40.7128;
const DEFAULT_LONGITUDE = -74.006;

export default function Home() {
  const { stars, constellations, loading, error } = useSkyData();
  const [date, setDate] = useState(DEFAULT_DATE);
  const [latitude, setLatitude] = useState(DEFAULT_LATITUDE);
  const [longitude, setLongitude] = useState(DEFAULT_LONGITUDE);
  const [showConstellations, setShowConstellations] = useState(true);
  const [hover, setHover] = useState<HoverTarget | null>(null);
  const [lookingDown, setLookingDown] = useState(false);

  // Default to "right now" once mounted, avoiding an SSR/client time mismatch.
  useEffect(() => {
    setDate(new Date());
  }, []);

  return (
    <main className="relative h-screen w-full overflow-hidden bg-black">
      <div className="absolute inset-0">
        {!loading && !error && (
          <SkyScene
            stars={stars}
            constellations={constellations}
            date={date}
            latitude={latitude}
            longitude={longitude}
            showConstellations={showConstellations}
            hover={hover}
            onHover={setHover}
            onLookDownChange={setLookingDown}
          />
        )}
      </div>

      {(loading || error) && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-zinc-400">
          {error ? `Failed to load sky data: ${error}` : "Loading sky data..."}
        </div>
      )}

      <AnimatePresence>
        {lookingDown && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <span className="text-2xl font-light tracking-wide text-zinc-300/80">Look up!</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pointer-events-none absolute inset-0 flex items-start justify-between gap-4 p-4">
        <div className="flex flex-col gap-4">
          <ControlsPanel
            date={date}
            latitude={latitude}
            longitude={longitude}
            showConstellations={showConstellations}
            onDateChange={setDate}
            onLocationChange={(lat, lon) => {
              setLatitude(lat);
              setLongitude(lon);
            }}
            onToggleConstellations={setShowConstellations}
          />
          <BookmarksPanel
            onSelect={(bookmarkDate, lat, lon) => {
              setDate(bookmarkDate);
              setLatitude(lat);
              setLongitude(lon);
            }}
          />
        </div>
        <InfoPanel target={hover} />
      </div>
    </main>
  );
}
