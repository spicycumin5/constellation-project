"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { horizontalToCartesian } from "@/lib/astronomy";
import { SKY_RADIUS } from "./constants";

const POOL_SIZE = 2;
const TRAIL_POINTS = 10;
const TRAIL_SPACING = 0.035;
const HEAD_SIZE = 5;

const vertexShader = /* glsl */ `
  attribute float size;
  attribute vec3 color;
  varying vec3 vColor;
  void main() {
    vColor = color;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  void main() {
    vec2 uv = gl_PointCoord - vec2(0.5);
    float dist = length(uv);
    if (dist > 0.5) discard;
    float alpha = smoothstep(0.5, 0.0, dist);
    gl_FragColor = vec4(vColor, alpha);
  }
`;

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

interface MeteorState {
  active: boolean;
  start: THREE.Vector3;
  end: THREE.Vector3;
  startTime: number;
  duration: number;
  nextSpawn: number;
}

// Deterministic initial spawn stagger so creating the pool stays a pure render.
function createMeteor(index: number): MeteorState {
  return {
    active: false,
    start: new THREE.Vector3(),
    end: new THREE.Vector3(),
    startTime: 0,
    duration: 1,
    nextSpawn: 4 + index * 7,
  };
}

function ShootingStar({ meteor }: { meteor: MeteorState }) {
  const pointsRef = useRef<THREE.Points>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(TRAIL_POINTS * 3), 3));
    geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(TRAIL_POINTS * 3), 3));
    geo.setAttribute("size", new THREE.BufferAttribute(new Float32Array(TRAIL_POINTS), 1));
    return geo;
  }, []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  useFrame((state) => {
    const now = state.clock.elapsedTime;

    if (!meteor.active && now >= meteor.nextSpawn) {
      const startAlt = randomBetween(25, 80);
      const startAz = randomBetween(0, 360);
      const travelAz = randomBetween(-60, 60);
      const travelAlt = randomBetween(-45, -10);
      meteor.start.set(...horizontalToCartesian(startAlt, startAz, SKY_RADIUS * 0.99));
      meteor.end.set(...horizontalToCartesian(Math.max(startAlt + travelAlt, -5), startAz + travelAz, SKY_RADIUS * 0.99));
      meteor.startTime = now;
      meteor.duration = randomBetween(0.5, 1.1);
      meteor.active = true;
    }

    const points = pointsRef.current;
    if (!points) return;

    if (!meteor.active) {
      points.visible = false;
      return;
    }

    const t = (now - meteor.startTime) / meteor.duration;
    if (t >= 1) {
      meteor.active = false;
      meteor.nextSpawn = now + randomBetween(5, 16);
      points.visible = false;
      return;
    }

    points.visible = true;
    const envelope = Math.sin(Math.PI * t);

    const positions = geometry.getAttribute("position") as THREE.BufferAttribute;
    const colors = geometry.getAttribute("color") as THREE.BufferAttribute;
    const sizes = geometry.getAttribute("size") as THREE.BufferAttribute;

    for (let j = 0; j < TRAIL_POINTS; j++) {
      const trailT = Math.max(0, t - j * TRAIL_SPACING);
      const pos = meteor.start.clone().lerp(meteor.end, trailT);
      const falloff = 1 - j / TRAIL_POINTS;
      const brightness = envelope * falloff;
      positions.setXYZ(j, pos.x, pos.y, pos.z);
      colors.setXYZ(j, brightness, brightness, brightness);
      sizes.setX(j, HEAD_SIZE * falloff);
    }

    positions.needsUpdate = true;
    colors.needsUpdate = true;
    sizes.needsUpdate = true;
  });

  return <points ref={pointsRef} geometry={geometry} material={material} visible={false} />;
}

/** Occasional meteor streaks for a more immersive sky. */
export function ShootingStars() {
  const meteors = useMemo(() => Array.from({ length: POOL_SIZE }, (_, i) => createMeteor(i)), []);

  return (
    <>
      {meteors.map((meteor, i) => (
        <ShootingStar key={i} meteor={meteor} />
      ))}
    </>
  );
}
