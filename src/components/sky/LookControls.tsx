"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";

const LOOK_SPEED = 0.0035;
const MAX_PITCH = Math.PI / 2 - 0.01;
// Within ~20 degrees of straight down counts as "looking down".
const LOOK_DOWN_THRESHOLD = -(Math.PI / 2 - 0.35);

interface LookControlsProps {
  onLookDownChange?: (lookingDown: boolean) => void;
}

/** Drag-to-look controls for viewing the sky from a fixed point at the origin. */
export function LookControls({ onLookDownChange }: LookControlsProps) {
  const { camera, gl } = useThree();
  const yaw = useRef(0);
  const pitch = useRef(0);
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const lookingDown = useRef(false);

  useEffect(() => {
    const dom = gl.domElement;

    function onPointerDown(event: PointerEvent) {
      dragging.current = true;
      last.current = { x: event.clientX, y: event.clientY };
    }

    function onPointerUp() {
      dragging.current = false;
    }

    function onPointerMove(event: PointerEvent) {
      if (!dragging.current) return;
      const dx = event.clientX - last.current.x;
      const dy = event.clientY - last.current.y;
      last.current = { x: event.clientX, y: event.clientY };
      yaw.current -= dx * LOOK_SPEED;
      pitch.current = Math.min(MAX_PITCH, Math.max(-MAX_PITCH, pitch.current + dy * LOOK_SPEED));
    }

    dom.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointermove", onPointerMove);

    return () => {
      dom.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, [gl]);

  useFrame(() => {
    camera.rotation.order = "YXZ";
    camera.rotation.y = yaw.current;
    camera.rotation.x = pitch.current;
    camera.rotation.z = 0;

    const isLookingDown = pitch.current < LOOK_DOWN_THRESHOLD;
    if (isLookingDown !== lookingDown.current) {
      lookingDown.current = isLookingDown;
      onLookDownChange?.(isLookingDown);
    }
  });

  return null;
}
