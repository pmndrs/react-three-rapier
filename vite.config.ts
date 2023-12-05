/// <reference types="vitest" />
/// <reference types="vite/client" />

import react from "@vitejs/plugin-react";
import { defineConfig, UserConfig } from "vite";
import * as path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "happy-dom",
    setupFiles: path.resolve(
      process.cwd(),
      "./packages/react-three-rapier/tests/setup.ts"
    )
  }
} as UserConfig);
