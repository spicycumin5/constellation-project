"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import type { PlanetPosition } from "@/types/sky";
import { getPlanetPositions, horizontalToCartesian, makeObserver } from "@/lib/astronomy";
import { SKY_RADIUS } from "./constants";

const PLANET_COLORS: Record<string, string> = {
  Sun: "#fff4cc",
  Moon: "#e8e8e8",
  Mercury: "#b8a89a",
  Venus: "#f5deb3",
  Mars: "#e08060",
  Jupiter: "#e0c896",
  Saturn: "#f0e0b0",
  Uranus: "#a0e0e0",
  Neptune: "#6080f0",
};

const PLANET_SIZES: Record<string, number> = {
  Sun: 1.8,
  Moon: 1.4,
  Mercury: 0.45,
  Venus: 0.65,
  Mars: 0.5,
  Jupiter: 0.7,
  Saturn: 0.6,
  Uranus: 0.4,
  Neptune: 0.4,
};

interface PlanetsProps {
  date: Date;
  latitude: number;
  longitude: number;
  hoveredPlanetName?: string | null;
  onHover?: (planet: PlanetPosition | null) => void;
}

export function Planets({ date, latitude, longitude, hoveredPlanetName, onHover }: PlanetsProps) {
  const planets = useMemo(() => {
    const observer = makeObserver(latitude, longitude, 0);
    return getPlanetPositions(date, observer).filter((p) => p.altitude > 0);
  }, [date, latitude, longitude]);

  return (
    <group>
      {planets.map((planet) => {
        const position = horizontalToCartesian(planet.altitude, planet.azimuth, SKY_RADIUS * 0.99);
        const size = PLANET_SIZES[planet.name] ?? 0.8;
        const color = PLANET_COLORS[planet.name] ?? "#ffffff";

        return (
          <PlanetMesh
            key={planet.name}
            planet={planet}
            position={position}
            size={size}
            color={color}
            isHovered={hoveredPlanetName === planet.name}
            onHover={onHover}
          />
        );
      })}
    </group>
  );
}

interface PlanetMeshProps {
  planet: PlanetPosition;
  position: [number, number, number];
  size: number;
  color: string;
  isHovered: boolean;
  onHover?: (planet: PlanetPosition | null) => void;
}

function PlanetMesh({ planet, position, size, color, isHovered, onHover }: PlanetMeshProps) {
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const material = materialRef.current;
    const mesh = meshRef.current;
    if (!material || !mesh) return;

    if (isHovered) {
      const pulse = 0.5 + 0.5 * Math.sin(state.clock.elapsedTime * 4);
      material.opacity = 0.7 + 0.3 * pulse;
      mesh.scale.setScalar(1 + 0.25 * pulse);
    } else {
      material.opacity = 0.7;
      mesh.scale.setScalar(1);
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerOver={(event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        onHover?.(planet);
      }}
      onPointerOut={(event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        onHover?.(null);
      }}
    >
      <sphereGeometry args={[size, 16, 16]} />
      <meshBasicMaterial ref={materialRef} color={color} transparent opacity={0.7} toneMapped={false} />
    </mesh>
  );
}
