import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    {
      name: 'copy-api-directory',
      // Copy API directory to dist folder during build
      writeBundle() {
        const apiDir = path.resolve(__dirname, 'api');
        const distApiDir = path.resolve(__dirname, 'dist/api');
        
        if (fs.existsSync(apiDir)) {
          if (!fs.existsSync(distApiDir)) {
            fs.mkdirSync(distApiDir, { recursive: true });
          }
          
          // Note: This is a simplified approach. For a real project, 
          // you would want to use a more robust file copying solution
          // that handles all files and subdirectories.
          try {
            fs.copyFileSync(
              path.resolve(apiDir, '.htaccess'),
              path.resolve(distApiDir, '.htaccess')
            );
            console.log('API .htaccess file copied to dist/api');
          } catch (err) {
            console.error('Error copying API files:', err);
          }
        }
      }
    }
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      'stream': './src/utils/browser-shims/stream-shim.js',
      'os': './src/utils/browser-shims/os-shim.js',
    },
  },
}));
