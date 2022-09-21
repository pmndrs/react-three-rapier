import { useFrame } from '@react-three/fiber'
import { useRapier, Vector3Array } from '@react-three/rapier'
import { Sphere } from '@react-three/drei'
import * as THREE from 'three'
import { RigidBody } from '@dimforge/rapier3d-compat';
type GravityType = "static" | "linear" | "newtonian";
interface AttractorProps {
  position?: Vector3Array;
  strength?: number;
  range?: number;
  showHelper?: boolean;
  gravityType?: GravityType;
  gravitationalConstant?: number;
}
export const Attractor = ({
  position = [0, 0, 0],
  strength = 0.5,
  range = 15,
  showHelper = false,
  gravityType = 'static',
  gravitationalConstant = 6.673e-11,
}: AttractorProps) => {
  const { world } = useRapier()
  const gravitySource = new THREE.Vector3(position[0], position[1], position[2])
  const calcForceByType = {
    static: (s: number, m2: number, r: number, d: number, G: number) => s,
    linear: (s: number, m2: number, r: number, d: number, G: number) => s * (d / r),
    newtonian: (s: number, m2: number, r: number, d: number, G: number) => (G * s * m2) / Math.pow(d, 2),
  }

  const applyImpulseToBodiesInRange = (): void => {
    const impulseVector = new THREE.Vector3()

    world.raw().forEachRigidBody((body: RigidBody) => {
      const { x, y, z } = body.translation()
      const bodyV3: THREE.Vector3 = new THREE.Vector3(x, y, z)
      const distance: number = gravitySource.distanceTo(bodyV3)
      if (distance < range) {
        let force = calcForceByType[gravityType](strength, body.mass(), range, distance, gravitationalConstant)
        // Prevent wild forces when Attractors collide
        force = force === Infinity ? strength : force
        impulseVector.subVectors(gravitySource, bodyV3).normalize().multiplyScalar(force)
        body.applyImpulse(impulseVector, true)
      }
    })
  }

  useFrame(() => applyImpulseToBodiesInRange())

  return showHelper ? (
    <>
      <Sphere scale={0.25} position={position}>
        <meshBasicMaterial color="darkgrey" />
      </Sphere>
      <Sphere scale={range} position={position}>
        <meshBasicMaterial color="cyan" wireframe transparent opacity={0.1} />
      </Sphere>
    </>
  ) : null
}
