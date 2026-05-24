import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const SHA = env.GIT_COMMIT || env.CI_COMMIT_SHA || `dev${Date.now()}`;

  return {
    plugins: [react()],
    define: {
      'process.env.WS_URL': JSON.stringify(env.WS_URL || ''),
    },
    ...(command === 'build' && mode !== 'standalone' && {
      build: {
        lib: {
          entry: 'src/index.jsx',
          formats: ['es'],
          fileName: () => 'index.js',
        },
        rollupOptions: {
          external: ['react', 'react-dom', 'react-dom/client', 'single-spa-react'],
        },
        outDir: `dist/micro-apps/template-websocket-mfe/${SHA}`,
        emptyOutDir: true,
      },
    }),
    ...(command === 'build' && mode === 'standalone' && {
      build: {
        outDir: 'dist/standalone',
        emptyOutDir: true,
      },
    }),
    server: {
      port: 9090,
    },
  };
});
