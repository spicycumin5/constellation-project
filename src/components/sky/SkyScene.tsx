"use client";

import { Canvas } from "@react-three/fiber";
import type { ConstellationRecord, HoverTarget, StarRecord } from "@/types/sky";
import { StarField } from "./StarField";
import { ConstellationLines } from "./ConstellationLines";
import { Planets } from "./Planets";
import { LookControls } from "./LookControls";
import { HorizonRing } from "./HorizonRing";
import { CompassLabels } from "./CompassLabels";
import { ShootingStars } from "./ShootingStars";
import { HoverHighlight } from "./HoverHighlight";

interface SkySceneProps {
  stars: StarRecord[];
  constellations: ConstellationRecord[];
  date: Date;
  latitude: number;
  longitude: number;
  showConstellations: boolean;
  hover: HoverTarget | null;
  onHover: (target: HoverTarget | null) => void;
  onLookDownChange?: (lookingDown: boolean) => void;
}

export function SkyScene({
  stars,
  constellations,
  date,
  latitude,
  longitude,
  showConstellations,
  hover,
  onHover,
  onLookDownChange,
}: SkySceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 0], fov: 75, near: 0.1, far: 1000 }}
      raycaster={{ params: { Mesh: {}, LOD: {}, Sprite: {}, Points: { threshold: 6 }, Line: { threshold: 0.5 } } }}
      style={{ width: "100%", height: "100%", background: "#04060f" }}
    >
      <LookControls onLookDownChange={onLookDownChange} />
      <HorizonRing />
      <CompassLabels />
      {showConstellations && (
        <ConstellationLines
          constellations={constellations}
          date={date}
          latitude={latitude}
          longitude={longitude}
          hoveredConstellationId={hover?.kind === "constellation" ? hover.constellation.id : null}
          onHover={onHover}
        />
      )}
      <StarField
        stars={stars}
        date={date}
        latitude={latitude}
        longitude={longitude}
        onHover={(star) => onHover(star ? { kind: "star", star } : null)}
      />
      <Planets
        date={date}
        latitude={latitude}
        longitude={longitude}
        onHover={(planet) => onHover(planet ? { kind: "planet", planet } : null)}
      />
      <ShootingStars />
      <HoverHighlight hover={hover} date={date} latitude={latitude} longitude={longitude} />
    </Canvas>
  );
}
