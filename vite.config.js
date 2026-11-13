import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Relative base: works at a domain root, on a GitHub Pages subpath, or a custom domain.
  base: './',
  // Changes on every build; appended to data files (e.g. AR targets) so phones
  // never keep a stale cached copy after a redeploy.
  define: { __BUILD_ID__: JSON.stringify(Date.now().toString(36)) },
  plugins: [react(), tailwindcss()],
  build: {
    target: 'es2020',
    // The MindAR tracking engine is a large, lazily-loaded chunk (AR Lens only).
    chunkSizeWarningLimit: 2500,
  },
});
