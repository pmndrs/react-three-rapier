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
import { Collider, ColliderHandle, ShapeType } from "@dimforge/rapier3d-compat";
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
  switch (collider.shapeType()) {
    case ShapeType.Cuboid: {
      const { x, y, z } = collider.halfExtents();
      return new BoxBufferGeometry(x * 2 + 0.01, y * 2 + 0.01, z * 2 + 0.01);

      break;
    }

    case ShapeType.Ball: {
      const r = collider.radius();
      return new SphereBufferGeometry(r + +0.01, 8, 8);

      break;
    }

    case ShapeType.TriMesh: {
      const v = collider.vertices();
      const i = collider.indices();

      const g = new BufferGeometry();
      g.setAttribute("position", new BufferAttribute(v, 3));
      g.index?.set(i);
      g.setDrawRange(0, g.attributes.position.array.length / 3 - 1);

      return g;

      break;
    }

    case ShapeType.ConvexPolyhedron: {
      const cv = collider.vertices();

      const cg = new BufferGeometry();
      cg.setAttribute("position", new BufferAttribute(cv, 3));

      return cg;

      break;
    }

    case ShapeType.Cylinder: {
      const r = collider.radius();
      const h = collider.halfHeight();

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

    world.colliders.forEachCollider((collider) => {
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
