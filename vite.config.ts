import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-vite-plugin";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react(), TanStackRouterVite()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	server: {
		host: 'localhost',
		port: 5173,
		strictPort: true,
		hmr: {
			host: 'localhost',
			protocol: 'ws',
		},
		watch: {
			usePolling: true,
		},
		cors: true,
		// Allow access from ngrok
		allowedHosts: ['ace8-2405-4802-8150-44e0-871-cf8a-d77a-57d1.ngrok-free.app'],
	}
});
