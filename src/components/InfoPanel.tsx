"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { HoverTarget, StarRecord } from "@/types/sky";

function starDisplayName(star: StarRecord): string {
  if (star.name) return star.name;
  if (star.bayer && star.con) return `${star.bayer} ${star.con}`;
  if (star.flam && star.con) return `${star.flam} ${star.con}`;
  return `HYG ${star.id}`;
}

interface InfoPanelProps {
  target: HoverTarget | null;
}

export function InfoPanel({ target }: InfoPanelProps) {
  return (
    <AnimatePresence>
      {target && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.2 }}
          className="pointer-events-none w-64 rounded-xl border border-white/10 bg-black/60 p-4 text-sm text-zinc-100 shadow-xl backdrop-blur-md"
        >
          {target.kind === "star" ? (
            <>
              <h2 className="text-base font-semibold">{starDisplayName(target.star)}</h2>
              {target.star.con && <p className="text-xs text-zinc-400">Constellation: {target.star.con}</p>}
              <dl className="mt-2 grid grid-cols-2 gap-1 text-xs text-zinc-300">
                <dt className="text-zinc-500">Magnitude</dt>
                <dd>{target.star.mag.toFixed(2)}</dd>
                {target.star.dist !== null && (
                  <>
                    <dt className="text-zinc-500">Distance</dt>
                    <dd>{target.star.dist.toFixed(1)} pc</dd>
                  </>
                )}
                {target.star.spect && (
                  <>
                    <dt className="text-zinc-500">Spectral type</dt>
                    <dd>{target.star.spect}</dd>
                  </>
                )}
              </dl>
            </>
          ) : (
            <>
              <h2 className="text-base font-semibold">{target.planet.name}</h2>
              <dl className="mt-2 grid grid-cols-2 gap-1 text-xs text-zinc-300">
                <dt className="text-zinc-500">Magnitude</dt>
                <dd>{target.planet.magnitude.toFixed(2)}</dd>
                <dt className="text-zinc-500">Altitude</dt>
                <dd>{target.planet.altitude.toFixed(1)}°</dd>
                <dt className="text-zinc-500">Azimuth</dt>
                <dd>{target.planet.azimuth.toFixed(1)}°</dd>
              </dl>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
