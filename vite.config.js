import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/NovaPostTTNmanager/' : '/',
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
}));
