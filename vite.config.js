import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'https://www.ncei.noaa.gov',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/bmkg': {
        target: 'https://data.bmkg.go.id',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/bmkg/, '')
      }
    }
  }
});
