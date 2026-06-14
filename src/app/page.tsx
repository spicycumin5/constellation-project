"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
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

  // Jumping to a Moment fades the sky to black, swaps the date/location
  // underneath, then fades back in, instead of an abrupt jump.
  const [fade, setFade] = useState<"idle" | "out" | "in">("idle");
  const pendingMomentRef = useRef<{ date: Date; latitude: number; longitude: number } | null>(null);

  // Default to "right now" once mounted, avoiding an SSR/client time mismatch.
  useEffect(() => {
    setDate(new Date());
  }, []);

  function handleSelectMoment(momentDate: Date, lat: number, lon: number) {
    if (fade !== "idle") return;
    pendingMomentRef.current = { date: momentDate, latitude: lat, longitude: lon };
    setFade("out");
  }

  function handleFadeComplete() {
    if (fade === "out") {
      const pending = pendingMomentRef.current;
      if (pending) {
        setDate(pending.date);
        setLatitude(pending.latitude);
        setLongitude(pending.longitude);
        pendingMomentRef.current = null;
      }
      setFade("in");
    } else if (fade === "in") {
      setFade("idle");
    }
  }

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

      <motion.div
        aria-hidden
        initial={false}
        animate={{ opacity: fade === "out" ? 1 : 0 }}
        transition={{ duration: 0.45, ease: "easeInOut" }}
        onAnimationComplete={handleFadeComplete}
        className="pointer-events-none absolute inset-0 z-40 bg-black"
      />

      <div className="pointer-events-none absolute inset-0 flex items-stretch justify-between gap-4 p-4">
        <div className="flex h-full min-h-0 flex-col gap-4">
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
            date={date}
            latitude={latitude}
            longitude={longitude}
            onSelect={handleSelectMoment}
          />
        </div>
        <div className="self-start">
          <InfoPanel target={hover} />
        </div>
      </div>
    </main>
  );
}
