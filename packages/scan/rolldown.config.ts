import * as fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'rolldown';
import { dts } from 'rolldown-plugin-dts';
import { workerPlugin } from './worker-plugin';

const DIST_PATH = './dist';

const addDirectivesToChunkFiles = async (readPath: string): Promise<void> => {
  const fsPromise = await import('node:fs/promises');
  try {
    const files = await fsPromise.readdir(readPath, { recursive: true });
    for (const file of files) {
      const fileName = String(file);
      if (!fileName.endsWith('.mjs') && !fileName.endsWith('.js')) continue;
      if (fileName.endsWith('.global.js')) continue;
      const filePath = path.join(readPath, fileName);
      const stat = await fsPromise.stat(filePath);
      if (!stat.isFile()) continue;
      const data = await fsPromise.readFile(filePath, 'utf8');
      const updatedContent = `'use client';\n${data}`;
      await fsPromise.writeFile(filePath, updatedContent, 'utf8');
    }
  } catch (err) {
    // oxlint-disable-next-line no-console
    console.error('Error:', err);
  }
};

const banner = `/**
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

if (fs.existsSync(DIST_PATH)) {
  fs.rmSync(DIST_PATH, { recursive: true });
}
fs.mkdirSync(DIST_PATH, { recursive: true });

const nodeEnv = process.env.NODE_ENV ?? 'development';
const isProduction = nodeEnv === 'production';

const envDefine = {
  'process.env.NODE_ENV': JSON.stringify(nodeEnv),
};

const sharedExternal = [
  'react',
  'react-dom',
  'next',
  'next/navigation',
  'react-router',
  'react-router-dom',
  '@evolu/sqlite-wasm',
];

export default defineConfig([
  {
    input: './src/install-hook.ts',
    platform: 'browser',
    tsconfig: './tsconfig.json',
    transform: { define: envDefine },
    moduleTypes: {
      '.css': 'text',
    },
    external: sharedExternal,
    plugins: [workerPlugin],
    output: {
      file: `${DIST_PATH}/install-hook.global.js`,
      format: 'iife',
      name: 'evoluScanInstallHook',
      banner,
      minify: isProduction,
    },
  },
  {
    input: {
      index: './src/index.ts',
      'install-hook': './src/install-hook.ts',
      'core/all-environments': './src/core/all-environments.ts',
    },
    platform: 'browser',
    tsconfig: './tsconfig.json',
    transform: { define: envDefine },
    moduleTypes: {
      '.css': 'text',
    },
    external: sharedExternal,
    plugins: [workerPlugin, dts()],
    output: {
      dir: DIST_PATH,
      format: 'esm',
      banner,
      entryFileNames: '[name].mjs',
    },
  },
  {
    input: {
      index: './src/index.ts',
      'install-hook': './src/install-hook.ts',
      'core/all-environments': './src/core/all-environments.ts',
    },
    platform: 'browser',
    tsconfig: './tsconfig.json',
    transform: { define: envDefine },
    moduleTypes: {
      '.css': 'text',
    },
    external: sharedExternal,
    plugins: [
      workerPlugin,
      {
        name: 'add-use-client',
        async writeBundle() {
          await addDirectivesToChunkFiles(DIST_PATH);
        },
      },
    ],
    output: {
      dir: DIST_PATH,
      format: 'cjs',
      banner,
      entryFileNames: '[name].js',
    },
  },
]);
