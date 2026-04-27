import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    // Component tests declare // @vitest-environment jsdom at the top.
    // lib/__tests__ run in the default node environment.
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
  },
});
