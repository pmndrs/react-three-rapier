import { Box, Sphere } from "@react-three/drei";
import {
  CapsuleCollider,
  CollisionEnterHandler,
  HeightfieldArgs,
  HeightfieldCollider,
  interactionGroups,
  RigidBody,
  RigidBodyOptions
} from "@react-three/rapier";
import {
  createContext,
  Dispatch,
  memo,
  ReactNode,
  SetStateAction,
  useCallback,
  useContext,
  useState
} from "react";
import { PlaneGeometry } from "three";
import { useSuzanne } from "../all-shapes/AllShapesExample";
import { useResetOrbitControls } from "../../hooks/use-reset-orbit-controls";

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
  length: heightFieldHeight * heightFieldWidth
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
  heightFieldGeometry.attributes.position.array[index * 3 + 2] = v;
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

const Collisioner = (
  props: Omit<RigidBodyOptions, "children"> & {
    children(color: string): ReactNode;
  }
) => {
  const [color, setColor] = useState("blue");
  const { setExplosions } = useContext(explosionContext) as {
    setExplosions: Dispatch<SetStateAction<ReactNode[]>>;
  };

  const { children, type, colliders, position } = props;

  const handleCollisionEnter: CollisionEnterHandler = useCallback(
    ({ manifold, other, target }) => {
      setColor("red");

      const contact = manifold?.solverContactPoint(0) as {
        x: number;
        y: number;
        z: number;
      };

      if (contact) {
        setExplosions((curr: ReactNode[]) => [
          ...curr,
          <Explosion position={[contact.x, contact.y, contact.z]} />
        ]);
      }
    },
    []
  );

  const handleCollsionExit = useCallback(() => {
    setColor("blue");
  }, []);

  return (
    <RigidBody
      type={type}
      colliders={colliders}
      position={position}
      onCollisionEnter={handleCollisionEnter}
      onCollisionExit={handleCollsionExit}
      name={props.name}
    >
      {children(color)}
    </RigidBody>
  );
};

const heightFieldArgs: HeightfieldArgs = [
  heightFieldWidth - 1,
  heightFieldWidth - 1,
  heightField,
  {
    x: heightFieldWidth,
    y: 1,
    z: heightFieldWidth
  }
];

const Collisioners = memo(() => {
  return (
    <group>
      <Collisioner position={[1, 4, 0]} colliders={"cuboid"} name={"Box 1"}>
        {(color) => (
          <Box>
            <meshPhysicalMaterial color={color} />
          </Box>
        )}
      </Collisioner>
      <Collisioner position={[-1, 5, 0]} colliders={"cuboid"} name={"Box 2"}>
        {(color) => (
          <Box>
            <meshPhysicalMaterial color={color} />
          </Box>
        )}
      </Collisioner>

      <Collisioner colliders="ball" position={[0, 8, 0]} name={"Sphere 1"}>
        {(color) => (
          <Sphere>
            <meshPhysicalMaterial color={color} />
          </Sphere>
        )}
      </Collisioner>

      <Collisioner colliders="hull" position={[-4, 2, 0]} name={"Suzanne"}>
        {(color) => <Suzanne color={color} />}
      </Collisioner>

      <Collisioner
        colliders={false}
        collisionGroups={interactionGroups([1])}
        name={"Capsule 1"}
      >
        {(color) => (
          <>
            <mesh>
              <capsuleGeometry args={[1, 2, 16, 16]} />
              <meshPhysicalMaterial color={color} />
            </mesh>
            <CapsuleCollider
              args={[1, 1]}
              collisionGroups={interactionGroups([2])}
              onCollisionEnter={({ collider }) =>
                console.log("ENTER collider / collider", collider)
              }
              onCollisionExit={({ collider }) =>
                console.log("EXIT collider / collider", collider)
              }
            />
          </>
        )}
      </Collisioner>

      <Collisioner
        type={"fixed"}
        position={[0, -8, 0]}
        colliders={false}
        name={"Floor"}
      >
        {(color) => (
          <>
            <mesh geometry={heightFieldGeometry} receiveShadow>
              <meshPhysicalMaterial side={2} color={color} />
            </mesh>

            <HeightfieldCollider args={heightFieldArgs} />
          </>
        )}
      </Collisioner>
    </group>
  );
});

const Explosions = () => {
  const { explosions } = useContext(explosionContext) as {
    explosions: ReactNode[];
  };
  return (
    <>
      {explosions.map((explosion, index) => (
        <group key={index}>{explosion}</group>
      ))}
    </>
  );
};

export const CollisionEventsExample = () => {
  const [explosions, setExplosions] = useState<ReactNode[]>([]);

  useResetOrbitControls(30);

  return (
    <explosionContext.Provider value={{ explosions, setExplosions }}>
      <Collisioners />
      <Explosions />
    </explosionContext.Provider>
  );
};
