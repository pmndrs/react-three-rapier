// ESLint 9 flat config, mirroring react-three-jolt's eslint.config.mjs.
//
// Formatting is not linted: it's a separate `yarn format` / `yarn format:check` (Prettier) step,
// and eslint-config-prettier (last) switches off every stylistic rule that would fight it.
// See LINTING notes in DEVELOPMENT.md. Do not run `eslint --fix` repo-wide.
import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import jsxA11y from "eslint-plugin-jsx-a11y";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/dist",
      "**/node_modules",
      "**/coverage",
      "**/docs/out",
      "packages/react-three-rapier/docs",
      ".yarn"
    ]
  },

  js.configs.recommended,
  tseslint.configs.recommended,
  react.configs.flat.recommended,
  // every package and the demo compile with the automatic JSX runtime (`"jsx": "react-jsx"`)
  react.configs.flat["jsx-runtime"],
  jsxA11y.flatConfigs.recommended,

  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021
      }
    },
    settings: {
      react: {
        version: "detect"
      }
    },
    plugins: {
      "react-hooks": reactHooks
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/consistent-type-imports": "off",

      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_"
        }
      ],

      // Only the two classic hooks rules. eslint-plugin-react-hooks 7's presets also enable the
      // React Compiler rule set (purity, immutability, refs, ...), which this codebase was never
      // written against - opt into those deliberately, not as part of the tooling migration.
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // eslint-plugin-react only knows DOM attributes, so every r3f intrinsic
      // (<mesh position=... />) is a false positive.
      "react/no-unknown-property": "off",
      // props are typed with TypeScript, not PropTypes
      "react/prop-types": "off",
      // anonymous components passed to memo()/forwardRef() are idiomatic here
      "react/display-name": "off",

      "jsx-a11y/no-static-element-interactions": "warn",
      "@typescript-eslint/no-unused-expressions": "warn"
    }
  },

  // Must be last: turns off stylistic rules that would otherwise fight Prettier.
  eslintConfigPrettier
);
