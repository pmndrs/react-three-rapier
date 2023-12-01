// import React, { FC, memo, useEffect, useRef, useState } from "react";

// import { Box, Html, Sphere, useGLTF } from "@react-three/drei";
// import {
//   CylinderCollider,
//   RigidBody,
//   RapierRigidBody,
//   useRapier
// } from "@react-three/rapier";
// import {
//   World
// } from "@dimforge/rapier3d-compat";
// import Plinko from "../plinko/Plinko";
// import { Mesh, Vector3 } from "three";
// import { useControls, button } from "leva";

// const colors = ["red", "green", "blue", "yellow", "orange", "purple"];
// const randomColor = () => colors[Math.floor(Math.random() * colors.length)];
// const useRandomColor = () => {
//   const [color] = useState(randomColor());
//   return color;
// };

// const Label = ({ label }: { label: string }) => {
//   return (
//     <Html>
//       <div
//         style={{
//           position: "absolute",
//           background: "#fff",
//           border: "2px solid #000",
//           padding: 8,
//           transform: "translate(100%, -100%)"
//         }}
//       >
//         <span
//           style={{
//             position: "absolute",
//             width: 0,
//             height: 40,
//             top: "calc(100% - 5px)",
//             left: -16,
//             borderLeft: "2px solid black",
//             transform: "rotate(45deg)"
//           }}
//         ></span>
//         {label}
//       </div>
//     </Html>
//   );
// };

// const RigidBox = memo(() => {
//   const color = useRandomColor();

//   const box = useRef<RapierRigidBody>(null);

//   useEffect(() => {
//     const api = box.current;
//     if (api) {
//       api.applyTorqueImpulse({ x: 0, y: 0, z: 0.2 }, true);
//     }
//   }, []);

//   return (
//     <RigidBody
//       colliders="cuboid"
//       ref={box}
//       position={[-4 + Math.random() * 8, 10, 0]}
//     >
//       <group scale={1}>
//         <Box scale={0.5} receiveShadow castShadow>
//           <meshPhysicalMaterial color={color} />
//         </Box>
//       </group>
//     </RigidBody>
//   );
// });

// const RigidCylinder = memo(() => {
//   const color = useRandomColor();

//   return (
//     <RigidBody colliders={false} position={[-4 + Math.random() * 8, 10, 0]}>
//       <mesh castShadow receiveShadow scale={1}>
//         <cylinderGeometry args={[0.4, 0.4, 0.4, 16]} />
//         <meshPhysicalMaterial color={color} />
//       </mesh>
//       <CylinderCollider args={[0.2, 0.4]} />
//     </RigidBody>
//   );
// });

// const RigidBall = memo(() => {
//   const color = useRandomColor();

//   return (
//     <RigidBody
//       colliders="ball"
//       position={new Vector3(-4 + Math.random() * 8, 10, 0)}
//       scale={1}
//     >
//       <Sphere scale={0.2} castShadow receiveShadow>
//         <meshPhysicalMaterial color={color} />
//       </Sphere>
//     </RigidBody>
//   );
// });

// useGLTF.preload(
//   new URL("../../models/objects.glb", import.meta.url).toString()
// );

// const HullPear = memo(() => {
//   const { nodes } = useGLTF(
//     new URL("../../models/objects.glb", import.meta.url).toString()
//   ) as unknown as {
//     nodes: {
//       pear: Mesh;
//     };
//   };

//   return (
//     <RigidBody colliders="hull" position={[-4 + Math.random() * 8, 10, 0]}>
//       <mesh
//         scale={0.5}
//         castShadow
//         receiveShadow
//         geometry={nodes.pear.geometry}
//         material={nodes.pear.material}
//       />
//     </RigidBody>
//   );
// });

// const MeshBoat = memo(() => {
//   const { nodes } = useGLTF(
//     new URL("../../models/objects.glb", import.meta.url).toString()
//   ) as unknown as {
//     nodes: {
//       boat: Mesh;
//     };
//   };

