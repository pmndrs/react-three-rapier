import { Box, Cone, Cylinder, Html, Sphere } from "@react-three/drei";
import {
  CapsuleCollider,
  HeightfieldCollider,
  RigidBody,
  UseRigidBodyOptions,
} from "@react-three/rapier";
import { useSuzanne } from "../all-shapes/AllShapes";
import { PlaneGeometry } from "three";
import React, {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useState,
} from "react";

const Suzanne = ({ color }: { color: string }) => {
  const { nodes: suzanne } = useSuzanne();
  return (
    <primitive object={suzanne.Suzanne.clone()} castShadow receiveShadow>
      <meshPhysicalMaterial color={color} />
    </primitive>
  );
};

const explosionContext = createContext<{
  explosions: ReactNode[];
  setExplosions: Dispatch<SetStateAction<ReactNode[]>>;
} | null>(null);

const heightFieldHeight = 50;
const heightFieldWidth = 50;
const heightField = Array.from({
  length: heightFieldHeight * heightFieldWidth,
}).map((_, index) => {
  return Math.random();
});

const heightFieldGeometry = new PlaneGeometry(
  heightFieldWidth,
  heightFieldHeight,
  heightFieldWidth - 1,
  heightFieldHeight - 1
);

heightField.forEach((v, index) => {
  (heightFieldGeometry.attributes.position.array as number[])[
    index * 3 + 2
  ] = v;
});
heightFieldGeometry.scale(1, -1, 1);
heightFieldGeometry.rotateX(-Math.PI / 2);
heightFieldGeometry.rotateY(-Math.PI / 2);
heightFieldGeometry.computeVertexNormals();

const Explosion = ({ position }: { position: [number, number, number] }) => {
  return (
    <Sphere position={position} scale={0.5}>
      <meshPhysicalMaterial />
    </Sphere>
  );
};

const Collisioner = ({
  children,
  ...props
}: UseRigidBodyOptions & { children(color: string): ReactNode }) => {
  const [color, setColor] = useState("blue");
  const { setExplosions } = useContext(explosionContext) as {
    setExplosions: Dispatch<SetStateAction<ReactNode[]>>;
  };

  const handleCollisionEnter = ({ manifold }: any) => {
    setColor("red");

    console.log("enter", manifold?.solverContactPoint(0));

    const contact = manifold?.solverContactPoint(0) as {
      x: number;
      y: number;
      z: number;
    };

    if (contact) {
      setExplosions((curr: ReactNode[]) => [
        ...curr,
        <Explosion position={[contact.x, contact.y, contact.z]} />,
      ]);
    }
  };

  const handleCollsionExit = () => {
    setColor("blue");
  };

  return (
    <RigidBody
      {...props}
      onCollisionEnter={handleCollisionEnter}
      onCollisionExit={handleCollsionExit}
    >
      {children(color)}
    </RigidBody>
  );
};

export const CollisionEventsExample = () => {
  const [explosions, setExplosions] = useState<ReactNode[]>([]);

  return (
    <explosionContext.Provider value={{ explosions, setExplosions }}>
      <group>
        <Collisioner position={[1, 5, 0]} colliders={"cuboid"}>
          {(color) => (
            <Box>
              <meshPhysicalMaterial color={color} />
            </Box>
          )}
        </Collisioner>
        <Collisioner position={[-1, 5, 0]} colliders={"cuboid"}>
          {(color) => (
            <Box>
              <meshPhysicalMaterial color={color} />
            </Box>
          )}
        </Collisioner>

        <Collisioner colliders="ball" position={[0, 8, 0]}>
          {(color) => (
            <Sphere>
              <meshPhysicalMaterial color={color} />
            </Sphere>
          )}
        </Collisioner>

        <Collisioner colliders="hull" position={[-4, 2, 0]}>
          {(color) => <Suzanne color={color} />}
        </Collisioner>

        <Collisioner colliders={false}>
          {(color) => (
            <>
              <mesh>
                <capsuleGeometry args={[1, 2, 16, 16]} />
                <meshPhysicalMaterial color={color} />
              </mesh>
              <CapsuleCollider args={[1, 1]} />
            </>
          )}
        </Collisioner>

        <Collisioner type={"fixed"} position={[0, -8, 0]} colliders={false}>
          {(color) => (
            <>
              <mesh geometry={heightFieldGeometry} receiveShadow>
                <meshPhysicalMaterial side={2} color={color} />
              </mesh>

              <HeightfieldCollider
                args={[
                  heightFieldWidth - 1,
                  heightFieldWidth - 1,
                  heightField,
                  {
                    x: heightFieldWidth,
                    y: 1,
                    z: heightFieldWidth,
                  },
                ]}
              />
            </>
          )}
        </Collisioner>
      </group>
      {explosions.map((explosion, index) => (
        <group key={index}>{explosion}</group>
      ))}
    </explosionContext.Provider>
  );
};
