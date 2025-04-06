import React, { memo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { BufferAttribute, BufferGeometry, LineSegments } from "three";
import { useRapier } from "../hooks/hooks";
import { _vector3 } from "../utils/shared-objects";

export const Debug = memo(() => {
  const { world } = useRapier();
  const ref = useRef<LineSegments>(null);

  useFrame(() => {
    const mesh = ref.current;
    if (!mesh) return;

    const buffers = world.debugRender();

    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(buffers.vertices, 3));
    geometry.setAttribute("color", new BufferAttribute(buffers.colors, 4));

    mesh.geometry.dispose();
    mesh.geometry = geometry;
  });

  return (
    <group>
      <lineSegments ref={ref} frustumCulled={false}>
        <lineBasicMaterial color={0xffffff} vertexColors />
        <bufferGeometry />
      </lineSegments>
    </group>
  );
});
