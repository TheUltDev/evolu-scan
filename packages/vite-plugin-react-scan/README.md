# @evolu-scan/vite-plugin-evolu-scan

A Vite plugin that integrates Evolu Scan into your Vite application, automatically detecting performance issues in your React components.

## Installation

```bash
# npm
npm install -D @evolu-scan/vite-plugin-evolu-scan evolu-scan

# pnpm
pnpm add -D @evolu-scan/vite-plugin-evolu-scan evolu-scan

# yarn
yarn add -D @evolu-scan/vite-plugin-evolu-scan evolu-scan
```

> **Note:** Make sure `evolu-scan` is installed as a peer dependency. The plugin will automatically locate it in your project's dependency tree.

## Usage

Add the plugin to your `vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import reactScan from '@evolu-scan/vite-plugin-evolu-scan';

export default defineConfig({
  plugins: [
    react(),
    reactScan({
      // options (optional)
    }),
  ],
});
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enable` | `boolean` | `process.env.NODE_ENV === 'development'` | Enable/disable scanning |
| `scanOptions` | `object` | `{ ... }` | Custom Evolu Scan options |
| `autoDisplayNames` | `boolean` | `false` | Automatically add display names to React components |
| `debug` | `boolean` | `false` | Enable debug logging |

## Example Configuration

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import reactScan from '@evolu-scan/vite-plugin-evolu-scan';

export default defineConfig({
  plugins: [
    react(),
    reactScan({
      enable: true,
      autoDisplayNames: true,
      scanOptions: {} // Evolu Scan specific options
    }),
  ],
});
```

## Development vs Production

- In development: The plugin injects Evolu Scan directly into your application for real-time analysis
- In production: The plugin can be disabled/enabled by default with specific options

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## License

Evolu Scan Vite Plugin is [MIT-licensed](LICENSE) open-source software by Aiden Bai, [Million Software, Inc.](https://million.dev), and [contributors](https://github.com/evoluhq/evolu-scan/graphs/contributors).
