"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import type { PerspectiveCamera } from "three";
import type { ConstellationRecord, HoverTarget } from "@/types/sky";
import { equatorialToHorizontal, horizontalToCartesian, localSiderealTimeDeg } from "@/lib/astronomy";
import { SKY_RADIUS } from "./constants";

// Base line hover hit-radius (world units) at the default field of view,
// scaled with zoom so lines stay just as easy to hover when zoomed out.
const DEFAULT_FOV = 75;
const BASE_LINE_THRESHOLD = 1.2;

interface ConstellationLinesProps {
  constellations: ConstellationRecord[];
  date: Date;
  latitude: number;
  longitude: number;
  hoveredConstellationId?: string | null;
  onHover?: (target: HoverTarget | null) => void;
}

function buildSegments(
  constellations: ConstellationRecord[],
  date: Date,
  latitude: number,
  longitude: number,
  radiusScale: number,
) {
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

        points.push(...horizontalToCartesian(h1.altitude, h1.azimuth, SKY_RADIUS * radiusScale));
        points.push(...horizontalToCartesian(h2.altitude, h2.azimuth, SKY_RADIUS * radiusScale));
      }
    }
  }

  return points;
}

export function ConstellationLines({
  constellations,
  date,
  latitude,
  longitude,
  hoveredConstellationId,
  onHover,
}: ConstellationLinesProps) {
  const { geometry, segmentConstellations } = useMemo(() => {
    const lst = localSiderealTimeDeg(date, longitude);
    const points: number[] = [];
    const segmentConstellations: ConstellationRecord[] = [];

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
          segmentConstellations.push(constellation);
        }
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(points), 3));
    return { geometry: geo, segmentConstellations };
  }, [constellations, date, latitude, longitude]);

  const highlightMaterialRef = useRef<THREE.LineBasicMaterial>(null);

  useFrame((state) => {
    const material = highlightMaterialRef.current;
    if (material) {
      const pulse = 0.5 + 0.5 * Math.sin(state.clock.elapsedTime * 4);
      material.opacity = 0.5 + 0.5 * pulse;
    }

    const lineParams = state.raycaster.params.Line;
    if (lineParams) {
      const fov = (state.camera as PerspectiveCamera).fov ?? DEFAULT_FOV;
      lineParams.threshold = BASE_LINE_THRESHOLD * (fov / DEFAULT_FOV);
    }
  });

  const highlightGeometry = useMemo(() => {
    if (!hoveredConstellationId) return null;
    const constellation = constellations.find((c) => c.id === hoveredConstellationId);
    if (!constellation) return null;

    const points = buildSegments([constellation], date, latitude, longitude, 0.997);
    if (points.length === 0) return null;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(points), 3));
    return geo;
  }, [hoveredConstellationId, constellations, date, latitude, longitude]);

  function handlePointerMove(event: ThreeEvent<PointerEvent>) {
    const index = event.index;
    if (index === undefined) return;

    const segment = Math.floor(index / 2);
    const constellation = segmentConstellations[segment];
    if (!constellation) return;

    event.stopPropagation();
    onHover?.({ kind: "constellation", constellation });
  }

  function handlePointerOut(event: ThreeEvent<PointerEvent>) {
    event.stopPropagation();
    onHover?.(null);
  }

  return (
    <>
      <lineSegments geometry={geometry} onPointerMove={handlePointerMove} onPointerOut={handlePointerOut}>
        <lineBasicMaterial color="#4f7cff" transparent opacity={0.25} depthWrite={false} />
      </lineSegments>
      {highlightGeometry && (
        <lineSegments geometry={highlightGeometry}>
          <lineBasicMaterial ref={highlightMaterialRef} color="#9ecbff" transparent opacity={0.9} depthWrite={false} />
        </lineSegments>
      )}
    </>
  );
}
