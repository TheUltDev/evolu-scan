# NextJS App Router Guide

## As a script tag

Add the script tag to your `app/layout`.

Refer to the [CDN Guide](https://github.com/evoluhq/evolu-scan/blob/main/docs/installation/cdn.md) for the available URLs.

```jsx
// app/layout
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script src="https://unpkg.com/evolu-scan/dist/auto.global.js" />
        {/* rest of your scripts go under */}
      </head>
      <body>{children}</body>
    </html>
  );
}
```

## As a module import

Create a `<ReactScan>` client component:

```jsx
// path/to/ReactScanComponent

"use client";
// evolu-scan must be imported before react
import { scan } from "evolu-scan";
import { JSX, useEffect } from "react";

export function ReactScan(): JSX.Element {
  useEffect(() => {
    scan({
      enabled: true,
    });
  }, []);

  return <></>;
}
```

Import the `<ReactScan>` component into `app/layout`:

```jsx
// app/layout

// This component must be the top-most import in this file!
import { ReactScan } from "path/to/ReactScanComponent";

// ...

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <ReactScan />
      <body>{children}</body>
    </html>
  );
}
```

If you want evolu-scan to also run in production, use the evolu-scan/all-environments import path
```diff
- import { scan } from "evolu-scan";
+ import { scan } from "evolu-scan/all-environments";
```