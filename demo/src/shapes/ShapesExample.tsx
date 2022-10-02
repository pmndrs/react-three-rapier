import {
  Dispatch,
  FC,
  memo,
  ReactNode,
  useEffect,
  useRef,
  useState
} from "react";

import { Box, Html, Plane, Sphere, useGLTF } from "@react-three/drei";
import { CylinderCollider, RigidBody, RigidBodyApi } from "@react-three/rapier";
import Plinko from "./Plinko";
import {
  BufferGeometry,
  Material,
  Mesh,
  MeshPhysicalMaterial,
  Vector3
} from "three";
import { useDemo } from "../App";

const colors = ["red", "green", "blue", "yellow", "orange", "purple"];
const randomColor = () => colors[Math.floor(Math.random() * colors.length)];
const useRandomColor = () => {
  const [color] = useState(randomColor());
  return color;
};

const Label = ({ label }: { label: string }) => {
  return (
    <Html>
      <div
        style={{
          position: "absolute",
          background: "#fff",
          border: "2px solid #000",
          padding: 8,
          transform: "translate(100%, -100%)"
        }}
      >
        <span
          style={{
            position: "absolute",
            width: 0,
            height: 40,
            top: "calc(100% - 5px)",
            left: -16,
            borderLeft: "2px solid black",
            transform: "rotate(45deg)"
          }}
        ></span>
        {label}
      </div>
    </Html>
  );
};

const RigidBox = memo(() => {
  const color = useRandomColor();

  const box = useRef<RigidBodyApi>(null);

  useEffect(() => {
    const api = box.current;
    if (api) {
      api.applyTorqueImpulse({ x: 0, y: 0, z: 0.2 });
    }
  }, []);

  return (
    <RigidBody
      colliders="cuboid"
      ref={box}
      position={[-4 + Math.random() * 8, 10, 0]}
    >
      <group scale={1}>
        <Box scale={0.5} receiveShadow castShadow>
          <meshPhysicalMaterial color={color} />
        </Box>
      </group>
    </RigidBody>
  );
});

const RigidCylinder = memo(() => {
  const color = useRandomColor();

  return (
    <RigidBody colliders={false} position={[-4 + Math.random() * 8, 10, 0]}>
      <mesh castShadow receiveShadow scale={1}>
        <cylinderBufferGeometry args={[0.4, 0.4, 0.4, 16]} />
        <meshPhysicalMaterial color={color} />
      </mesh>
      <CylinderCollider args={[0.2, 0.4]} />
    </RigidBody>
  );
});

const RigidBall = memo(() => {
  const color = useRandomColor();

  return (
    <RigidBody
      colliders="ball"
      position={new Vector3(-4 + Math.random() * 8, 10, 0)}
      scale={1}
    >
      <Sphere scale={0.2} castShadow receiveShadow>
        <meshPhysicalMaterial color={color} />
      </Sphere>
    </RigidBody>
  );
});

useGLTF.preload(new URL("objects.glb", import.meta.url).toString());

const HullPear = memo(() => {
  const { nodes } = useGLTF(
    new URL("objects.glb", import.meta.url).toString()
  ) as unknown as {
    nodes: {
      pear: Mesh;
    };
  };

  return (
    <RigidBody colliders="hull" position={[-4 + Math.random() * 8, 10, 0]}>
      <mesh
        scale={0.5}
        castShadow
        receiveShadow
        geometry={nodes.pear.geometry}
        material={nodes.pear.material}
      />
    </RigidBody>
  );
});

const MeshBoat = memo(() => {
  const { nodes } = useGLTF(
    new URL("objects.glb", import.meta.url).toString()
  ) as unknown as {
    nodes: {
      boat: Mesh;
    };
  };

  return (
    <RigidBody colliders="hull" position={[-4 + Math.random() * 8, 10, 0]}>
      <group scale={0.3}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.boat.geometry}
          material={nodes.boat.material}
          rotation={[0, 0, Math.PI / 2]}
        />
      </group>
    </RigidBody>
  );
});

const itemMap: Record<string, FC> = {
  box: RigidBox,
  cylinder: RigidCylinder,
  ball: RigidBall,
  convexHull: HullPear,
  convexMesh: MeshBoat
};

const Thing = ({ item }: { item: string }) => {
  const Thang = itemMap[item];
  return <Thang />;
};

const Scene: FC = () => {
  const [items, setItems] = useState<string[]>([]);
  const { setUI } = useDemo();

  const addItem = (str: string) => {
    setItems((curr) => [...curr, str]);
  };

  useEffect(() => {
    setUI?.(
      <>
        <button onClick={() => addItem("box")}>Box</button>
        <button onClick={() => addItem("cylinder")}>Cylinder</button>
        <button onClick={() => addItem("ball")}>Ball</button>
        <button onClick={() => addItem("convexMesh")}>ConvexHull 1</button>
        <button onClick={() => addItem("convexHull")}>ConvexHull 2</button>
      </>
    );

    return () => setUI!(null);
  }, []);

  return (
    <group scale={1}>
      {items.map((item, i) => (
        <Thing item={item} key={i} />
      ))}

      <Plinko />
    </group>
  );
};

export default Scene;
