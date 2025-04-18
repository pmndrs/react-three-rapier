import { Box, Environment, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Physics, RigidBody } from "@react-three/rapier";
import { Perf } from "r3f-perf";
import {
  JSX,
  ReactNode,
  StrictMode,
  Suspense,
  createContext,
  useContext,
  useRef,
  useState
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
import { ContactSkinExample } from "./examples/contact-skin/ContactSkinExample";
import { CradleExample } from "./examples/cradle/CradleExample";
import { Damping } from "./examples/damping/DampingExample";
import { DynamicTypeChangeExample } from "./examples/dynamic-type-change/DynamicTypeChangeExample";
import { ImmutablePropsExample } from "./examples/immutable-props/ImmutablePropsExample";
import { InstancedMeshes } from "./examples/instanced-meshes/InstancedMeshesExample";
import { InstancedMeshesCompound } from "./examples/instances-meshes-compound/InstancedMeshesCompoundExample";
import { Joints } from "./examples/joints/JointsExample";
import { Kinematics } from "./examples/kinematics/KinematicsExample";
import { LockedTransformsExample } from "./examples/locked-transforms/LockedTransformsExample";
import { ManualStepExample } from "./examples/manual-step/ManualStepExamples";
import { MeshColliderTest } from "./examples/mesh-collider-test/MeshColliderExample";
import { PerformanceExample } from "./examples/performance/PeformanceExample";
import Shapes from "./examples/plinko/ShapesExample";
import { RopeJointExample } from "./examples/rope-joint/RopeJointExample";
import { SensorsExample } from "./examples/sensors/SensorsExample";
import { SnapshotExample } from "./examples/snapshot/SnapshotExample";
import { SpringExample } from "./examples/spring/SpringExample";
import { StutteringExample } from "./examples/stuttering/StutteringExample";
import { Transforms } from "./examples/transforms/TransformsExample";
import { ActiveCollisionTypesExample } from "./examples/active-collision-types/ActiveCollisionTypesExample";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useResetOrbitControls } from "./hooks/use-reset-orbit-controls";

type DemoContext = {
  setDebug: (f: boolean) => void;
  setPaused: (f: boolean) => void;
  setCameraEnabled: (f: boolean) => void;
  orbitControlRef: React.RefObject<OrbitControlsImpl>;
};

const demoContext = createContext<Partial<DemoContext>>({});

export const useDemo = () => useContext(demoContext);

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
  "immutable-props": <ImmutablePropsExample />,
  snapshot: <SnapshotExample />,
  spring: <SpringExample />,
  "rope-joint": <RopeJointExample />,
  "active-collision-types": <ActiveCollisionTypesExample />,
  "contact-skin": <ContactSkinExample />
};

export const App = () => {
  const [debug, setDebug] = useState<boolean>(false);
  const [perf, setPerf] = useState<boolean>(false);
  const [paused, setPaused] = useState<boolean>(false);
  const [interpolate, setInterpolate] = useState<boolean>(true);
  const [physicsKey, setPhysicsKey] = useState<number>(0);
  const [cameraEnabled, setCameraEnabled] = useState<boolean>(true);
  const orbitControlRef = useRef<OrbitControlsImpl>(null!);

  useResetOrbitControls();

  const updatePhysicsKey = () => {
    setPhysicsKey((current) => current + 1);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "linear-gradient(#aef, #ddd)",
        backgroundRepeat: "repeat",
        fontFamily: "sans-serif"
      }}
    >
      <div
        style={{
          position: "fixed",
          inset: 0,
          // background: "radial-gradient(#00000035 1px, transparent 0px)",
          backgroundSize: "24px 24px",
          backgroundRepeat: "repeat"
        }}
      />
      <Suspense fallback="Loading...">
        <Canvas shadows dpr={1}>
          <StrictMode>
            <Physics
              paused={paused}
              key={physicsKey}
              interpolate={interpolate}
              debug={debug}
              timeStep={1 / 60}
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

              <OrbitControls ref={orbitControlRef} enabled={cameraEnabled} />

              <demoContext.Provider
                value={{
                  setDebug,
                  setPaused,
                  setCameraEnabled,
                  orbitControlRef
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
          top: 0,
          left: 0,
          bottom: 0,
          width: 240,
          display: "block",
          flexWrap: "wrap",
          overflow: "auto",
          padding: 20,
          background: "linear-gradient(to right, #fffa, #fffa)"
        }}
      >
        <h1
          style={{
            fontSize: 24
          }}
        >
          r3/rapier demos
        </h1>

        <div>
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
          <ToggleButton
            label="Reset"
            value={false}
            onClick={updatePhysicsKey}
          />
        </div>

        {Object.keys(routes).map((key) => (
          <Link key={key} to={key} end>
            {key.replace(/-/g, " ") || "Plinko"}
          </Link>
        ))}
      </div>
    </div>
  );
};

const Link = (props: NavLinkProps) => {
  return (
    <NavLink
      {...props}
      style={({ isActive }) => ({
        display: "inline-block",
        border: "2px solid blue",
        margin: 4,
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
      borderRadius: 4,
      margin: 4
    }}
    onClick={onClick}
  >
    {label}
  </button>
);
