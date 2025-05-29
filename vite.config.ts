import { defineConfig, loadEnv, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path';
import { visualizer } from "rollup-plugin-visualizer";
import dns from 'dns';
import fs from 'fs';

//running on localhost instead of IP 127.0.0.1
// https://vitejs.dev/config/server-options.html#server-host
dns.setDefaultResultOrder('verbatim')

// https://vitejs.dev/config/
// https://v2.vitejs.dev/config/#environment-variables
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      react(),
      // visualizer() as PluginOption
    ],
    server: {
      host: "0.0.0.0",
      port: parseInt(env.PORT),
      https: {
        key: fs.readFileSync(path.resolve(__dirname, './SSL/localhost+1-key.pem')),
        cert: fs.readFileSync(path.resolve(__dirname, './SSL/localhost+1.pem')),
      }
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src/"),
        components: `${path.resolve(__dirname, "./src/components/")}`,
        styles: `${path.resolve(__dirname, "./src/styles/")}`,
        config: `${path.resolve(__dirname, "./src/config/")}`,
        pages: `${path.resolve(__dirname, "./src/pages/")}`,
      },
    },
  }
})