//   return (
//     <RigidBody colliders="hull" position={[-4 + Math.random() * 8, 10, 0]}>
//       <group scale={0.3}>
//         <mesh
//           castShadow
//           receiveShadow
//           geometry={nodes.boat.geometry}
//           material={nodes.boat.material}
//           rotation={[0, 0, Math.PI / 2]}
//         />
//       </group>
//     </RigidBody>
//   );
// });

// const itemMap: Record<string, FC> = {
//   box: RigidBox,
//   cylinder: RigidCylinder,
//   ball: RigidBall,
//   convexHull: HullPear,
//   convexMesh: MeshBoat
// };

// const Thing = ({ item }: { item: string }) => {
//   const Thang = itemMap[item];
//   return <Thang />;
// };

// const Scene: FC = () => {
//   const [items, setItems] = useState<string[]>([]);

//   const { world, setWorld } = useRapier()

//   const worldSnapShotRef = useRef<Uint8Array>()

//   useControls({
//     box: button(() => addItem("box")),
//     cylinder: button(() => addItem("cylinder")),
//     ball: button(() => addItem("ball")),
//     convexHull: button(() => addItem("convexHull")),
//     convexMesh: button(() => addItem("convexMesh")),
//     takeSnapshot: button(() => worldSnapShotRef.current = world.takeSnapshot()),
//     reStoreSnapshot: button(() => !!worldSnapShotRef.current && setWorld(World.restoreSnapshot(worldSnapShotRef.current))),
//   });

//   const addItem = (str: string) => {
//     setItems((curr) => [...curr, str]);
//   };

//   return (
//     <group scale={1}>
//       {items.map((item, i) => (
//         <Thing item={item} key={i} />
//       ))}

//       <Plinko />
//     </group>
//   );
// };

// export default Scene;

import { Box, Sphere, useTexture } from "@react-three/drei";
import {
  CylinderCollider,
  RigidBody,
  RapierRigidBody,
  useRapier
} from "@react-three/rapier";
import {
  World
} from "@dimforge/rapier3d-compat";
import { RepeatWrapping } from "three";
import { Demo } from "../../App";

import React, { FC, memo, useEffect, useRef, useState } from "react";

import { useControls, button } from "leva";

const colors = ["red", "green", "blue", "yellow", "orange", "purple"];
const randomColor = () => colors[Math.floor(Math.random() * colors.length)];
const useRandomColor = () => {
  const [color] = useState(randomColor());
  return color;
};


export const SnapshotExample: Demo = () => {
  const floor = useTexture(new URL("../damping/white.png", import.meta.url).toString());
  const ramp = useTexture(new URL("../damping/red.png", import.meta.url).toString());
  const ball = useTexture(new URL("../damping/green.png", import.meta.url).toString());

  floor.wrapS = floor.wrapT = RepeatWrapping;

  const balls = Array.from(Array(10).keys());

  const { world, setWorld } = useRapier()
  const worldSnapShotRef = useRef<Uint8Array>()

  useControls({
    takeSnapshot: button(() => worldSnapShotRef.current = world.takeSnapshot()),
    reStoreSnapshot: button(() => !!worldSnapShotRef.current && setWorld(World.restoreSnapshot(worldSnapShotRef.current))),
  });

  return (
    <>
      <group>
        <RigidBody type="fixed" colliders="cuboid">
          <Box args={[40, 1, 100]} position={[18, -1, 25]}>
            <meshStandardMaterial map={floor} />
          </Box>
        </RigidBody>

        <RigidBody type="fixed" colliders="cuboid">
          <Box
            args={[40, 0.5, 14]}
            position={[18, 2, -5]}
            rotation={[Math.PI / 8, 0, 0]}
          >
            <meshStandardMaterial map={ramp} />
          </Box>
        </RigidBody>

        {balls.map((i) => (
          <RigidBody
            key={i}
            colliders="ball"
            position={[i * 3, 10, -10]}
            angularDamping={i / 10}
          >
            <Sphere>
              <meshStandardMaterial map={ball} />
            </Sphere>
          </RigidBody>
        ))}
      </group>
    </>
  );
};
