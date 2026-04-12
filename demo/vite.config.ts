import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

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
	resolve: {
		alias: {
			"@feb": path.resolve(__dirname, "src"),
		},
	},
	build: {
		outDir: "build",
	},
	plugins: [reactRouter(), tailwindcss()],
});
