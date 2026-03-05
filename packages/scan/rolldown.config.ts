import * as fs from 'node:fs';
import { defineConfig, type InputOptions } from 'rolldown';
import { dts } from 'rolldown-plugin-dts';
import { workerPlugin } from './worker-plugin';

const distPath = './dist';
const license = `/**
 * The MIT License (MIT)
 * 
 * Copyright 2025 Evolu
 * Copyright 2025 Aiden Bai, Million Software, Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software
 * and associated documentation files (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge, publish, distribute,
 * sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or
 * substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
 * BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */`;

const banner = `'use client';\n${license}`;

if (fs.existsSync(distPath)) {
  fs.rmSync(distPath, { recursive: true });
}
fs.mkdirSync(distPath, { recursive: true });

const nodeEnv = process.env.NODE_ENV ?? 'development';

const sharedOptions = {
  platform: 'browser',
  tsconfig: './tsconfig.json',
  transform: {
    define: { 'process.env.NODE_ENV': JSON.stringify(nodeEnv) },
  },
  moduleTypes: { '.css': 'text' },
  external: ['react', 'react-dom', '@evolu/sqlite-wasm'],
  plugins: [workerPlugin],
} satisfies Partial<InputOptions>;

const libraryInput = {
  index: './src/index.ts',
  'core/all-environments': './src/core/all-environments.ts',
};

export default defineConfig([
  {
    ...sharedOptions,
    input: libraryInput,
    plugins: [workerPlugin, dts()],
    output: {
      dir: distPath,
      format: 'esm',
      banner,
      entryFileNames: '[name].mjs',
    },
  },
  {
    ...sharedOptions,
    input: libraryInput,
    output: {
      dir: distPath,
      format: 'cjs',
      banner,
      entryFileNames: '[name].js',
    },
  },
]);
