import react from "@vitejs/plugin-react-swc";
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
	plugins: [react(), tsconfigPaths()],
	define: {
		"process.env": process.env,
	},
});
