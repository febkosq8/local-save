import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	server: {
		port: 3000,
		proxy: {
			"^/api/(.*)$": {
				target: "http://localhost:3030",
				secure: false,
				changeOrigin: true,
			},
		},
	},
	build: {
		outDir: "build",
	},
	plugins: [reactRouter(), tsconfigPaths()],
	define: {
		"process.env": process.env,
	},
});
