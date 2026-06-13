"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import type { PerspectiveCamera } from "three";
import type { StarRecord } from "@/types/sky";
import { equatorialToHorizontal, horizontalToCartesian, localSiderealTimeDeg } from "@/lib/astronomy";
import { magnitudeToOpacity, magnitudeToSize, starColor } from "@/lib/starAppearance";
import { SKY_RADIUS } from "./constants";

// The raycaster threshold (world units) casts a generous "net" of candidate
// stars near the cursor, scaled with zoom so the net stays the same size on
// screen. From that net we then pick whichever star's projected screen
// position is actually nearest the cursor, within MAX_HOVER_PX pixels.
const DEFAULT_FOV = 75;
const BASE_POINT_THRESHOLD = 6;
const MAX_HOVER_PX = 24;

const vertexShader = /* glsl */ `
  attribute float size;
  attribute vec3 color;
  attribute float twinkle;
  uniform float uTime;
  varying vec3 vColor;
  varying float vTwinkle;
  void main() {
    float flicker = 0.7 + 0.3 * sin(uTime * twinkle * 3.0 + twinkle * 1000.0);
    vColor = color;
    vTwinkle = flicker;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (0.85 + 0.15 * flicker);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vTwinkle;
  void main() {
    vec2 uv = gl_PointCoord - vec2(0.5);
    float dist = length(uv);
    if (dist > 0.5) discard;
    float alpha = smoothstep(0.5, 0.0, dist);
    gl_FragColor = vec4(vColor * vTwinkle, alpha);
  }
`;

interface StarFieldProps {
  stars: StarRecord[];
  date: Date;
  latitude: number;
  longitude: number;
  onHover?: (star: StarRecord | null) => void;
}

export function StarField({ stars, date, latitude, longitude, onHover }: StarFieldProps) {
  // Stable per-star twinkle seed, independent of date/location so the
  // flicker pattern doesn't reset when the view recomputes. Derived
  // deterministically from the star's index for a pure render.
  const twinkleSeeds = useMemo(() => {
    const seeds = new Float32Array(stars.length);
    for (let i = 0; i < stars.length; i++) {
      const x = Math.sin(i * 12.9898) * 43758.5453;
      seeds[i] = 0.5 + (x - Math.floor(x));
    }
    return seeds;
  }, [stars]);

  const geometry = useMemo(() => {
    const lst = localSiderealTimeDeg(date, longitude);
    const positions = new Float32Array(stars.length * 3);
    const colors = new Float32Array(stars.length * 3);
    const sizes = new Float32Array(stars.length);

    for (let i = 0; i < stars.length; i++) {
      const star = stars[i];
      const { altitude, azimuth } = equatorialToHorizontal(star.ra, star.dec, latitude, lst);
      const [x, y, z] = horizontalToCartesian(altitude, azimuth, SKY_RADIUS);
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      const belowHorizon = altitude < 0;
      const opacity = belowHorizon ? 0 : magnitudeToOpacity(star.mag);
      const [r, g, b] = starColor(star.ci);
      colors[i * 3] = r * opacity;
      colors[i * 3 + 1] = g * opacity;
      colors[i * 3 + 2] = b * opacity;
      sizes[i] = belowHorizon ? 0 : magnitudeToSize(star.mag);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute("twinkle", new THREE.BufferAttribute(twinkleSeeds, 1));
    return geo;
  }, [stars, date, latitude, longitude, twinkleSeeds]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: { uTime: { value: 0 } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  const { camera, size } = useThree();

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;

    const pointsParams = state.raycaster.params.Points;
    if (pointsParams) {
      const fov = (state.camera as PerspectiveCamera).fov ?? DEFAULT_FOV;
      pointsParams.threshold = BASE_POINT_THRESHOLD * (fov / DEFAULT_FOV);
    }
  });

  const sizes = geometry.getAttribute("size") as THREE.BufferAttribute;
  const positions = geometry.getAttribute("position") as THREE.BufferAttribute;
  const projected = useMemo(() => new THREE.Vector3(), []);

  function handlePointerMove(event: ThreeEvent<PointerEvent>) {
    event.stopPropagation();

    const pointerX = event.nativeEvent.offsetX;
    const pointerY = event.nativeEvent.offsetY;

    let bestIndex = -1;
    let bestDistSq = (MAX_HOVER_PX * MAX_HOVER_PX);

    for (const intersection of event.intersections) {
      if (intersection.object !== event.object || intersection.index === undefined) continue;
      const index = intersection.index;
      if (sizes.getX(index) <= 0) continue;

      projected.set(positions.getX(index), positions.getY(index), positions.getZ(index));
      projected.project(camera);

      const screenX = (projected.x * 0.5 + 0.5) * size.width;
      const screenY = (1 - (projected.y * 0.5 + 0.5)) * size.height;

      const dx = screenX - pointerX;
      const dy = screenY - pointerY;
      const distSq = dx * dx + dy * dy;

      if (distSq < bestDistSq) {
        bestDistSq = distSq;
        bestIndex = index;
      }
    }

    if (bestIndex === -1) {
      onHover?.(null);
      return;
    }
    onHover?.(stars[bestIndex]);
  }

  function handlePointerOut() {
    onHover?.(null);
  }

  return (
    <points
      geometry={geometry}
      material={material}
      onPointerMove={handlePointerMove}
      onPointerOut={handlePointerOut}
    />
  );
}
