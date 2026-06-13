"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { HoverTarget } from "@/types/sky";
import { equatorialToHorizontal, horizontalToCartesian, localSiderealTimeDeg } from "@/lib/astronomy";
import { SKY_RADIUS } from "./constants";

function makeRingTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.strokeStyle = "rgba(125, 211, 252, 0.9)";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 6, 0, Math.PI * 2);
    ctx.stroke();
  }
  return new THREE.CanvasTexture(canvas);
}

interface HoverHighlightProps {
  hover: HoverTarget | null;
  date: Date;
  latitude: number;
  longitude: number;
}

/** Pulsing ring drawn around the currently-hovered star or planet. */
export function HoverHighlight({ hover, date, latitude, longitude }: HoverHighlightProps) {
  const spriteRef = useRef<THREE.Sprite>(null);
  const texture = useMemo(() => makeRingTexture(), []);

  const position = useMemo(() => {
    if (!hover) return null;

    if (hover.kind === "star") {
      const lst = localSiderealTimeDeg(date, longitude);
      const { altitude, azimuth } = equatorialToHorizontal(hover.star.ra, hover.star.dec, latitude, lst);
      if (altitude < 0) return null;
      return horizontalToCartesian(altitude, azimuth, SKY_RADIUS * 0.995);
    }

    if (hover.kind === "planet") {
      const { altitude, azimuth } = hover.planet;
      if (altitude < 0) return null;
      return horizontalToCartesian(altitude, azimuth, SKY_RADIUS * 0.995);
    }

    return null;
  }, [hover, date, latitude, longitude]);

  useFrame((state) => {
    const sprite = spriteRef.current;
    if (!sprite) return;
    sprite.scale.setScalar(4 + 0.6 * Math.sin(state.clock.elapsedTime * 4));
  });

  if (!position) return null;

  return (
    <sprite ref={spriteRef} position={position} scale={[4, 4, 1]}>
      <spriteMaterial map={texture} transparent depthWrite={false} />
    </sprite>
  );
}
