import { defineConfig, globalIgnores } from "eslint/config";
import next from "eslint-config-next";

export default defineConfig([
  globalIgnores([".next/**", "out/**", "build/**", "node_modules/**", "public/wasm/**"]),
  {
    extends: [...next],
  },
]);
