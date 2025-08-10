import { defineConfig } from 'vite';

// Although this project does not actively use Vite during the build (it relies on
// CDN hosted React and Babel), a minimal configuration file is provided to
// satisfy the project specification. Should you choose to switch to a proper
// Vite build in the future, you can extend this file accordingly.
export default defineConfig({
  root: 'src',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
});
