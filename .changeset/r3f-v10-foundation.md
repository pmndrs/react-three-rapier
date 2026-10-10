---
"@react-three/rapier": major
"@react-three/rapier-addons": major
---

Move to the React Three Fiber v10 stack and modernize the package format.

### Requirements

- `@react-three/fiber` `>=10.0.0-0` (developed against `10.0.0-canary.a056612`; scheduler fixed-step support needs `@pmndrs/scheduler` 0.3+)
- `react` `>=19.0 <19.3` (the range r3f v10 supports)
- `three` `>=0.185.0`
- Node.js 22+ for tooling (`engines`)
- `@react-three/rapier-addons` now peers on `@react-three/rapier` `^3.0.0-0`

### Package format

- Built with rollup + esbuild instead of preconstruct. Each package ships an `exports` map with
  ESM (`dist/index.mjs`) and CommonJS (`dist/index.cjs`) builds and matching type declarations
  (`.d.mts` / `.d.cts`), and is marked `sideEffects: false`.
- Deep imports into package internals (e.g. `@react-three/rapier/src/...` or `dist/...` files)
  are no longer possible; import from the package root.

### Behaviour notes

- Under r3f v10 `useFrame`'s state no longer has `clock`; use `state.elapsed` / `state.delta`
  in your own frame callbacks.
