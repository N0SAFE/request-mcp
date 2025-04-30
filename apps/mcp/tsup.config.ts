import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/bin/sse.ts", "src/bin/stdio.ts", "src/index.ts"],
  splitting: false,
  sourcemap: true,
  clean: true,
  noExternal: [/^@repo\//], // <-- This tells tsup to bundle all @repo/** packages
});
