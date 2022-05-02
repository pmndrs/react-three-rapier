import { Box, Environment, OrbitControls, Plane } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { ReactNode, Suspense, useState } from "react";
import { RapierWorld, useCuboid } from "../src";
import Joints from "./joints/Joints";
import Shapes from "./shapes/Shapes";
import { ComponentsExample } from "./components/Components";
import { CradleExample } from "./cradle/Cradle";

const Floor = () => {
  useCuboid(
    {
      position: [0, -12.7, 0],
      type: "fixed",
    },
    {
      args: [200, 0.2, 200],
    }
  );

  return (
    <Plane
      position={[0, -12.55, 0]}
      scale={200}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
    >
      <shadowMaterial opacity={0.2} />
    </Plane>
  );
};

export const App = () => {
  const [ui, setUI] = useState<ReactNode>();
  const [demo, setDemo] = useState("cradle");

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "linear-gradient(blue, white)",
      }}
    >
      <Suspense fallback="Loading...">
        <Canvas shadows>
          <RapierWorld>
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

            {demo === "shapes" && <Shapes setUI={setUI} />}
            {demo === "joints" && <Joints setUI={setUI} />}
            {demo === "components" && <ComponentsExample setUI={setUI} />}
            {demo === "cradle" && <CradleExample setUI={setUI} />}
            {/* 
            <RB>
              <Box />
            </RB> */}

            <Floor />
          </RapierWorld>
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
