import { Box, Environment, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Debug, Physics, RigidBody } from "@react-three/rapier";
import { Perf } from "r3f-perf";
import {
  createContext,
  ReactNode,
  Suspense,
  useContext,
  useState,
  StrictMode
} from "react";
import { NavLink, NavLinkProps, Route, Routes } from "react-router-dom";
import { AllCollidersExample } from "./all-colliders/AllCollidersExample";
import { AllShapesExample } from "./all-shapes/AllShapesExample";
import { ApiUsage } from "./api-usage/ApiUsageExample";
import { Car } from "./car/CarExample";
import { Cluster } from "./cluster/ClusterExample";
import { Colliders } from "./colliders/CollidersExample";
import { CollisionEventsExample } from "./collision-events/CollisionEventsExample";
import { ComponentsExample } from "./components/ComponentsExample";
import { CradleExample } from "./cradle/CradleExample";
import { Damping } from "./damping/DampingExample";
import { InstancedMeshes } from "./instanced-meshes/InstancedMeshesExample";
import { InstancedMeshesCompound } from "./instances-meshes-compound/InstancedMeshesCompoundExample";
import { Joints } from "./joints/JointsExample";
import { Kinematics } from "./kinematics/KinematicsExample";
import { MeshColliderTest } from "./mesh-collider-test/MeshColliderExample";
import { SensorsExample } from "./sensors/SensorsExample";
import Shapes from "./shapes/ShapesExample";
import { Transforms } from "./transforms/TransformsExample";

const demoContext = createContext<{
  setDebug?(f: boolean): void;
  setUI?(n: ReactNode): void;
}>({});

export const useDemo = () => useContext(demoContext);

const ToggleButton = ({
  label,
  value,
  onClick
}: {
  label: string;
  value: boolean;
  onClick(): void;
}) => (
  <button
    style={{
      background: value ? "red" : "transparent",
      border: "2px solid red",
      color: value ? "white" : "red",
      borderRadius: 4
    }}
    onClick={onClick}
  >
    {label}
  </button>
);

export interface Demo {
  (props: { children?: ReactNode }): JSX.Element;
}

const Floor = () => {
  return (
    <RigidBody type="fixed" colliders="cuboid">
      <Box
        position={[0, -12.55 - 5, 0]}
        scale={[200, 10, 200]}
        rotation={[0, 0, 0]}
        receiveShadow
      >
        <shadowMaterial opacity={0.2} />
      </Box>
    </RigidBody>
  );
};

const routes: Record<string, ReactNode> = {
  "": <Shapes />,
  joints: <Joints />,
  components: <ComponentsExample />,
  cradle: <CradleExample />,
  transforms: <Transforms />,
  cluster: <Cluster />,
  "all-shapes": <AllShapesExample />,
  car: <Car />,
  "api-usage": <ApiUsage />,
  kinematics: <Kinematics />,
  "mesh-collider-test": <MeshColliderTest />,
  colliders: <Colliders />,
  "instanced-meshes": <InstancedMeshes />,
  damping: <Damping />,
  "instanced-meshes-compound": <InstancedMeshesCompound />,
  "all-colliders": <AllCollidersExample />,
  "collision-events": <CollisionEventsExample />,
  sensors: <SensorsExample />
};

export const App = () => {
  const [ui, setUI] = useState<ReactNode>(null);
  const [debug, setDebug] = useState<boolean>(false);
  const [perf, setPerf] = useState<boolean>(false);
  const [paused, setPaused] = useState<boolean>(false);
  const [physicsKey, setPhysicsKey] = useState<number>(0);

  const updatePhysicsKey = () => {
    setPhysicsKey((current) => current + 1);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "linear-gradient(blue, white)",
        fontFamily: "sans-serif"
      }}
    >
      <Suspense fallback="Loading...">
        <Canvas shadows>
          <StrictMode>
            <Physics paused={paused} key={physicsKey}>
              <directionalLight
                castShadow
                position={[10, 10, 10]}
                shadow-camera-bottom={-40}
                shadow-camera-top={40}
                shadow-camera-left={-40}
                shadow-camera-right={40}
                shadow-mapSize-width={1024}
                shadow-bias={-0.0001}
              />
              <Environment preset="apartment" />
              <OrbitControls />

              <demoContext.Provider
                value={{
                  setUI,
                  setDebug
                }}
              >
                <Routes>
                  {Object.keys(routes).map((key, index, array) => (
                    <Route path={key} key={key} element={routes[key]} />
                  ))}
                </Routes>
              </demoContext.Provider>

              <Floor />

              {debug && <Debug color="green" sleepColor="red" />}
              {perf && <Perf />}
            </Physics>
          </StrictMode>
        </Canvas>
      </Suspense>

      <div
        style={{
          position: "absolute",
          bottom: 24,
          left: 24,
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          maxWidth: 600
        }}
      >
        {Object.keys(routes).map((key) => (
          <Link key={key} to={key}>
            {key.replace(/-/g, " ") || "Shapes"}
          </Link>
        ))}

        <ToggleButton
          label="Debug"
          value={debug}
          onClick={() => setDebug((v) => !v)}
        />
        <ToggleButton
          label="Perf"
          value={perf}
          onClick={() => setPerf((v) => !v)}
        />
        <ToggleButton
          label="Paused"
          value={paused}
          onClick={() => setPaused((v) => !v)}
        />
        <ToggleButton label="Reset" value={false} onClick={updatePhysicsKey} />
      </div>

      <div
        style={{
          position: "absolute",
          top: 24,
          left: 24
        }}
      >
        {ui}
      </div>
    </div>
  );
};

const Link = (props: NavLinkProps) => {
  return (
    <NavLink
      {...props}
      style={({ isActive }) => ({
        border: "2px solid blue",
        textTransform: "capitalize",
        borderRadius: 4,
        padding: 4,
        background: isActive ? "blue" : "transparent",
        textDecoration: "none",
        color: isActive ? "white" : "blue"
      })}
    />
  );
};
