import { defineConfig } from 'vitest/config';

export default defineConfig(() => ({
  resolve: {
    tsconfigPaths: true,
  },
  root: import.meta.dirname,
  cacheDir: '../../../node_modules/.vite/libs/cart/domain',
  test: {
    name: 'cart-domain',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../../coverage/libs/cart/domain',
      provider: 'v8' as const,
      reporter: ['text', ['lcov', { projectRoot: `${import.meta.dirname}/../../..` }]],
    },
  },
}));
