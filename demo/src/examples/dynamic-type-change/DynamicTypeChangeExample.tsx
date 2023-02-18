import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { RapierRigidBody, RigidBody } from "@react-three/rapier";
import { useEffect, useRef, useState } from "react";
import { useDemo } from "../../App";
import { useSuzanne } from "../all-shapes/AllShapesExample";

export const DynamicTypeChangeExample = () => {
  const { setCameraEnabled } = useDemo();
  const monkee = useRef<RapierRigidBody>(null);
  const [dragging, setDragging] = useState(false);
  const [s] = useState<{ mouse: { x: number; y: number } | null }>({
    mouse: null
  });

  const {
    nodes: { Suzanne }
  } = useSuzanne();

  const { mouse } = useThree();

  useEffect(() => {
    if (dragging) {
      document.body.style.cursor = "grabbing";
      setCameraEnabled?.(false);
    } else {
      document.body.style.cursor = "";
      setCameraEnabled?.(true);
      s.mouse = null;
    }
  }, [dragging]);

  useFrame(() => {
    if (dragging) {
      if (!s.mouse) {
        s.mouse = { x: mouse.x, y: mouse.y };
      } else {
        const { x, y } = monkee.current?.translation() || { x: 0, y: 0 };

        monkee.current?.setTranslation(
          {
            x: x + (mouse.x - s.mouse.x) * 10,
            y: y + (mouse.y - s.mouse.y) * 10,
            z: 0
          },
          true
        );

        s.mouse = { x: mouse.x, y: mouse.y };
      }
    }
  });

  useEffect(() => {
    const handleMouseUp = () => {
      setDragging(false);
    };
    window.addEventListener("pointerup", handleMouseUp);

    return () => {
      window.removeEventListener("pointerup", handleMouseUp);
    };
  }, []);

  return (
    <group>
      <RigidBody type={dragging ? "kinematicPosition" : "dynamic"} ref={monkee}>
        <mesh
          castShadow
          receiveShadow
          geometry={Suzanne.geometry}
          onPointerDown={() => {
            setDragging(true);
          }}
          onPointerOver={() => (document.body.style.cursor = "grab")}
          onPointerOut={() => (document.body.style.cursor = "")}
        >
          <meshStandardMaterial color="yellow" />
          <Html
            style={{
              pointerEvents: "none",
              width: 200,
              marginLeft: -100,
              marginTop: -100,
              borderRadius: 4,
              background: "rgba(255,255,255,.2)",
              padding: 8,
              textAlign: "center",
              backdropFilter: "blur(10px)"
            }}
          >
            <div>Drag me!</div>
            <div>Type: {dragging ? "kinematicPosition" : "dynamic"}</div>
          </Html>
        </mesh>
      </RigidBody>
    </group>
  );
};
