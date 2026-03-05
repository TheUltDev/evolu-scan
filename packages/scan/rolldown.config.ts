import { defineConfig } from 'rolldown';
import { workerPlugin } from './worker-plugin';
import type { RolldownOptions } from 'rolldown';

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
const nodeEnv = process.env.NODE_ENV ?? 'development';
const distPath = './dist';
const sharedOptions = {
  platform: 'browser',
  tsconfig: './tsconfig.json',
  moduleTypes: {
    '.css': 'text',
  },
  external: [
    'react',
    'react-dom',
    '@evolu/sqlite-wasm',
  ],
  transform: {
    define: {
      'process.env.NODE_ENV': JSON.stringify(nodeEnv),
    },
  },
  plugins: [workerPlugin],
} satisfies Partial<RolldownOptions>;

export default defineConfig({
  ...sharedOptions,
  input: {
    index: './src/index.ts',
  },
  output: [
    {
      dir: distPath,
      format: 'esm',
      entryFileNames: '[name].mjs',
      banner,
    },
    {
      dir: distPath,
      format: 'cjs',
      entryFileNames: '[name].js',
      banner,
    },
  ],
});
