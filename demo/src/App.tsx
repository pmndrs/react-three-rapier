import React from "react";
import { Box, Environment, OrbitControls, Plane } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { ReactNode, Suspense, useState } from "react";
import { Debug, Physics, RigidBody, useCuboid } from "@react-three/rapier";
import Joints from "./joints/Joints";
import Shapes from "./shapes/Shapes";
import { ComponentsExample } from "./components/Components";
import { CradleExample } from "./cradle/Cradle";
import { Transforms } from "./transforms/Transforms";
import { Cluster } from "./cluster/Cluster";
import { AllShapes } from "./all-shapes/AllShapes";

export interface Demo {
  (props: {
    children?: ReactNode;
    setUI: (ui: ReactNode) => void;
  }): JSX.Element;
}

const Floor = () => {
  return (
    <RigidBody type="fixed" colliders="cuboid">
      <Box
        position={[0, -12.55, 0]}
        scale={[100, 0.1, 100]}
        rotation={[0, 0, 0]}
        receiveShadow
      >
        <shadowMaterial opacity={0.2} />
      </Box>
    </RigidBody>
  );
};

export const App = () => {
  const [ui, setUI] = useState<ReactNode>();
  const [demo, setDemo] = useState("shapes");

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "linear-gradient(blue, white)",
        fontFamily: "sans-serif",
      }}
    >
      <Suspense fallback="Loading...">
        <Canvas shadows>
          <Physics colliders={false}>
            <directionalLight
              castShadow
              position={[10, 10, 10]}
              shadow-camera-bottom={-40}
              shadow-camera-top={40}
              shadow-camera-left={-40}
              shadow-camera-right={40}
              shadow-mapSize-width={1024}
              shadowBias={-0.0001}
            />
            <Environment preset="apartment" />
            <OrbitControls />

            <Suspense>
              {demo === "shapes" && <Shapes setUI={setUI} />}
              {demo === "joints" && <Joints setUI={setUI} />}
              {demo === "components" && <ComponentsExample setUI={setUI} />}
              {demo === "cradle" && <CradleExample setUI={setUI} />}
              {demo === "transforms" && <Transforms setUI={setUI} />}
              {demo === "cluster" && <Cluster setUI={setUI} />}
              {demo === "all-shapes" && <AllShapes setUI={setUI} />}
            </Suspense>

            <Floor />
          </Physics>
        </Canvas>

        <div
          style={{
            position: "absolute",
            top: 24,
            left: 24,
          }}
        >
          <button onClick={() => setDemo("shapes")}>Shapes</button>
          <button onClick={() => setDemo("joints")}>Joints</button>
          <button onClick={() => setDemo("components")}>Components</button>
          <button onClick={() => setDemo("cradle")}>Cradle</button>
          <button onClick={() => setDemo("cluster")}>Cluster</button>
          <button onClick={() => setDemo("all-shapes")}>All Shapes</button>
          <button onClick={() => setDemo("transforms")}>
            Inherited Transforms
          </button>
        </div>

        <div
          style={{
            position: "absolute",
            top: 24,
            right: 24,
          }}
        >
          {ui}
        </div>
      </Suspense>
    </div>
  );
};
