import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // react-three-fiber relies on mutating objects (e.g. camera) inside
      // useFrame for per-frame updates without triggering re-renders.
      "react-hooks/immutability": "off",
      // Initializing client-only state (e.g. "now") in an effect to avoid
      // SSR/client hydration mismatches is an intentional, valid pattern.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
