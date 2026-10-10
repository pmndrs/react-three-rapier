// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import * as path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Temporary: resolves the soft-bodies subpath to source until the
      // package `exports` map provides `@react-three/rapier/soft-bodies`.
      "@react-three/rapier/soft-bodies": path.resolve(
        __dirname,
        "../packages/react-three-rapier/src/soft-bodies/index.ts"
      )
    }
  }
});
