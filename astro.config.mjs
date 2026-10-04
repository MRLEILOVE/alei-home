import { defineConfig } from 'astro/config';

export default defineConfig({
  site: process.env.SITE_URL || undefined,
  base: process.env.BASE_PATH || '/',
  output: 'static',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  vite: { optimizeDeps: { include: ['aplayer'] } },
});
