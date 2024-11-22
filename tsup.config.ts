import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.ts"],
	dts: true,
	clean: true,
	format: ["esm", "cjs"],
	name: "local-save",
	target: "node18",
	treeshake: true,
	splitting: false,
	sourcemap: true,
});
