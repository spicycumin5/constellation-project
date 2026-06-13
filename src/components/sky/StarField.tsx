"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import type { StarRecord } from "@/types/sky";
import { equatorialToHorizontal, horizontalToCartesian, localSiderealTimeDeg } from "@/lib/astronomy";
import { magnitudeToOpacity, magnitudeToSize, starColor } from "@/lib/starAppearance";
import { SKY_RADIUS } from "./constants";

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

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
  });

  const sizes = geometry.getAttribute("size") as THREE.BufferAttribute;

  function handlePointerMove(event: ThreeEvent<PointerEvent>) {
    event.stopPropagation();
    const index = event.index;
    if (index === undefined || sizes.getX(index) <= 0) {
      onHover?.(null);
      return;
    }
    onHover?.(stars[index]);
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
