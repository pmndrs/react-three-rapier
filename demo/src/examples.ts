import { ComponentType, LazyExoticComponent, lazy } from "react";

/**
 * Optional metadata an example exports as `meta` from its folder's `index.tsx`
 * (or, for folders without an index, from the example file itself). It is read when the
 * example's route is opened, so the sidebar never has to import every example.
 */
export interface ExampleMeta {
  /** Heading shown while the example is open. Defaults to the sidebar label. */
  title?: string;
  description?: string;
  /** Uses WebGL-only features (ShaderMaterial, onBeforeCompile, ...): shows a notice on WebGPU. */
  webglOnly?: boolean;
}

export interface ExampleRoute {
  /** URL path, e.g. `cradle` or `soft-bodies/cloth` */
  path: string;
  /** Sidebar label (the humanised folder name) */
  title: string;
  loadMeta: () => Promise<ExampleMeta>;
  Component: LazyExoticComponent<ComponentType>;
}

type Mod = { default?: unknown; meta?: ExampleMeta; [key: string]: unknown };
type Loader = () => Promise<Mod>;

// Convention: src/examples/<folder>/index.tsx -> default export component + optional `meta`.
const indexLoaders = import.meta.glob<Mod>("./examples/*/index.{ts,tsx}");

// Fallback for folders without an index: every `*Example*.tsx` file in them is a route, so
// examples written before the convention (or in other branches) register themselves too.
const fileLoaders = import.meta.glob<Mod>("./examples/*/*Example*.tsx");

const humanise = (s: string) => s.replace(/-/g, " ");
const kebab = (s: string) =>
  s
    .replace(/Examples?$/, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase();

/** default export, else the first exported function component */
const pickComponent = (mod: Mod): ComponentType => {
  if (typeof mod.default === "function") return mod.default as ComponentType;
  const first = Object.entries(mod).find(
    ([key, value]) => /^[A-Z]/.test(key) && typeof value === "function"
  );
  if (!first) throw new Error("Example module exports no component");
  return first[1] as ComponentType;
};

const make = (path: string, title: string, load: Loader): ExampleRoute => ({
  path,
  title,
  loadMeta: async () => (await load()).meta ?? {},
  Component: lazy(async () => ({ default: pickComponent(await load()) }))
});

const build = (): ExampleRoute[] => {
  const routes: ExampleRoute[] = [];
  const folderWithIndex = new Set<string>();

  for (const [file, load] of Object.entries(indexLoaders)) {
    const folder = file.split("/")[2];
    folderWithIndex.add(folder);
    routes.push(make(folder, humanise(folder), load));
  }

  const byFolder = new Map<string, string[]>();
  for (const file of Object.keys(fileLoaders)) {
    const folder = file.split("/")[2];
    if (folderWithIndex.has(folder)) continue;
    byFolder.set(folder, [...(byFolder.get(folder) ?? []), file]);
  }
  for (const [folder, files] of byFolder) {
    for (const file of files) {
      const name = file.split("/")[3].replace(/\.tsx$/, "");
      const single = files.length === 1;
      const path = single ? folder : `${folder}/${kebab(name)}`;
      const title = single
        ? humanise(folder)
        : `${humanise(folder)}: ${humanise(kebab(name))}`;
      routes.push(make(path, title, fileLoaders[file]));
    }
  }

  return routes.sort((a, b) => a.path.localeCompare(b.path));
};

export const examples = build();

/** Redirect target for `/` */
export const DEFAULT_EXAMPLE = "plinko";
