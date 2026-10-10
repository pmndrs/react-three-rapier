import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const src = (pkg: string) =>
  fileURLToPath(new URL(`../packages/${pkg}/src`, import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Use the workspace sources directly so the demo needs no `yarn build` and gets HMR on
    // library changes. Subpath entries map to `src/<name>/index.ts` (see tsconfig.json `paths`).
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
    ],
    // the aliased sources import react/three/r3f themselves; make sure they share the demo's copy
    dedupe: ["react", "react-dom", "three", "@react-three/fiber"]
  }
});
