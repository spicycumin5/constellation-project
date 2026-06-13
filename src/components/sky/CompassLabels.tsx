"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { horizontalToCartesian } from "@/lib/astronomy";
import { SKY_RADIUS } from "./constants";

const DIRECTIONS: { label: string; azimuth: number }[] = [
  { label: "N", azimuth: 0 },
  { label: "E", azimuth: 90 },
  { label: "S", azimuth: 180 },
  { label: "W", azimuth: 270 },
];

function makeLabelTexture(text: string): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.font = "bold 80px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, size / 2, size / 2 + 6);
  }
  return new THREE.CanvasTexture(canvas);
}

/** Renders N/E/S/W labels just above the horizon for orientation. */
export function CompassLabels() {
  const labels = useMemo(
    () =>
      DIRECTIONS.map(({ label, azimuth }) => ({
        label,
        position: horizontalToCartesian(2, azimuth, SKY_RADIUS * 0.98),
        texture: makeLabelTexture(label),
      })),
    []
  );

  return (
    <>
      {labels.map(({ label, position, texture }) => (
        <sprite key={label} position={position} scale={[6, 6, 1]}>
          <spriteMaterial map={texture} transparent depthWrite={false} />
        </sprite>
      ))}
    </>
  );
}
