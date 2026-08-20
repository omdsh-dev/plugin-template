import { defineConfig } from 'tsdown'

/**
 * Build the published host entries directly from `src/`. TypeScript performs
 * the separate no-emit checks; tsdown owns runtime and declaration output.
 */
export default defineConfig({
  entry: {
    index: 'src/index.ts',
    invariant: 'src/invariant.ts',
  },
  outDir: 'lib',
  format: ['esm'],
  platform: 'node',
  target: 'es2024',
  fixedExtension: false,
  dts: true,
  clean: true,
  deps: { dts: { neverBundle: true } },
  tsconfig: 'tsconfig.json',
})
