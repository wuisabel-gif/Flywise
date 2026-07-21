import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  build: {
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      output: {
        entryFileNames: "assets/flywise-widget.js",
        assetFileNames: (assetInfo) => assetInfo.name?.endsWith(".css")
          ? "assets/flywise-widget.css"
          : "assets/[name]-[hash][extname]",
      },
    },
  },
});
