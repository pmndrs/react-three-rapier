/// <reference types="vitest" />
/// <reference types="vite/client" />

import react from '@vitejs/plugin-react'
import {defineConfig, UserConfig} from 'vite';
import * as path from "path";
import topLevelAwait from 'vite-plugin-top-level-await';
import wasm from 'vite-plugin-wasm';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), wasm(), topLevelAwait()],
  test: {
    environment: 'happy-dom',
    setupFiles: path.resolve(process.cwd(), './packages/react-three-rapier/test/setup.ts')
  },
} as UserConfig)
