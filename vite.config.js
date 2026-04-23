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
      },
      '/cuaca': {
        target: 'https://api.bmkg.go.id/publik/prakiraan-cuaca',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/cuaca/, '')
      },
      '/nowcast': {
        target: 'https://www.bmkg.go.id/alerts/nowcast/id',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/nowcast/, '')
      }
    }
  }
});
