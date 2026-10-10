import { Box, Environment, OrbitControls, Stats } from "@react-three/drei";
import { Canvas, useStore } from "@react-three/fiber";
import { Physics, RigidBody } from "@react-three/rapier";
import {
  ReactNode,
  StrictMode,
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from "react";
import {
  Navigate,
  NavLink,
  NavLinkProps,
  Route,
  Routes,
  useLocation
} from "react-router-dom";
import { demoContext } from "./demo-context";
import { DEFAULT_EXAMPLE, ExampleMeta, examples } from "./examples";
import { getRenderer, hasWebGPU, switchRenderer } from "./renderer";
import type { OrbitControls as OrbitControlsImpl } from "three/addons/controls/OrbitControls.js";
import { useResetOrbitControls } from "./hooks/use-reset-orbit-controls";

// Kept here so examples can keep importing them from "../../App"
export { useDemo } from "./demo-context";
export type { Demo, DemoContext } from "./demo-context";

/**
 * r3f v10 leaves `state.gl` null on WebGPU roots (it is the legacy WebGL alias of
 * `state.renderer`), but drei 11 alpha still reads `gl.domElement` (<Html>) and
 * `gl.initTexture` (useTexture). Point it at the WebGPU renderer so those keep working.
 * Remove once drei uses `state.renderer`.
 */
const GlShim = ({ children }: { children: ReactNode }) => {
  const store = useStore();
  const [ready, setReady] = useState(false);
  useLayoutEffect(() => {
    const { gl, renderer } = store.getState();
    if (!gl && renderer) store.setState({ gl: renderer } as never);
    setReady(true);
  }, [store]);
  return ready ? <>{children}</> : null;
};

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


export const App = () => {
  const [debug, setDebug] = useState<boolean>(false);
  const [perf, setPerf] = useState<boolean>(false);
  const [paused, setPaused] = useState<boolean>(false);
  const [interpolate, setInterpolate] = useState<boolean>(true);
  const [physicsKey, setPhysicsKey] = useState<number>(0);
  const [cameraEnabled, setCameraEnabled] = useState<boolean>(true);
  const orbitControlRef = useRef<OrbitControlsImpl>(null!);
  const renderer = useMemo(getRenderer, []);
  const { pathname } = useLocation();
  const [meta, setMeta] = useState<ExampleMeta>({});

  const current = examples.find((e) => "/" + e.path === pathname);
  useEffect(() => {
    let live = true;
    setMeta({});
    current?.loadMeta().then((m) => live && setMeta(m));
    return () => {
      live = false;
    };
  }, [current]);

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
        <Canvas
          // the root entry picks WebGPU when given the `renderer` prop and WebGL for `gl`.
          // Switching renderer reloads the page, so these props never change on a live canvas.
          key={renderer}
          {...(renderer === "webgpu"
            ? { renderer: { shadows: true } }
            : { gl: { shadows: true } })}
          dpr={1}
        >
          <StrictMode>
            <GlShim>
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
                  orbitControlRef,
                  renderer
                }}
              >
                <Suspense fallback={null}>
                  <Routes>
                    <Route
                      path="/"
                      element={<Navigate to={DEFAULT_EXAMPLE} replace />}
                    />
                    {examples.map(({ path, Component }) => (
                      <Route path={path} key={path} element={<Component />} />
                    ))}
                  </Routes>
                </Suspense>
              </demoContext.Provider>

              <Floor />

              {/* r3f-perf does not support r3f v10 yet; drei <Stats> stands in */}
              {perf && <Stats />}
            </Physics>
            </GlShim>
          </StrictMode>
        </Canvas>
      </Suspense>

      {(meta.title || meta.description || (meta.webglOnly && renderer === "webgpu")) && (
        <div
          style={{
            position: "absolute",
            top: 8,
            left: 270,
            maxWidth: 480,
            padding: "6px 10px",
            background: "#fffd",
            borderRadius: 4,
            fontSize: 13
          }}
        >
          {meta.title && <strong>{meta.title}</strong>}
          {meta.description && <div>{meta.description}</div>}
          {meta.webglOnly && renderer === "webgpu" && (
            <div style={{ color: "#b00" }}>
              WebGL only: this example does not support the WebGPU renderer.
              Switch to WebGL to see it working.
            </div>
          )}
        </div>
      )}

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
            label="WebGPU"
            value={renderer === "webgpu"}
            disabled={!hasWebGPU()}
            onClick={() => switchRenderer("webgpu")}
          />
          <ToggleButton
            label="WebGL"
            value={renderer === "webgl"}
            onClick={() => switchRenderer("webgl")}
          />
        </div>

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

        {examples.map(({ path, title }) => (
          <Link key={path} to={path} end>
            {title}
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
  disabled,
  onClick
}: {
  label: string;
  value: boolean;
  disabled?: boolean;
  onClick(): void;
}) => (
  <button
    disabled={disabled}
    title={disabled ? "WebGPU is not available in this browser" : undefined}
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
