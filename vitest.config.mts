import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const src = (pkg: string) =>
  fileURLToPath(new URL(`./packages/${pkg}/src`, import.meta.url));

// Prefer the `module` (esm) entry of every dependency. Vite's node/ssr resolver otherwise picks
// `main` for packages without an `exports` map, and those cjs builds `require('three')`, which
// resolves to three's cjs build while our sources get three's esm build. Two copies of three make
// `instanceof Object3D` checks fail (same setting as react-three-jolt).
const mainFields = ["module", "jsnext:main", "jsnext", "main"];

export default defineConfig({
  resolve: {
    mainFields,
    // Tests run against the workspace sources, so no `yarn build` is needed first. Subpath
    // entry points (`@react-three/rapier/<name>`) map to `src/<name>/index.ts` by convention,
    // matching the `entries` list in packages/react-three-rapier/rollup.config.mjs.
    alias: [
      {
        find: /^@react-three\/rapier-addons$/,
        replacement: `${src("react-three-rapier-addons")}/index.ts`
      },
      {
        find: /^@react-three\/rapier$/,
        replacement: `${src("react-three-rapier")}/index.ts`
      },
      {
        find: /^@react-three\/rapier\/(.+)$/,
        replacement: `${src("react-three-rapier")}/$1/index.ts`
      }
    ]
  },
  ssr: { resolve: { mainFields } },
  test: {
    environment: "jsdom",
    include: ["packages/*/tests/**/*.test.{ts,tsx}"],
    setupFiles: ["./packages/react-three-rapier/tests/setup.ts"]
  }
});
