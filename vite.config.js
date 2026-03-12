import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    proxy: {
      '/api': {
        target: 'https://api.novaposhta.ua',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/v2.0/json/'),
        secure: true,
      },
    },
  },
});
