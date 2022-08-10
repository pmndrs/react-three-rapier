import {
  Box,
  Environment,
  OrbitControls,
  useContextBridge,
} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Debug, Physics, RigidBody } from "@react-three/rapier";
import { Perf } from "r3f-perf";
import {
  createContext,
  ReactNode,
  Suspense,
  useContext,
  useState,
} from "react";
import {
  NavLink,
  NavLinkProps,
  Route,
  Routes,
  UNSAFE_LocationContext,
  UNSAFE_NavigationContext,
  UNSAFE_RouteContext,
} from "react-router-dom";
import { AllShapes } from "./all-shapes/AllShapes";
import { ApiUsage } from "./api-usage/ApiUsage";
import { Car } from "./car/Car";
import { Cluster } from "./cluster/Cluster";
import { Colliders } from "./colliders/Colliders";
import { ComponentsExample } from "./components/Components";
import { CradleExample } from "./cradle/Cradle";
import { Damping } from "./damping/Damping";
import { InstancedMeshes } from "./instanced-meshes/InstancedMeshes";
import Joints from "./joints/Joints";
import { Kinematics } from "./kinematics/Kinematics";
import { MeshColliderTest } from "./mesh-collider-test/MeshColliderTest";
import Shapes from "./shapes/Shapes";
import { Transforms } from "./transforms/Transforms";

const demoContext = createContext<{
  setDebug?(f: boolean): void;
  setUI?(n: ReactNode): void;
}>({});

export const useDemo = () => useContext(demoContext);

export interface Demo {
  (props: { children?: ReactNode }): JSX.Element;
}

const Floor = () => {
  return (
    <RigidBody type="fixed" colliders="cuboid">
      <Box
        position={[0, -12.55, 0]}
        scale={[200, 0.1, 200]}
        rotation={[0, 0, 0]}
        receiveShadow
      >
        <shadowMaterial opacity={0.2} />
      </Box>
    </RigidBody>
  );
};

export const App = () => {
  const [ui, setUI] = useState<ReactNode>(null);
  const [debug, setDebug] = useState<boolean>(false);
  const [perf, setPerf] = useState<boolean>(false);

  const ContextBridge = useContextBridge(
    UNSAFE_LocationContext,
    UNSAFE_NavigationContext,
    UNSAFE_RouteContext
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "linear-gradient(blue, white)",
        fontFamily: "sans-serif",
      }}
    >
      <Canvas shadows>
        <Suspense fallback="Loading...">
          <ContextBridge>
            <Physics>
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

              <demoContext.Provider
                value={{
                  setUI,
                  setDebug,
                }}
              >
                <Routes>
                  <Route path="" element={<Shapes />} />
                  <Route path="joints" element={<Joints />} />
                  <Route path="components" element={<ComponentsExample />} />
                  <Route path="cradle" element={<CradleExample />} />
                  <Route path="transforms" element={<Transforms />} />
                  <Route path="cluster" element={<Cluster />} />
                  <Route path="all-shapes" element={<AllShapes />} />
                  <Route path="car" element={<Car />} />
                  <Route path="api-usage" element={<ApiUsage />} />
                  <Route path="kinematics" element={<Kinematics />} />
                  <Route
                    path="mesh-collider-test"
                    element={<MeshColliderTest />}
                  />
                  <Route path="colliders" element={<Colliders />} />
                  <Route
                    path="instanced-meshes"
                    element={<InstancedMeshes />}
                  />
                  <Route path="damping" element={<Damping />} />
                </Routes>
              </demoContext.Provider>

              <Floor />

              {debug && <Debug />}
              {perf && <Perf />}
            </Physics>
          </ContextBridge>
        </Suspense>
      </Canvas>

      <div
        style={{
          position: "absolute",
          bottom: 24,
          left: 24,
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          maxWidth: 600,
        }}
      >
        <Link to="/">Shapes</Link>
        <Link to="joints">Joints</Link>
        <Link to="components">Components</Link>
        <Link to="cradle">Cradle</Link>
        <Link to="cluster">Cluster</Link>
        <Link to="car">Simple Car</Link>
        <Link to="all-shapes">All Shapes</Link>
        <Link to="transforms">Inherited Transforms</Link>
        <Link to="api-usage">API usage</Link>
        <Link to="kinematics">Kinematics</Link>
        <Link to="mesh-collider-test">MeshCollider</Link>
        <Link to="colliders">Free Colliders</Link>
        <Link to="instanced-meshes">Instanced Meshes</Link>
        <Link to="damping">Damping</Link>
        <button
          style={{
            background: debug ? "red" : "transparent",
            border: "2px solid red",
            color: debug ? "white" : "red",
            borderRadius: 4,
          }}
          onClick={() => setDebug((v) => !v)}
        >
          Debug
        </button>
        <button
          style={{
            background: perf ? "red" : "transparent",
            border: "2px solid red",
            color: perf ? "white" : "red",
            borderRadius: 4,
          }}
          onClick={() => setPerf((v) => !v)}
        >
          Perf
        </button>
      </div>

      <div
        style={{
          position: "absolute",
          top: 24,
          left: 24,
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
        borderRadius: 4,
        padding: 4,
        background: isActive ? "blue" : "transparent",
        textDecoration: "none",
        color: isActive ? "white" : "blue",
      })}
    />
  );
};
