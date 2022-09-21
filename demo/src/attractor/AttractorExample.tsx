import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, Stars, Box, Sphere } from '@react-three/drei'
import { Physics, InstancedRigidBodies, Attractor, RigidBody } from '@react-three/rapier'

export const AttractorExample = () => {
  const gravityType = 'linear' // "static" | "linear" | "newtonian"
  const defaultStrength = {
    value: 0.5,
    min: -10,
    max: 10,
    step: 0.5,
  }
  const showHelper = true;
  const strengthLeft = 0.5;
  const strengthCenter = 0.75;
  const strengthRight = 0.5;
  const gravitationalConstant = 5;

  return (
    <>
      <Balls />
      <Attractor
        gravityType={gravityType}
        strength={strengthLeft}
        showHelper={showHelper}
        position={[-20, 0, 0]}
        gravitationalConstant={gravitationalConstant} />
      <Attractor
        gravityType={gravityType}
        strength={strengthCenter}
        showHelper={showHelper}
        gravitationalConstant={gravitationalConstant} />
      <Attractor
        gravityType={gravityType}
        strength={strengthRight}
        showHelper={showHelper}
        position={[20, 0, 0]}
        gravitationalConstant={gravitationalConstant} />
    </>
  )
}

const BALLS = 50
const Balls = () => {
  return (
    <group>
      <InstancedRigidBodies
        positions={Array.from({ length: BALLS }, () => [Math.random() * 60 - 30, Math.random() * 60, Math.random() * 10 - 5])}
        colliders={'ball'}
        linearVelocity={[0, -1, 0]}>
        <instancedMesh args={[undefined, undefined, BALLS]} castShadow>
          <sphereBufferGeometry args={[0.5]} />
          <meshPhysicalMaterial roughness={0} metalness={0.5} color={'salmon'} />
        </instancedMesh>
      </InstancedRigidBodies>
    </group>
  )
}
