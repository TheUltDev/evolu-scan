# Astro Guide

## As a script tag

Add the script tag to your root layout.

Refer to the [CDN Guide](https://github.com/evoluhq/evolu-scan/blob/main/docs/installation/cdn.md) for the available URLs.

```astro
<!doctype html>
<html lang="en">
  <head>
    <script is:inline src="https://unpkg.com/evolu-scan/dist/auto.global.js" />

    <!-- rest of your scripts go under -->
  </head>
  <body>
    <!-- ... -->
  </body>
</html>
```

## As a module import

Add the script to your root layout

```astro
<!doctype html>
<html lang="en">
  <head>
    <script>
      import { scan } from 'evolu-scan';

      scan({
        enabled: true,
      });
    </script>
    <!-- rest of your scripts go under -->
  </head>
  <body>
    <!-- ... -->
  </body>
</html>
```

If you want evolu-scan to also run in production, use the evolu-scan/all-environments import path
```diff
- import { scan } from "evolu-scan";
+ import { scan } from "evolu-scan/all-environments";
```
