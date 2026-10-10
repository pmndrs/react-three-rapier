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

## Build

Each package's `yarn build` runs `tsc -p tsconfig.build.json` (typecheck + per-file
declarations in `dist/types`) and then rollup with the shared config in
`scripts/rollup-library.mjs`: esbuild produces `dist/<entry>.mjs` and `dist/<entry>.cjs`, and
rollup-plugin-dts rolls the declarations into `dist/<entry>.d.ts`, `.d.mts` and `.d.cts`.

Entry points are read from the package's `exports` map. To add a subpath entry such as
`@react-three/rapier/soft-bodies`, create `src/soft-bodies/index.ts`, add a `"./soft-bodies"`
entry to `exports` (same shape as `"."`), `"dist/soft-bodies.*"` to `files` and a
`typesVersions` entry for node10 resolution. Subpath entries must import core through
`../index`, which the build rewrites to `@react-three/rapier` so core is never bundled twice.

## Linting and formatting

ESLint 9 (flat config) and Prettier 3 are configured but the codebase has **not** been
reformatted or lint-fixed yet; that happens once at the end of the 3.0 integration to avoid
conflicts with in-flight work. Until then the CI lint job is non-blocking. Format the files you
touch with `yarn prettier --write <paths>`, and never run `eslint --fix` or `yarn format` across
files you did not otherwise change.

## Releases

Releases are managed with [changesets](https://github.com/changesets/changesets) and
`.github/workflows/release.yml`, which opens a "Version Packages" PR and publishes when it is
merged.

- `main` publishes stable versions.
- `next` (the 3.0 integration branch) is in prerelease mode (`.changeset/pre.json`): it publishes
  `3.0.0-alpha.n` under the `alpha` dist-tag. Run `yarn prerelease:exit` before merging `next`
  into `main`.
