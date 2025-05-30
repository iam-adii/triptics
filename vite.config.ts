import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      'nodemailer': './src/utils/browser-shims/nodemailer-shim.js',
      'stream': './src/utils/browser-shims/stream-shim.js',
      'os': './src/utils/browser-shims/os-shim.js',
    },
  },
}));
