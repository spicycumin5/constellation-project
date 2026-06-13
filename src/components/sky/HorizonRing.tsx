"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { horizontalToCartesian } from "@/lib/astronomy";
import { SKY_RADIUS } from "./constants";

const SEGMENTS = 128;

/** A faint ring marking the horizon (altitude = 0) for orientation. */
export function HorizonRing() {
  const geometry = useMemo(() => {
    const points: number[] = [];
    for (let i = 0; i < SEGMENTS; i++) {
      const azimuth = (i / SEGMENTS) * 360;
      points.push(...horizontalToCartesian(0, azimuth, SKY_RADIUS * 0.997));
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(points), 3));
    return geo;
  }, []);

  return (
    <lineLoop geometry={geometry}>
      <lineBasicMaterial color="#2a4a5a" transparent opacity={0.35} depthWrite={false} />
    </lineLoop>
  );
}
