# Development

This repository is a Yarn workspace monorepo:

- `packages/react-three-rapier` - `@react-three/rapier`
- `packages/react-three-rapier-addons` - `@react-three/rapier-addons`
- `demo` - the examples app (Vite, private, not published)

## Setup

- **Node 22** (see `.nvmrc`; tooling needs 22.22.2 or newer).
- **Yarn 4**, provided by Corepack through the `packageManager` field. Enable Corepack once:

```sh
corepack enable
yarn install
```

Installing also sets up the git hooks (`simple-git-hooks`): commit messages are checked by
commitlint (conventional commits), and pre-commit runs `yarn typecheck`.

## Commands

| Command               | What it does                                                                    |
| --------------------- | ------------------------------------------------------------------------------- |
| `yarn build`          | Build every package into its `dist/` (see "Build" below)                        |
| `yarn typecheck`      | `tsc` over the packages' `src` and `tests`                                      |
| `yarn test`           | Typecheck, then run the vitest suite once                                       |
| `yarn vitest`         | Vitest in watch mode (`yarn test:ui` for the UI)                                |
| `yarn check:packages` | `publint --strict` and `attw --pack` for each package (run `yarn build` first)  |
| `yarn lint`           | ESLint (flat config in `eslint.config.mjs`)                                     |
| `yarn format`         | Prettier, writing changes (`yarn format:check` only checks)                     |
| `yarn demo`           | Start the demo dev server                                                       |
| `yarn demo:build`     | Typecheck and build the demo                                                    |
| `yarn ci`             | Typecheck, build, package checks and tests - roughly what CI runs               |
| `yarn changeset`      | Add a changeset describing your change (needed for anything that gets released) |

Tests, the root typecheck and the demo all resolve `@react-three/rapier` and
`@react-three/rapier-addons` to the workspace **sources** (vitest aliases, Vite aliases and
tsconfig `paths`), so none of them needs a build first, and the demo hot-reloads library
changes.

## Demo app and examples

The demo runs on **WebGPU by default** when the browser has `navigator.gpu`, otherwise WebGL.
Use the WebGPU / WebGL buttons in the sidebar, or `?renderer=webgl|webgpu` in the URL (the
choice is also remembered in localStorage). Switching reloads the page. Examples must work on
both renderers; if one genuinely cannot (custom `ShaderMaterial`, `onBeforeCompile`, troika
`<Text>`, postprocessing...) mark it `webglOnly` (below) and the demo shows a notice on WebGPU.

**Adding an example needs no edits to `App.tsx`.** Routes are discovered with `import.meta.glob`
(`demo/src/examples.ts`) and loaded lazily:

- Create `demo/src/examples/<folder>/index.ts(x)` whose **default export** is the example
  component. The route is `/<folder>` and the sidebar label is the humanised folder name.
- Optionally export `meta` from the same module: `{ title?, description?, webglOnly? }`
  (`export { default, meta } from "./MyExample"`). It is shown in a header while the example is open.
- A folder **without** an `index` still registers: every `*Example*.tsx` file in it becomes a
  route (`/<folder>` for a single file, `/<folder>/<file-name-kebab>` for several), using the
  default export or the first exported capitalised function as the component.
- Examples can use `useDemo()` and `Demo` from `../../App` (re-exported from `demo/src/demo-context.ts`).

## Build

Each package's `yarn build` runs `tsc -p tsconfig.build.json` (typecheck + per-file
declarations in `dist/types`) and then rollup with the shared config in
`scripts/rollup-library.mjs`: esbuild produces `dist/<entry>.mjs` and `dist/<entry>.cjs`, and
rollup-plugin-dts rolls the declarations into `dist/<entry>.d.ts`, `.d.mts` and `.d.cts`.

Entry points are read from the package's `exports` map. `@react-three/rapier/soft-bodies` is the
reference subpath entry: it has `src/soft-bodies/index.ts`, a `"./soft-bodies"` entry in
`exports` (same shape as `"."`), `"dist/soft-bodies.*"` in `files` and a `typesVersions` entry for
node10 resolution. A new subpath needs the same four things. Subpath entries must import core through
`../index`, which the build rewrites to `@react-three/rapier` so core is never bundled twice.

## Linting and formatting

ESLint 9 (flat config) and Prettier 3 are configured, the codebase is formatted, and it has no
lint errors. CI runs `yarn lint` and `yarn format:check` as a blocking job, so run `yarn format`
before pushing. Lint warnings (unused variables, hook dependencies) don't fail the build, but
avoid adding new ones. The one-off Prettier 3 reformat is listed in `.git-blame-ignore-revs`
(GitHub skips it automatically; set `blame.ignoreRevsFile` to skip it locally).

## Releases

Releases are managed with [changesets](https://github.com/changesets/changesets) and
`.github/workflows/release.yml`, which opens a "Version Packages" PR and publishes when it is
merged.

- `main` publishes stable versions.
- `next` (the 3.0 integration branch) is in prerelease mode (`.changeset/pre.json`): it publishes
  `3.0.0-alpha.n` under the `alpha` dist-tag. Run `yarn prerelease:exit` before merging `next`
  into `main`.
