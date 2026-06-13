"use client";

import { useEffect, useState } from "react";
import type { ConstellationRecord, StarRecord } from "@/types/sky";

interface SkyData {
  stars: StarRecord[];
  constellations: ConstellationRecord[];
  loading: boolean;
  error: string | null;
}

/** Loads the static star and constellation catalogs from /public/data. */
export function useSkyData(): SkyData {
  const [stars, setStars] = useState<StarRecord[]>([]);
  const [constellations, setConstellations] = useState<ConstellationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetch("/data/stars.json").then((res) => res.json() as Promise<StarRecord[]>),
      fetch("/data/constellations.json").then((res) => res.json() as Promise<ConstellationRecord[]>),
    ])
      .then(([starData, constellationData]) => {
        if (cancelled) return;
        setStars(starData);
        setConstellations(constellationData);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { stars, constellations, loading, error };
}
