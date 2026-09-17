import { copyFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/adt-ai-tools/',
  plugins: [react(), {
    name: 'strip-unpublished-fonts',
    enforce: 'pre',
    transform(code, id) {
      if (id.endsWith('/src/styles.css')) {
        return code.replace(/@font-face\{[^}]*src:url\([^}]+\)[^}]*\}/g, '');
      }
    },
    generateBundle(_options, bundle) {
      for (const output of Object.values(bundle)) {
        if (output.type === 'asset' && output.fileName.endsWith('.css') && typeof output.source === 'string') {
          output.source = output.source.replace(/@font-face\{[^}]*\}/g, '');
        }
      }
    },
  }, {
    name: 'github-pages-spa-fallback',
    closeBundle() {
      copyFileSync('dist/index.html', 'dist/404.html');
    },
  }],
});
