import { build } from 'rolldown';
import type { Plugin } from 'rolldown';

let workerCodeCache: string | null = null;

async function getWorkerCode(): Promise<string> {
  if (workerCodeCache) return workerCodeCache;

  const result = await build({
    input: 'src/new-outlines/offscreen-canvas.worker.ts',
    platform: 'browser',
    tsconfig: './tsconfig.json',
    output: {
      format: 'iife',
      minify: true,
    },
    write: false,
  });

  const chunk = result.output.find((o) => o.type === 'chunk');
  if (!chunk) throw new Error('Worker build produced no output');
  workerCodeCache = chunk.code;
  return workerCodeCache;
}

const transformHandler = async function (code: string) {
  const workerCode = await getWorkerCode();
  if (!code.includes("'__WORKER_CODE__'")) return null;
  return {
    code: code.replace(
      "'__WORKER_CODE__'",
      JSON.stringify(workerCode),
    ),
  };
};

export const workerPlugin: Plugin = {
  name: 'worker-plugin',
  transform: {
    filter: {
      id: {
        include: [/new-outlines[/\\]index\.[tj]s$/],
      },
    },
    handler: transformHandler,
  },
};
