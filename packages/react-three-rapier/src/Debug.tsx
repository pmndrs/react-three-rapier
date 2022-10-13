import React from "react";
import { useFrame } from "@react-three/fiber";
import { FC, useRef } from "react";
import { BufferAttribute, LineSegments } from "three";
import { useRapier } from "./hooks";

interface DebugProps {}

export const Debug: FC<DebugProps> = () => {
  const { world } = useRapier();
  const ref = useRef<LineSegments>(null);

  useFrame(() => {
    const mesh = ref.current;
    if (!mesh) return;

    const buffers = world.debugRender();

    mesh.geometry.setAttribute(
      "position",
      new BufferAttribute(buffers.vertices, 3)
    );
    mesh.geometry.setAttribute("color", new BufferAttribute(buffers.colors, 4));
  });

  return (
    <lineSegments ref={ref}>
      <lineBasicMaterial color={0xffffff} vertexColors />
      <bufferGeometry />
    </lineSegments>
  );
};
