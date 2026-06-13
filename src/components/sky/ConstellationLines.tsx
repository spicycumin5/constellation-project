"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { ConstellationRecord } from "@/types/sky";
import { equatorialToHorizontal, horizontalToCartesian, localSiderealTimeDeg } from "@/lib/astronomy";
import { SKY_RADIUS } from "./constants";

interface ConstellationLinesProps {
  constellations: ConstellationRecord[];
  date: Date;
  latitude: number;
  longitude: number;
}

export function ConstellationLines({ constellations, date, latitude, longitude }: ConstellationLinesProps) {
  const geometry = useMemo(() => {
    const lst = localSiderealTimeDeg(date, longitude);
    const points: number[] = [];

    for (const constellation of constellations) {
      for (const line of constellation.lines) {
        for (let i = 0; i < line.length - 1; i++) {
          const [ra1, dec1] = line[i];
          const [ra2, dec2] = line[i + 1];
          const h1 = equatorialToHorizontal(ra1, dec1, latitude, lst);
          const h2 = equatorialToHorizontal(ra2, dec2, latitude, lst);
          if (h1.altitude < 0 && h2.altitude < 0) continue;

          points.push(...horizontalToCartesian(h1.altitude, h1.azimuth, SKY_RADIUS * 0.998));
          points.push(...horizontalToCartesian(h2.altitude, h2.azimuth, SKY_RADIUS * 0.998));
        }
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(points), 3));
    return geo;
  }, [constellations, date, latitude, longitude]);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#4f7cff" transparent opacity={0.25} depthWrite={false} />
    </lineSegments>
  );
}
