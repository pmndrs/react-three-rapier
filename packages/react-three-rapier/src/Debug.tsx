import React, {
  createRef,
  FC,
  memo,
  RefObject,
  useMemo,
  useRef,
  useState
} from "react";
import { useFrame } from "@react-three/fiber";
import { useRapier } from "./hooks";
import {
  Ball,
  Collider,
  ColliderHandle,
  Cone,
  ConvexPolyhedron,
  Cuboid,
  Cylinder,
  Heightfield,
  RoundCuboid,
  ShapeType,
  TriMesh
} from "@dimforge/rapier3d-compat";
import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CapsuleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Quaternion,
  SphereGeometry
} from "three";
import { RoundedBoxGeometry } from "three-stdlib";

const geometryFromCollider = (collider: Collider) => {
  switch (collider.shape.type) {
    case ShapeType.Cuboid: {
      const { x, y, z } = (collider.shape as Cuboid).halfExtents;
      return new BoxGeometry(x * 2 + 0.01, y * 2 + 0.01, z * 2 + 0.01);

      break;
    }

    case ShapeType.RoundCuboid: {
      const { x, y, z } = (collider.shape as RoundCuboid).halfExtents;
      const radius = (collider.shape as RoundCuboid).borderRadius;
      return new RoundedBoxGeometry(
        x * 2 + radius * 2,
        y * 2 + radius * 2,
        z * 2 + radius * 2,
        8,
        radius
      );

      break;
    }

    case ShapeType.Ball: {
      const r = (collider.shape as Ball).radius;
      return new SphereGeometry(r + +0.01, 8, 8);

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

      const g = new CylinderGeometry(r, r, h * 2);

      return g;

      break;
    }

    case ShapeType.Capsule: {
      const r = (collider.shape as Cylinder).radius;
      const h = (collider.shape as Cylinder).halfHeight;

      const g = new CapsuleGeometry(r, h * 2, 4, 8);

      return g;

      break;
    }

    case ShapeType.Cone: {
      const r = (collider.shape as Cone).radius;
      const h = (collider.shape as Cone).halfHeight;

      const g = new ConeGeometry(r, h * 2, 16);

      return g;

      break;
    }

    case ShapeType.HeightField: {
      const rows = (collider.shape as Heightfield).nrows;
      const cols = (collider.shape as Heightfield).ncols;
      const heights = (collider.shape as Heightfield).heights;
      const scale = (collider.shape as Heightfield).scale;

      const g = new PlaneGeometry(scale.x, scale.z, cols, rows);

      const verts = g.attributes.position.array as number[];
      verts.forEach(
        (v, index) => (verts[index * 3 + 2] = heights[index] * scale.y)
      );

      g.scale(1, -1, 1);
      g.rotateX(-Math.PI / 2);
      g.rotateY(-Math.PI / 2);

      return g;

      break;
    }
  }

  return new BoxGeometry(1, 1, 1);
};

interface DebugShapeProps extends DebugProps {
  colliderHandle: number;
}

const DebugShape = memo<DebugShapeProps>(
  ({ colliderHandle, color, sleepColor }) => {
    const { world } = useRapier();
    const ref = useRef<Mesh>(null);

    const [material] = useState(
      new MeshBasicMaterial({
        color,
        wireframe: true
      })
    );

    useFrame(() => {
      const collider = world.getCollider(colliderHandle);

      if (ref.current && collider) {
        const { x: rx, y: ry, z: rz, w: rw } = collider.rotation();
        const { x, y, z } = collider.translation();

        const parent = collider.parent();

        if (
          parent?.isSleeping() ||
          parent?.isFixed() ||
          parent?.isKinematic()
        ) {
          material.color = new Color(sleepColor);
        } else {
          material.color = new Color(color);
        }

        ref.current.position.set(x, y, z);
        ref.current.rotation.setFromQuaternion(new Quaternion(rx, ry, rz, rw));
      }
    });

    const geometry = useMemo(() => {
      const collider = world.getCollider(colliderHandle);
      return geometryFromCollider(collider!);
    }, [colliderHandle]);

    return (
      <mesh ref={ref} material={material}>
        <primitive object={geometry} attach="geometry" />
      </mesh>
    );
  }
);

interface DebugProps {
  /**
   * The color of the wireframe representing an active collider that is affected by forces and not sleeping.
   */
  color?: string;
  /**
   * The color of the wireframe representing a static (fixed or kinematic) or sleeping collider.
   */
  sleepColor?: string;
}
export const Debug: FC<DebugProps> = ({
  color = "red",
  sleepColor = "blue"
}) => {
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
        <DebugShape
          key={handle}
          colliderHandle={handle}
          color={color}
          sleepColor={sleepColor}
        />
      ))}
    </group>
  );
};
