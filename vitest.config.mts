import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Resolve the "@/..." imports from tsconfig.json.
    tsconfigPaths: true,
    alias: {
      // `server-only` throws when imported outside a Server Component bundle.
      // Unit tests run in plain Node, so swap it for an empty module.
      "server-only": fileURLToPath(new URL("./test/empty-module.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    restoreMocks: true,
    unstubGlobals: true,
    unstubEnvs: true,
  },
});
