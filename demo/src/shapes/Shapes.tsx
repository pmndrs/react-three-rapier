import React from "react";
import { Dispatch, FC, memo, ReactNode, useEffect, useState } from "react";

import { Box, Html, Plane, Sphere, useGLTF } from "@react-three/drei";
import {
  useBall,
  useConvexHull,
  useCuboid,
  useCylinder,
} from "@react-three/rapier";
import Plinko from "./Plinko";
import { Mesh } from "three";

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
          transform: "translate(100%, -100%)",
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
            transform: "rotate(45deg)",
          }}
        ></span>
        {label}
      </div>
    </Html>
  );
};

const RigidBox = memo(() => {
  const color = useRandomColor();
  const [box, rigidBody] = useCuboid(
    {
      position: [-4 + Math.random() * 8, 10, 0],
    },
    {
      args: [0.5, 0.5, 0.5],
    }
  );

  useEffect(() => {
    rigidBody.applyImpulse({ x: 0, y: 0, z: 0 }, true);
    rigidBody.applyTorqueImpulse({ x: 0, y: 0, z: Math.random() * 0.1 }, true);
  }, []);

  return (
    <group scale={1}>
      <Box scale={0.5} ref={box} receiveShadow castShadow>
        <meshPhysicalMaterial color={color} />
      </Box>
    </group>
  );
});

const RigidCylinder = memo(() => {
  const color = useRandomColor();
  const [cylinder, api] = useCylinder<Mesh>(
    {
      position: [-4 + Math.random() * 8, 10, 0],
    },
    {
      args: [0.2, 0.4],
    }
  );

  return (
    <mesh ref={cylinder} castShadow receiveShadow>
      <cylinderBufferGeometry args={[0.4, 0.4, 0.4, 16]} />
      <meshPhysicalMaterial color={color} />
    </mesh>
  );
});

const RigidBall = memo(() => {
  const color = useRandomColor();
  const [ball] = useBall(
    {
      position: [-4 + Math.random() * 8, 10, 0],
    },
    {
      args: [0.2],
    }
  );

  return (
    <Sphere scale={0.2} ref={ball} castShadow receiveShadow>
      <meshPhysicalMaterial color={color} />
    </Sphere>
  );
});

useGLTF.preload(new URL("objects.glb", import.meta.url).toString());

const HullPear = () => {
  const { nodes } = (useGLTF(
    new URL("objects.glb", import.meta.url).toString()
  ) as unknown) as {
    nodes: {
      pear: Mesh;
    };
  };

  const [g] = useState(() => {
    let g = nodes.pear.geometry.clone();
    g.scale(0.5, 0.5, 0.5);

    return g;
  });

  const [pear] = useConvexHull<Mesh>(
    {
      position: [-4 + Math.random() * 8, 10, 0],
    },
    {
      args: [g.attributes.position.array],
    }
  );

  return (
    <mesh
      castShadow
      receiveShadow
      ref={pear}
      geometry={g}
      material={nodes.pear.material}
    />
  );
};

const MeshBoat = () => {
  const { nodes } = (useGLTF(
    new URL("objects.glb", import.meta.url).toString()
  ) as unknown) as {
    nodes: {
      boat: Mesh;
    };
  };

  const [g] = useState(() => {
    let g = nodes.boat.geometry.clone();
    g.scale(0.3, 0.3, 0.3);

    return g;
  });

  const [boat] = useConvexHull<Mesh>(
    {
      position: [-4 + Math.random() * 8, 10, 0],
    },
    {
      args: [g.attributes.position.array],
    }
  );

  return (
    <group scale={1}>
      <mesh
        scale={1}
        castShadow
        receiveShadow
        ref={boat}
        geometry={g}
        material={nodes.boat.material}
        rotation={[0, 0, Math.PI / 2]}
      />
    </group>
  );
};

const itemMap: Record<string, FC> = {
  box: RigidBox,
  cylinder: RigidCylinder,
  ball: RigidBall,
  convexHull: HullPear,
  convexMesh: MeshBoat,
};

const Thing = ({ item }: { item: string }) => {
  const Thang = itemMap[item];
  return <Thang />;
};

const Scene: FC<{ setUI: Dispatch<ReactNode> }> = ({ setUI }) => {
  const [items, setItems] = useState<string[]>([]);

  const addItem = (str: string) => {
    setItems((curr) => [...curr, str]);
  };

  useEffect(() => {
    setUI(
      <>
        <button onClick={() => addItem("box")}>Box</button>
        <button onClick={() => addItem("cylinder")}>Cylinder</button>
        <button onClick={() => addItem("ball")}>Ball</button>
        <button onClick={() => addItem("convexMesh")}>ConvexHull 1</button>
        <button onClick={() => addItem("convexHull")}>ConvexHull 2</button>
      </>
    );
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
