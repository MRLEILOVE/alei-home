import { defineConfig } from 'astro/config';

export default defineConfig({
  site: process.env.SITE_URL || undefined,
  base: process.env.BASE_PATH || '/',
  output: 'static',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  vite: {
    optimizeDeps: { include: ['aplayer'] },
    // giscus 在跨域 iframe 中读取本站 CSS，本地开发与预览也需要允许该来源。
    server: { cors: { origin: 'https://giscus.app' } },
    preview: { cors: { origin: 'https://giscus.app' } },
  },
});
