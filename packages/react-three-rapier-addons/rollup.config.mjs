import { defineLibraryConfig } from "../../scripts/rollup-library.mjs";

// Entry points come from the `exports` map in package.json - see scripts/rollup-library.mjs.
export default defineLibraryConfig(import.meta.url);
