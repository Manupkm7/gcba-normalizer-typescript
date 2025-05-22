import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import dts from 'rollup-plugin-dts';
import { defineConfig } from 'rollup';

const packageJson = {
  name: 'gcba-normalizador-typescript',
  version: '2.0.0',
  author: 'USIG',
  license: 'MIT',
  description: 'Normalizador de direcciones para el AMBA',
  main: 'dist/index.js',
  module: 'dist/index.esm.js',
  types: 'dist/index.d.ts',
  files: ['dist'],
  keywords: [
    'normalizador',
    'direcciones',
    'amba',
    'buenos-aires',
    'argentina',
    'typescript',
    'usig',
    'gcba',
  ],
  peerDependencies: {
    'node-fetch': '^3.3.2',
  },
  dependencies: {
    '@usig-gcba/callejero': '1.1.1',
    '@usig-gcba/usig-core': '1.0.5',
    urijs: '^1.19.11',
  },
};

export default defineConfig([
  {
    input: 'src/index.ts',
    output: [
      {
        file: packageJson.main,
        format: 'cjs',
        sourcemap: true,
      },
      {
        file: packageJson.module,
        format: 'esm',
        sourcemap: true,
      },
    ],
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        sourceMap: true,
        declaration: true,
        declarationDir: 'dist/types',
      }),
      terser(),
    ],
    external: ['@usig-gcba/usig-core', '@usig-gcba/callejero', 'urijs', 'node-fetch'],
  },
  {
    input: 'dist/types/index.d.ts',
    output: [{ file: 'dist/index.d.ts', format: 'esm' }],
    plugins: [dts()],
    external: [/\.d\.ts$/],
  },
]);
