import React, {
  createRef,
  memo,
  RefObject,
  useMemo,
  useRef,
  useState,
} from "react";
import { useFrame } from "@react-three/fiber";
import { useRapier } from "./hooks";
import {
  Ball,
  Collider,
  ColliderHandle,
  ConvexPolyhedron,
  Cuboid,
  Cylinder,
  ShapeType,
  TriMesh,
} from "@dimforge/rapier3d-compat";
import {
  BoxBufferGeometry,
  BufferAttribute,
  BufferGeometry,
  CylinderBufferGeometry,
  Mesh,
  Quaternion,
  SphereBufferGeometry,
} from "three";

const geometryFromCollider = (collider: Collider) => {
  switch (collider.shape.type) {
    case ShapeType.Cuboid: {
      const { x, y, z } = (collider.shape as Cuboid).halfExtents;
      return new BoxBufferGeometry(x * 2 + 0.01, y * 2 + 0.01, z * 2 + 0.01);

      break;
    }

    case ShapeType.Ball: {
      const r = (collider.shape as Ball).radius;
      return new SphereBufferGeometry(r + +0.01, 8, 8);

      break;
    }

    case ShapeType.TriMesh: {
      const v = (collider.shape as TriMesh).vertices;
      const i = (collider.shape as TriMesh).indices;

      const g = new BufferGeometry();
      // Vertices are not always a float3darray (???), so we need to convert them
      const safeVerts = Float32Array.from(v);
      g.setAttribute("position", new BufferAttribute(safeVerts, 3));
      g.index?.set(i);
      g.setDrawRange(0, g.attributes.position.array.length / 3 - 1);

      return g;

      break;
    }

    case ShapeType.ConvexPolyhedron: {
      const cv = (collider.shape as ConvexPolyhedron).vertices;

      // Vertices are not always a float3darray (???), so we need to convert them
      const safeVerts = Float32Array.from(cv);
      const cg = new BufferGeometry();
      cg.setAttribute("position", new BufferAttribute(safeVerts, 3));

      return cg;

      break;
    }

    case ShapeType.Cylinder: {
      const r = (collider.shape as Cylinder).radius;
      const h = (collider.shape as Cylinder).halfHeight;

      const g = new CylinderBufferGeometry(r, r, h);

      return g;

      break;
    }
  }

  return new BoxBufferGeometry(1, 1, 1);
};

const DebugShape = memo<{ colliderHandle: number }>(({ colliderHandle }) => {
  const { world } = useRapier();
  const ref = useRef<Mesh>(null);

  useFrame(() => {
    const collider = world.getCollider(colliderHandle);

    if (ref.current && collider) {
      const { x: rx, y: ry, z: rz, w: rw } = collider.rotation();
      const { x, y, z } = collider.translation();

      ref.current.position.set(x, y, z);
      ref.current.rotation.setFromQuaternion(new Quaternion(rx, ry, rz, rw));
    }
  });

  const geometry = useMemo(() => {
    const collider = world.getCollider(colliderHandle);
    return geometryFromCollider(collider);
  }, [colliderHandle]);

  return (
    <mesh ref={ref}>
      <primitive object={geometry} attach="geometry" />
      <meshBasicMaterial color={"red"} wireframe />
    </mesh>
  );
});

export const Debug = () => {
  const { world } = useRapier();
  const [colliders, setColliders] = useState<number[]>([]);
  const refs = useRef<Record<number, RefObject<Mesh>>>({});

  const dynamicRef = (id: number) => {
    if (!refs.current[id]) {
      refs.current[id] = createRef();
    }
    return refs.current[id];
  };

  useFrame(() => {
    const newColliders: number[] = [];

    world.forEachCollider((collider) => {
      newColliders.push(collider.handle);
    });

    setColliders(newColliders);
  });

  return (
    <group>
      {colliders.map((handle) => (
        <DebugShape key={handle} colliderHandle={handle} />
      ))}
    </group>
  );
};
