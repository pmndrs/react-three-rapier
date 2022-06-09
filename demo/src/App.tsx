import {
  Box,
  Environment,
  OrbitControls,
  useContextBridge,
} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { ReactNode, Suspense, useState } from "react";
import { Physics, RigidBody } from "@react-three/rapier";
import Joints from "./joints/Joints";
import Shapes from "./shapes/Shapes";
import { ComponentsExample } from "./components/Components";
import { CradleExample } from "./cradle/Cradle";
import { Transforms } from "./transforms/Transforms";
import { Cluster } from "./cluster/Cluster";
import { AllShapes } from "./all-shapes/AllShapes";
import {
  NavLink,
  NavLinkProps,
  Route,
  Routes,
  UNSAFE_LocationContext,
  UNSAFE_NavigationContext,
  UNSAFE_RouteContext,
  useLocation,
} from "react-router-dom";

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
  const ContextBridge = useContextBridge(
    UNSAFE_LocationContext,
    UNSAFE_NavigationContext,
    UNSAFE_RouteContext
  );
  const location = useLocation();

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
          <ContextBridge>
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

              <Routes>
                <Route path="" element={<Shapes setUI={setUI} />} />
                <Route path="joints" element={<Joints setUI={setUI} />} />
                <Route
                  path="components"
                  element={<ComponentsExample setUI={setUI} />}
                />
                <Route
                  path="cradle"
                  element={<CradleExample setUI={setUI} />}
                />
                <Route
                  path="transforms"
                  element={<Transforms setUI={setUI} />}
                />
                <Route path="cluster" element={<Cluster setUI={setUI} />} />
                <Route
                  path="all-shapes"
                  element={<AllShapes setUI={setUI} />}
                />
              </Routes>

              <Floor key={location.pathname} />
            </Physics>
          </ContextBridge>
        </Canvas>

        <div
          style={{
            position: "absolute",
            top: 24,
            left: 24,
            display: "flex",
            gap: 12,
          }}
        >
          <Link to="/">Shapes</Link>
          <Link to="joints">Joints</Link>
          <Link to="components">Components</Link>
          <Link to="cradle">Cradle</Link>
          <Link to="cluster">Cluster</Link>
          <Link to="all-shapes">All Shapes</Link>
          <Link to="transforms">Inherited Transforms</Link>
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

function Link(props: NavLinkProps) {
  return (
    <NavLink
      {...props}
      style={({ isActive }) => ({
        color: "white",
        textDecoration: isActive ? "underline" : "none",
      })}
    />
  );
}
