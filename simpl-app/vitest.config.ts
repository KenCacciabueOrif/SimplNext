import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    // Component tests declare // @vitest-environment jsdom at the top.
    // lib/__tests__ run in the default node environment.
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
  },
});
