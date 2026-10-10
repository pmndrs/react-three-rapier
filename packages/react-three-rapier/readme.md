<p align="center">
  <a href="#"><img src="https://raw.githubusercontent.com/pmndrs/react-three-rapier/HEAD/packages/react-three-rapier/misc/hero.svg" alt="@react-three/rapier" /></a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@react-three/rapier"><img src="https://img.shields.io/npm/v/@react-three/rapier?style=for-the-badge&colorA=0099DA&colorB=ffffff" /></a>
  <a href="https://discord.gg/ZZjjNvJ"><img src="https://img.shields.io/discord/740090768164651008?style=for-the-badge&colorA=0099DA&colorB=ffffff&label=discord&logo=discord&logoColor=ffffff" /></a>
</p>

`@react-three/rapier` (or `r3/rapier`) is a wrapper around the [Rapier](https://rapier.rs/docs/user_guides/javascript) WASM-based physics engine, designed to slot seamlessly into a [`@react-three/fiber`](https://github.com/pmndrs/react-three-fiber) pipeline.

The goal of this library is to provide a fast physics engine with minimal friction and a small, straightforward API.

> **3.0 is in development.** It targets `@react-three/fiber` v10 (including WebGPU), Rapier.js 0.21 and three 0.185+. If you are on react-three-fiber v9 stay on `@react-three/rapier` v2; for v8 / React 18 use v1. See the [migration guide](https://github.com/pmndrs/react-three-rapier/blob/HEAD/docs/advanced/migration.mdx).

## Installation

```bash
npm install three @react-three/fiber @react-three/rapier
```

`<Physics>` loads the Rapier WebAssembly module lazily and must be wrapped in `<Suspense>`.

## Basic usage

```tsx
import { Box, Torus } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier";

const App = () => {
  return (
    <Canvas>
      <Suspense>
        <Physics debug>
          <RigidBody colliders={"hull"} restitution={2}>
            <Torus />
          </RigidBody>

          <CuboidCollider position={[0, -2, 0]} args={[20, 0.5, 20]} />
        </Physics>
      </Suspense>
    </Canvas>
  );
};
```

## Documentation

The guides live in [`docs/`](https://github.com/pmndrs/react-three-rapier/tree/HEAD/docs) and are published with [pmndrs/docs](https://github.com/pmndrs/docs). Preview them locally with `yarn docs`.

- Getting started: [Introduction](https://github.com/pmndrs/react-three-rapier/blob/HEAD/docs/getting-started/introduction.mdx), [Installation](https://github.com/pmndrs/react-three-rapier/blob/HEAD/docs/getting-started/installation.mdx), [Basic usage](https://github.com/pmndrs/react-three-rapier/blob/HEAD/docs/getting-started/basic-usage.mdx)
- API: [Physics](https://github.com/pmndrs/react-three-rapier/blob/HEAD/docs/api/physics.mdx), [RigidBody](https://github.com/pmndrs/react-three-rapier/blob/HEAD/docs/api/rigid-body.mdx), [Colliders](https://github.com/pmndrs/react-three-rapier/blob/HEAD/docs/api/colliders.mdx), [InstancedRigidBodies](https://github.com/pmndrs/react-three-rapier/blob/HEAD/docs/api/instanced-rigid-bodies.mdx), [Joints](https://github.com/pmndrs/react-three-rapier/blob/HEAD/docs/api/joints.mdx), [Debug](https://github.com/pmndrs/react-three-rapier/blob/HEAD/docs/api/debug.mdx), [Attractors](https://github.com/pmndrs/react-three-rapier/blob/HEAD/docs/api/attractors.mdx), [Hooks](https://github.com/pmndrs/react-three-rapier/blob/HEAD/docs/api/hooks.mdx)
- Advanced: [Collision events](https://github.com/pmndrs/react-three-rapier/blob/HEAD/docs/advanced/collision-events.mdx), [Contact forces](https://github.com/pmndrs/react-three-rapier/blob/HEAD/docs/advanced/contact-forces.mdx), [Sensors](https://github.com/pmndrs/react-three-rapier/blob/HEAD/docs/advanced/sensors.mdx), [Collision groups](https://github.com/pmndrs/react-three-rapier/blob/HEAD/docs/advanced/collision-groups.mdx), [Physics hooks](https://github.com/pmndrs/react-three-rapier/blob/HEAD/docs/advanced/physics-hooks.mdx), [Update loop](https://github.com/pmndrs/react-three-rapier/blob/HEAD/docs/advanced/update-loop.mdx), [Snapshots](https://github.com/pmndrs/react-three-rapier/blob/HEAD/docs/advanced/snapshots.mdx), [Performance](https://github.com/pmndrs/react-three-rapier/blob/HEAD/docs/advanced/performance.mdx)
- [Migrating from 2.x to 3.0](https://github.com/pmndrs/react-three-rapier/blob/HEAD/docs/advanced/migration.mdx)
- [FAQ and troubleshooting](https://github.com/pmndrs/react-three-rapier/blob/HEAD/docs/advanced/faq.mdx)

The generated TypeDoc reference is at [pmndrs.github.io/react-three-rapier](https://pmndrs.github.io/react-three-rapier/).

## Examples

<a href="https://codesandbox.io/s/react-three-rapier-auto-colliders-b4coz1"><img src="https://raw.githubusercontent.com/pmndrs/react-three-rapier/HEAD/packages/react-three-rapier/misc/example-auto-colliders.jpg" width="240" /></a>
<a href="https://codesandbox.io/s/react-three-rapier-compound-colliders-ol5ybn"><img src="https://raw.githubusercontent.com/pmndrs/react-three-rapier/HEAD/packages/react-three-rapier/misc/example-compound-shapes.jpg" width="240" /></a>
<a href="https://codesandbox.io/s/react-three-rapier-sensors-byjmsk"><img src="https://raw.githubusercontent.com/pmndrs/react-three-rapier/HEAD/packages/react-three-rapier/misc/example-sensors.jpg" width="240" /></a>
<a href="https://codesandbox.io/s/react-three-rapier-joints-mhhbd4"><img src="https://raw.githubusercontent.com/pmndrs/react-three-rapier/HEAD/packages/react-three-rapier/misc/example-joints.jpg" width="240" /></a>
<a href="https://codesandbox.io/s/react-three-rapier-attractors-oyj640"><img src="https://raw.githubusercontent.com/pmndrs/react-three-rapier/HEAD/packages/react-three-rapier/misc/example-attractors.jpg" width="240" /></a>

## Contributing

Please read the [contribution guide](https://github.com/pmndrs/react-three-rapier/blob/HEAD/packages/react-three-rapier/CONTRIBUTING.md). Questions are welcome on [Discord](https://discord.gg/ZZjjNvJ).
