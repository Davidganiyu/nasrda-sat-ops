import { defineConfig } from 'vite';
import cesium from 'vite-plugin-cesium';

export default defineConfig({
  plugins: [
    cesium({
      rebuildCesium: false
    })
  ],
  server: {
    port: 5173,
    host: true
  }
});
