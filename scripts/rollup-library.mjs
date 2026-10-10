// Shared rollup config for the publishable packages in packages/* (mirrors react-three-jolt's
// rollup.config.mjs, factored out because both packages build the same way).
//
// Each package's `yarn build` runs, in order:
//   1. `tsc -p tsconfig.build.json` - typechecks `src` and emits one `.d.ts` per source file into
//      `dist/types/`.
//   2. `rollup --config rollup.config.mjs` - this file:
//      - a JS bundle per entry point, transpiled by esbuild (no typechecking), emitted as both
//        ESM (`dist/<name>.mjs`) and CJS (`dist/<name>.cjs`);
//      - a declaration bundle per entry point (rollup-plugin-dts), rolling `dist/types/` into
//        `dist/<name>.d.ts` / `.d.mts` / `.d.cts`, so each module condition gets exactly one
//        self-contained declaration file (this is what keeps `attw` happy).
//
// ENTRY POINTS ARE DERIVED FROM THE `exports` MAP IN package.json. To add a subpath entry (see
// `@react-three/rapier/soft-bodies` for a wired-up example):
//   1. create `src/soft-bodies/index.ts`;
//   2. add `"./soft-bodies"` to `exports` (copy the shape of `"."`, with `soft-bodies.*` files),
//      add `"dist/soft-bodies.*"` to `files`, and a `typesVersions` entry for node10 resolution;
//   3. nothing else: tsconfig `paths` and the vitest aliases already map
//      `@react-three/rapier/<name>` to `src/<name>/index.ts`.
// Subpath entries must import core through the package root (`import { useRapier } from
// "../index"`), never through deep paths - see `externalSiblings` below.

import { readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import dts from "rollup-plugin-dts";
import esbuild from "rollup-plugin-esbuild";
import filesize from "rollup-plugin-filesize";

/**
 * @param {string} packageUrl `import.meta.url` of the package's rollup.config.mjs
 */
export function defineLibraryConfig(packageUrl) {
  const root = path.dirname(fileURLToPath(packageUrl));
  const pkg = JSON.parse(
    readFileSync(path.join(root, "package.json"), "utf-8")
  );

  // `"."` -> `index` (src/index.ts), `"./soft-bodies"` -> `soft-bodies` (src/soft-bodies/index.ts)
  const entries = Object.keys(pkg.exports)
    .filter((key) => key !== "./package.json")
    .map((key) => {
      const name = key === "." ? "index" : key.slice(2);
      const dir = name === "index" ? "" : `${name}/`;
      return {
        name,
        input: path.join(root, `src/${dir}index.ts`),
        types: path.join(root, `dist/types/${dir}index.d.ts`)
      };
    });

  // Externalize every dependency and peer dependency, including subpath imports
  // (`three/addons/...`, `react/jsx-runtime`), so nothing is bundled into dist by accident.
  const dependencies = [
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.peerDependencies ?? {})
  ];
  const external = (id) =>
    dependencies.some((dep) => id === dep || id.startsWith(`${dep}/`));

  /**
   * A subpath entry reaches core through a relative import (`../index`). Left alone, rollup would
   * inline core into that bundle - a second copy of the React contexts in one published package.
   * Resolve relative imports of another entry's module to the published specifier instead
   * (`@react-three/rapier`, `@react-three/rapier/<name>`) and keep them external, so
   * `dist/soft-bodies.mjs` imports core exactly the way a consumer would.
   */
  const externalSiblings = (name) => ({
    name: "external-siblings",
    resolveId(source, importer) {
      if (!importer || !source.startsWith(".")) return null;
      let resolved = path.resolve(path.dirname(importer), source);
      if (!path.extname(resolved)) resolved += ".ts";
      const sibling = entries.find(
        (entry) =>
          entry.name !== name &&
          (entry.input === resolved ||
            entry.input === resolved.replace(/\.ts$/, "/index.ts"))
      );
      if (!sibling) return null;
      const id =
        sibling.name === "index" ? pkg.name : `${pkg.name}/${sibling.name}`;
      return { id, external: true };
    }
  });

  // rollup does not clean its output directory; drop this entry's stale bundles (but not
  // dist/types, which step 1 of the build just wrote)
  const cleanBundles = (name) => ({
    name: "clean-bundles",
    buildStart() {
      for (const ext of ["mjs", "cjs", "mjs.map", "cjs.map"]) {
        rmSync(path.join(root, `dist/${name}.${ext}`), { force: true });
      }
    }
  });

  const jsBundle = ({ name, input }) => ({
    input,
    external,
    output: [
      {
        file: path.join(root, `dist/${name}.mjs`),
        format: "es",
        sourcemap: true,
        exports: "named"
      },
      {
        file: path.join(root, `dist/${name}.cjs`),
        format: "cjs",
        sourcemap: true,
        exports: "named"
      }
    ],
    plugins: [
      cleanBundles(name),
      externalSiblings(name),
      nodeResolve({ extensions: [".ts", ".tsx", ".mjs", ".js"] }),
      esbuild({
        target: "es2022",
        tsconfig: path.join(root, "tsconfig.json")
      }),
      filesize({ showBrotliSize: true, showGzippedSize: false })
    ]
  });

  // Declarations deliberately do not externalize siblings: a `.d.ts` has no runtime weight, and
  // inlining core's types keeps each entry's types self-contained.
  const dtsBundle = ({ name, types }) => ({
    input: types,
    external,
    output: ["d.ts", "d.mts", "d.cts"].map((ext) => ({
      file: path.join(root, `dist/${name}.${ext}`),
      format: "es"
    })),
    plugins: [dts()]
  });

  return [...entries.map(jsBundle), ...entries.map(dtsBundle)];
}
