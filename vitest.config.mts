import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, './build'],
    testTimeout: 0,
    minWorkers: 1,
    maxWorkers: 1,
  },
});
