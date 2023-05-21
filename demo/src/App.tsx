import { Box, Environment, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Physics, RigidBody, useRapier } from "@react-three/rapier";
import { Perf } from "r3f-perf";
import {
  createContext,
  ReactNode,
  Suspense,
  useContext,
  useState,
  StrictMode,
  useEffect
} from "react";
import { NavLink, NavLinkProps, Route, Routes } from "react-router-dom";
import { AllCollidersExample } from "./examples/all-colliders/AllCollidersExample";
import { AllShapesExample } from "./examples/all-shapes/AllShapesExample";
import { ApiUsage } from "./examples/api-usage/ApiUsageExample";
import { AttractorExample } from "./examples/attractors/AttractorsExample";
import { Car } from "./examples/car/CarExample";
import { Cluster } from "./examples/cluster/ClusterExample";
import { Colliders } from "./examples/colliders/CollidersExample";
import { CollisionEventsExample } from "./examples/collision-events/CollisionEventsExample";
import { ComponentsExample } from "./examples/components/ComponentsExample";
import { ContactForceEventsExample } from "./examples/contact-force-events/ContactForceEventsExample";
import { CradleExample } from "./examples/cradle/CradleExample";
import { Damping } from "./examples/damping/DampingExample";
import { InstancedMeshes } from "./examples/instanced-meshes/InstancedMeshesExample";
import { InstancedMeshesCompound } from "./examples/instances-meshes-compound/InstancedMeshesCompoundExample";
import { Joints } from "./examples/joints/JointsExample";
import { Kinematics } from "./examples/kinematics/KinematicsExample";
import { ManualStepExample } from "./examples/manual-step/ManualStepExamples";
import { MeshColliderTest } from "./examples/mesh-collider-test/MeshColliderExample";
import { SensorsExample } from "./examples/sensors/SensorsExample";
import Shapes from "./examples/plinko/ShapesExample";
import { Transforms } from "./examples/transforms/TransformsExample";
import { LockedTransformsExample } from "./examples/locked-transforms/LockedTransformsExample";
import { PerformanceExample } from "./examples/performance/PeformanceExample";
import { DynamicTypeChangeExample } from "./examples/dynamic-type-change/DynamicTypeChangeExample";
import { StutteringExample } from "./examples/stuttering/StutteringExample";
import { ImmutablePropsExample } from "./examples/immutable-props/ImmutablePropsExample";

const demoContext = createContext<{
  setDebug?(f: boolean): void;
  setPaused?(f: boolean): void;
  setCameraEnabled?(f: boolean): void;
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
    <RigidBody type="fixed" colliders="cuboid" name="floor">
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
  attractors: <AttractorExample />,
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
  "contact-force-events": <ContactForceEventsExample />,
  sensors: <SensorsExample />,
  "manual-step": <ManualStepExample />,
  "locked-transforms": <LockedTransformsExample />,
  performance: <PerformanceExample />,
  "dynamic-type-changes": <DynamicTypeChangeExample />,
  stuttering: <StutteringExample />,
  "immutable-props": <ImmutablePropsExample />
};

export const App = () => {
  const [debug, setDebug] = useState<boolean>(false);
  const [perf, setPerf] = useState<boolean>(false);
  const [paused, setPaused] = useState<boolean>(false);
  const [interpolate, setInterpolate] = useState<boolean>(true);
  const [physicsKey, setPhysicsKey] = useState<number>(0);
  const [cameraEnabled, setCameraEnabled] = useState<boolean>(true);

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
            <Physics
              paused={paused}
              key={physicsKey}
              interpolate={interpolate}
              debug={debug}
              // erp={0.2}
            >
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

              <OrbitControls enabled={cameraEnabled} />

              <demoContext.Provider
                value={{
                  setDebug,
                  setPaused,
                  setCameraEnabled
                }}
              >
                <Routes>
                  {Object.keys(routes).map((key, index, array) => (
                    <Route path={key} key={key} element={routes[key]} />
                  ))}
                </Routes>
              </demoContext.Provider>

              <Floor />

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
          <Link key={key} to={key} end>
            {key.replace(/-/g, " ") || "Plinko"}
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
        <ToggleButton
          label="Interpolate"
          value={interpolate}
          onClick={() => setInterpolate((v) => !v)}
        />
        <ToggleButton label="Reset" value={false} onClick={updatePhysicsKey} />
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
