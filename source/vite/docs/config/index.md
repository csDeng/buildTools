# Configuring Vite

## Config File

### Config File Resolving

When running `vite` from the command line, Vite will automatically try to resolve a config file named `vite.config.js` inside [project root](/guide/#index-html-and-project-root).

The most basic config file looks like this:

```js
// vite.config.js
export default {
  // config options
}
```

Note Vite supports using ES modules syntax in the config file even if the project is not using native Node ESM via `type: "module"`. In this case, the config file is auto pre-processed before load.

You can also explicitly specify a config file to use with the `--config` CLI option (resolved relative to `cwd`):

```bash
vite --config my-config.js
```

### Config Intellisense

Since Vite ships with TypeScript typings, you can leverage your IDE's intellisense with jsdoc type hints:

```js
/**
 * @type {import('vite').UserConfig}
 */
const config = {
  // ...
}

export default config
```

Alternatively, you can use the `defineConfig` helper which should provide intellisense without the need for jsdoc annotations:

```js
import { defineConfig } from 'vite'

export default defineConfig({
  // ...
})
```

Vite also directly supports TS config files. You can use `vite.config.ts` with the `defineConfig` helper as well.

### Conditional Config

If the config needs to conditional determine options based on the command (`serve` or `build`) or the [mode](/guide/env-and-mode) being used, it can export a function instead:

```js
export default defineConfig(({ command, mode }) => {
  if (command === 'serve') {
    return {
      // serve specific config
    }
  } else {
    return {
      // build specific config
    }
  }
})
```

### Async Config

If the config needs to call async function, it can export a async function instead:

```js
export default defineConfig(async ({ command, mode }) => {
  const data = await asyncFunction()
  return {
    // build specific config
  }
})
```

## Shared Options

### root

- **Type:** `string`
- **Default:** `process.cwd()`

  Project root directory (where `index.html` is located). Can be an absolute path, or a path relative to the location of the config file itself.

  See [Project Root](/guide/#index-html-and-project-root) for more details.

### base

- **Type:** `string`
- **Default:** `/`

  Base public path when served in development or production. Valid values include:

  - Absolute URL pathname, e.g. `/foo/`
  - Full URL, e.g. `https://foo.com/`
  - Empty string or `./` (for embedded deployment)

  See [Public Base Path](/guide/build#public-base-path) for more details.

### mode

- **Type:** `string`
- **Default:** `'development'` for serve, `'production'` for build

  Specifying this in config will override the default mode for **both serve and build**. This value can also be overridden via the command line `--mode` option.

  See [Env Variables and Modes](/guide/env-and-mode) for more details.

### define

- **Type:** `Record<string, string>`

  Define global constant replacements. Entries will be defined as globals during dev and statically replaced during build.

  - Starting from `2.0.0-beta.70`, string values will be used as raw expressions, so if defining a string constant, it needs to be explicitly quoted (e.g. with `JSON.stringify`).

  - Replacements are performed only when the match is surrounded by word boundaries (`\b`).

  Because it's implemented as straightforward text replacements without any syntax analysis, we recommend using `define` for CONSTANTS only.

  For example, `process.env.FOO` and `__APP_VERSION__` are good fits. But `process` or `global` should not be put into this option. Variables can be shimmed or polyfilled instead.

### plugins

- **Type:** ` (Plugin | Plugin[])[]`

  Array of plugins to use. Falsy plugins are ignored and arrays of plugins are flattened. See [Plugin API](/guide/api-plugin) for more details on Vite plugins.

### publicDir

- **Type:** `string | false`
- **Default:** `"public"`

  Directory to serve as plain static assets. Files in this directory are served at `/` during dev and copied to the root of `outDir` during build, and are always served or copied as-is without transform. The value can be either an absolute file system path or a path relative to project root.

  Defining `publicDir` as `false` disables this feature.

  See [The `public` Directory](/guide/assets#the-public-directory) for more details.

### cacheDir

- **Type:** `string`
- **Default:** `"node_modules/.vite"`

  Directory to save cache files. Files in this directory are pre-bundled deps or some other cache files generated by vite, which can improve the performance. You can use `--force` flag or manually delete the directory to regenerate the cache files. The value can be either an absolute file system path or a path relative to project root.

### resolve.alias

- **Type:**
  `Record<string, string> | Array<{ find: string | RegExp, replacement: string }>`

  Will be passed to `@rollup/plugin-alias` as its [entries option](https://github.com/rollup/plugins/tree/master/packages/alias#entries). Can either be an object, or an array of `{ find, replacement }` pairs.

  When aliasing to file system paths, always use absolute paths. Relative alias values will be used as-is and will not be resolved into file system paths.

  More advanced custom resolution can be achieved through [plugins](/guide/api-plugin).

### resolve.dedupe

- **Type:** `string[]`

  If you have duplicated copies of the same dependency in your app (likely due to hoisting or linked packages in monorepos), use this option to force Vite to always resolve listed dependencies to the same copy (from project root).

### resolve.conditions

- **Type:** `string[]`

  Additional allowed conditions when resolving [Conditional Exports](https://nodejs.org/api/packages.html#packages_conditional_exports) from a package.

  A package with conditional exports may have the following `exports` field in its `package.json`:

  ```json
  {
    "exports": {
      ".": {
        "import": "./index.esm.js",
        "require": "./index.cjs.js"
      }
    }
  }
  ```

  Here, `import` and `require` are "conditions". Conditions can be nested and should be specified from most specific to least specific.

  Vite has a list of "allowed conditions" and will match the first condition that is in the allowed list. The default allowed conditions are: `import`, `module`, `browser`, `default`, and `production/development` based on current mode. The `resolve.conditions` config option allows specifying additional allowed conditions.

### resolve.mainFields

- **Type:** `string[]`
- **Default:** `['module', 'jsnext:main', 'jsnext']`

  List of fields in `package.json` to try when resolving a package's entry point. Note this takes lower precedence than conditional exports resolved from the `exports` field: if an entry point is successfully resolved from `exports`, the main field will be ignored.

### resolve.extensions

- **Type:** `string[]`
- **Default:** `['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']`

  List of file extensions to try for imports that omit extensions. Note it is **NOT** recommended to omit extensions for custom import types (e.g. `.vue`) since it can interfere with IDE and type support.

### css.modules

- **Type:**

  ```ts
  interface CSSModulesOptions {
    scopeBehaviour?: 'global' | 'local'
    globalModulePaths?: RegExp[]
    generateScopedName?:
      | string
      | ((name: string, filename: string, css: string) => string)
    hashPrefix?: string
    /**
     * default: 'camelCaseOnly'
     */
    localsConvention?: 'camelCase' | 'camelCaseOnly' | 'dashes' | 'dashesOnly'
  }
  ```

  Configure CSS modules behavior. The options are passed on to [postcss-modules](https://github.com/css-modules/postcss-modules).

### css.postcss

- **Type:** `string | (postcss.ProcessOptions & { plugins?: postcss.Plugin[] })`

  Inline PostCSS config (expects the same format as `postcss.config.js`), or a custom path to search PostCSS config from (default is project root). The search is done using [postcss-load-config](https://github.com/postcss/postcss-load-config).

  Note if an inline config is provided, Vite will not search for other PostCSS config sources.

### css.preprocessorOptions

- **Type:** `Record<string, object>`

  Specify options to pass to CSS pre-processors. Example:

  ```js
  export default defineConfig({
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `$injectedColor: orange;`
        }
      }
    }
  })
  ```

### json.namedExports

- **Type:** `boolean`
- **Default:** `true`

  Whether to support named imports from `.json` files.

### json.stringify

- **Type:** `boolean`
- **Default:** `false`

  If set to `true`, imported JSON will be transformed into `export default JSON.parse("...")` which is significantly more performant than Object literals, especially when the JSON file is large.

  Enabling this disables named imports.

### esbuild

- **Type:** `ESBuildOptions | false`

  `ESBuildOptions` extends [ESbuild's own transform options](https://esbuild.github.io/api/#transform-api). The most common use case is customizing JSX:

  ```js
  export default defineConfig({
    esbuild: {
      jsxFactory: 'h',
      jsxFragment: 'Fragment'
    }
  })
  ```

  By default, ESBuild is applied to `ts`, `jsx` and `tsx` files. You can customize this with `esbuild.include` and `esbuild.exclude`, both of which expect type of `string | RegExp | (string | RegExp)[]`.

  In addition, you can also use `esbuild.jsxInject` to automatically inject JSX helper imports for every file transformed by ESBuild:

  ```js
  export default defineConfig({
    esbuild: {
      jsxInject: `import React from 'react'`
    }
  })
  ```

  Set to `false` to disable ESbuild transforms.

### assetsInclude

- **Type:** `string | RegExp | (string | RegExp)[]`
- **Related:** [Static Asset Handling](/guide/assets)

  Specify additional file types to be treated as static assets so that:

  - They will be excluded from the plugin transform pipeline when referenced from HTML or directly requested over `fetch` or XHR.

  - Importing them from JS will return their resolved URL string (this can be overwritten if you have a `enforce: 'pre'` plugin to handle the asset type differently).

  The built-in asset type list can be found [here](https://github.com/vitejs/vite/blob/main/packages/vite/src/node/constants.ts).

### logLevel

- **Type:** `'info' | 'warn' | 'error' | 'silent'`

  Adjust console output verbosity. Default is `'info'`.

### clearScreen

- **Type:** `boolean`
- **Default:** `true`

  Set to `false` to prevent Vite from clearing the terminal screen when logging certain messages. Via command line, use `--clearScreen false`.

### envDir

- **Type:** `string`
- **Default:** `root`

  The directory from which `.env` files are loaded. Can be an absolute path, or a path relative to the project root.

  See [here](/guide/env-and-mode#env-files) for more about environment files.

### envPrefix

- **Type:** `string | string[]`
- **Default:** `VITE_`

  Env variables starts with `envPrefix` will be exposed to your client source code via import.meta.env.

:::warning SECURITY NOTES

- `envPrefix` should not be set as `''`, which will expose all your env variables and cause unexpected leaking of of sensitive information. Vite will throw error when detecting `''`.
  :::

## Server Options

### server.host

- **Type:** `string`
- **Default:** `'127.0.0.1'`

  Specify which IP addresses the server should listen on.
  Set this to `0.0.0.0` to listen on all addresses, including LAN and public addresses.

  This can be set via the CLI using `--host 0.0.0.0` or `--host`.

### server.port

- **Type:** `number`

  Specify server port. Note if the port is already being used, Vite will automatically try the next available port so this may not be the actual port the server ends up listening on.

### server.strictPort

- **Type:** `boolean`

  Set to `true` to exit if port is already in use, instead of automatically try the next available port.

### server.https

- **Type:** `boolean | https.ServerOptions`

  Enable TLS + HTTP/2. Note this downgrades to TLS only when the [`server.proxy` option](#server-proxy) is also used.

  The value can also be an [options object](https://nodejs.org/api/https.html#https_https_createserver_options_requestlistener) passed to `https.createServer()`.

### server.open

- **Type:** `boolean | string`

  Automatically open the app in the browser on server start. When the value is a string, it will be used as the URL's pathname. If you want to open the server in a specific browser you like, you can set the env `process.env.BROWSER` (e.g. `firefox`). See [the `open` package](https://github.com/sindresorhus/open#app) for more details.

  **Example:**

  ```js
  export default defineConfig({
    server: {
      open: '/docs/index.html'
    }
  })
  ```

### server.proxy

- **Type:** `Record<string, string | ProxyOptions>`

  Configure custom proxy rules for the dev server. Expects an object of `{ key: options }` pairs. If the key starts with `^`, it will be interpreted as a `RegExp`. The `configure` option can be used to access the proxy instance.

  Uses [`http-proxy`](https://github.com/http-party/node-http-proxy). Full options [here](https://github.com/http-party/node-http-proxy#options).

  **Example:**

  ```js
  export default defineConfig({
    server: {
      proxy: {
        // string shorthand
        '/foo': 'http://localhost:4567',
        // with options
        '/api': {
          target: 'http://jsonplaceholder.typicode.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        },
        // with RegEx
        '^/fallback/.*': {
          target: 'http://jsonplaceholder.typicode.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/fallback/, '')
        },
        // Using the proxy instance
        '/api': {
          target: 'http://jsonplaceholder.typicode.com',
          changeOrigin: true,
          configure: (proxy, options) => {
            // proxy will be an instance of 'http-proxy'
          }
        }
      }
    }
  })
  ```

### server.cors

- **Type:** `boolean | CorsOptions`

  Configure CORS for the dev server. This is enabled by default and allows any origin. Pass an [options object](https://github.com/expressjs/cors) to fine tune the behavior or `false` to disable.

### server.force

- **Type:** `boolean`
- **Related:** [Dependency Pre-Bundling](/guide/dep-pre-bundling)

  Set to `true` to force dependency pre-bundling.

### server.hmr

- **Type:** `boolean | { protocol?: string, host?: string, port?: number, path?: string, timeout?: number, overlay?: boolean, clientPort?: number, server?: Server }`

  Disable or configure HMR connection (in cases where the HMR websocket must use a different address from the http server).

  Set `server.hmr.overlay` to `false` to disable the server error overlay.

  `clientPort` is an advanced option that overrides the port only on the client side, allowing you to serve the websocket on a different port than the client code looks for it on. Useful if you're using an SSL proxy in front of your dev server.

  When using `server.middlewareMode` and `server.https`, setting `server.hmr.server` to your HTTPS server will process HMR secure connection requests through your server. This can be helpful when using self-signed certificates.

### server.watch

- **Type:** `object`

  File system watcher options to pass on to [chokidar](https://github.com/paulmillr/chokidar#api).

  When running Vite on Windows Subsystem for Linux (WSL) 2, if the project folder resides in a Windows filesystem, you'll need to set this option to `{ usePolling: true }`. This is due to [a WSL2 limitation](https://github.com/microsoft/WSL/issues/4739) with the Windows filesystem.

### server.middlewareMode

- **Type:** `'ssr' | 'html'`

  Create Vite server in middleware mode. (without a HTTP server)

  - `'ssr'` will disable Vite's own HTML serving logic so that you should serve `index.html` manually.
  - `'html'` will enable Vite's own HTML serving logic.

- **Related:** [SSR - Setting Up the Dev Server](/guide/ssr#setting-up-the-dev-server)

- **Example:**

```js
const express = require('express')
const { createServer: createViteServer } = require('vite')

async function createServer() {
  const app = express()

  // Create vite server in middleware mode.
  const vite = await createViteServer({
    server: { middlewareMode: 'ssr' }
  })
  // Use vite's connect instance as middleware
  app.use(vite.middlewares)

  app.use('*', async (req, res) => {
    // If `middlewareMode` is `'ssr'`, should serve `index.html` here.
    // If `middlewareMode` is `'html'`, there is no need to serve `index.html`
    // because Vite will do that.
  })
}

createServer()
```

### server.fs.strict

- **Experimental**
- **Type:** `boolean`
- **Default:** `false` (will change to `true` in future versions)

  Restrict serving files outside of workspace root.

### server.fs.allow

- **Experimental**
- **Type:** `string[]`

  Restrict files that could be served via `/@fs/`. When `server.fs.strict` is set to `true`, accessing files outside this directory list will result in a 403.

  Vite will search for the root of the potential workspace and use it as default. A valid workspace met the following conditions, otherwise will fallback to the [project root](/guide/#index-html-and-project-root).

  - contains `workspaces` field in `package.json`
  - contains one of the following file
    - `pnpm-workspace.yaml`

  Accepts a path to specify the custom workspace root. Could be a absolute path or a path relative to [project root](/guide/#index-html-and-project-root). For example

  ```js
  export default defineConfig({
    server: {
      fs: {
        // Allow serving files from one level up to the project root
        allow: ['..']
      }
    }
  })
  ```

## Build Options

### build.target

- **Type:** `string | string[]`
- **Default:** `'modules'`
- **Related:** [Browser Compatibility](/guide/build#browser-compatibility)

  Browser compatibility target for the final bundle. The default value is a Vite special value, `'modules'`, which targets [browsers with native ES module support](https://caniuse.com/es6-module).

  Another special value is `'esnext'` - which assumes native dynamic imports support and will transpile as little as possible:

  - If the [`build.minify`](#build-minify) option is `'terser'` (the default), `'esnext'` will be forced down to `'es2019'`.
  - In other cases, it will perform no transpilation at all.

  The transform is performed with esbuild and the value should be a valid [esbuild target option](https://esbuild.github.io/api/#target). Custom targets can either be a ES version (e.g. `es2015`), a browser with version (e.g. `chrome58`), or an array of multiple target strings.

  Note the build will fail if the code contains features that cannot be safely transpiled by esbuild. See [esbuild docs](https://esbuild.github.io/content-types/#javascript) for more details.

### build.polyfillModulePreload

- **Type:** `boolean`
- **Default:** `true`

  Whether to automatically inject [module preload polyfill](https://guybedford.com/es-module-preloading-integrity#modulepreload-polyfill).

  If set to `true`, the polyfill is auto injected into the proxy module of each `index.html` entry. If the build is configured to use a non-html custom entry via `build.rollupOptions.input`, then it is necessary to manually import the polyfill in your custom entry:

  ```js
  import 'vite/modulepreload-polyfill'
  ```

  Note: the polyfill does **not** apply to [Library Mode](/guide/build#library-mode). If you need to support browsers without native dynamic import, you should probably avoid using it in your library.

### build.outDir

- **Type:** `string`
- **Default:** `dist`

  Specify the output directory (relative to [project root](/guide/#index-html-and-project-root)).

### build.assetsDir

- **Type:** `string`
- **Default:** `assets`

  Specify the directory to nest generated assets under (relative to `build.outDir`).

### build.assetsInlineLimit

- **Type:** `number`
- **Default:** `4096` (4kb)

  Imported or referenced assets that are smaller than this threshold will be inlined as base64 URLs to avoid extra http requests. Set to `0` to disable inlining altogether.

  ::: tip Note
  If you specify `build.lib`, `build.assetsInlineLimit` will be ignored and assets will always be inlined, regardless of file size.
  :::

### build.cssCodeSplit

- **Type:** `boolean`
- **Default:** `true`

  Enable/disable CSS code splitting. When enabled, CSS imported in async chunks will be inlined into the async chunk itself and inserted when the chunk is loaded.

  If disabled, all CSS in the entire project will be extracted into a single CSS file.

### build.sourcemap

- **Type:** `boolean | 'inline' | 'hidden'`
- **Default:** `false`

  Generate production source maps. If `true`, a separate sourcemap file will be created. If `'inline'`, the sourcemap will be appended to the resulting output file as a data URI. `'hidden'` works like `true` except that the corresponding sourcemap comments in the bundled files are suppressed.

### build.rollupOptions

- **Type:** [`RollupOptions`](https://rollupjs.org/guide/en/#big-list-of-options)

  Directly customize the underlying Rollup bundle. This is the same as options that can be exported from a Rollup config file and will be merged with Vite's internal Rollup options. See [Rollup options docs](https://rollupjs.org/guide/en/#big-list-of-options) for more details.

### build.commonjsOptions

- **Type:** [`RollupCommonJSOptions`](https://github.com/rollup/plugins/tree/master/packages/commonjs#options)

  Options to pass on to [@rollup/plugin-commonjs](https://github.com/rollup/plugins/tree/master/packages/commonjs).

### build.dynamicImportVarsOptions

- **Type:** [`RollupDynamicImportVarsOptions`](https://github.com/rollup/plugins/tree/master/packages/dynamic-import-vars#options)

  Options to pass on to [@rollup/plugin-dynamic-import-vars](https://github.com/rollup/plugins/tree/master/packages/dynamic-import-vars).

### build.lib

- **Type:** `{ entry: string, name?: string, formats?: ('es' | 'cjs' | 'umd' | 'iife')[], fileName?: string | ((format: ModuleFormat) => string) }`
- **Related:** [Library Mode](/guide/build#library-mode)

  Build as a library. `entry` is required since the library cannot use HTML as entry. `name` is the exposed global variable and is required when `formats` includes `'umd'` or `'iife'`. Default `formats` are `['es', 'umd']`. `fileName` is the name of the package file output, default `fileName` is the name option of package.json, it can also be defined as function taking the `format` as an argument.

### build.manifest

- **Type:** `boolean`
- **Default:** `false`
- **Related:** [Backend Integration](/guide/backend-integration)

  When set to `true`, the build will also generate a `manifest.json` file that contains a mapping of non-hashed asset filenames to their hashed versions, which can then be used by a server framework to render the correct asset links.

### build.minify

- **Type:** `boolean | 'terser' | 'esbuild'`
- **Default:** `'terser'`

  Set to `false` to disable minification, or specify the minifier to use. The default is [Terser](https://github.com/terser/terser) which is slower but produces smaller bundles in most cases. Esbuild minification is significantly faster but will result in slightly larger bundles.

### build.terserOptions

- **Type:** `TerserOptions`

  Additional [minify options](https://terser.org/docs/api-reference#minify-options) to pass on to Terser.

### build.write

- **Type:** `boolean`
- **Default:** `true`

  Set to `false` to disable writing the bundle to disk. This is mostly used in [programmatic `build()` calls](/guide/api-javascript#build) where further post processing of the bundle is needed before writing to disk.

### build.emptyOutDir

- **Type:** `boolean`
- **Default:** `true` if `outDir` is inside `root`

  By default, Vite will empty the `outDir` on build if it is inside project root. It will emit a warning if `outDir` is outside of root to avoid accidentially removing important files. You can explicitly set this option to suppress the warning. This is also available via command line as `--emptyOutDir`.

### build.brotliSize

- **Type:** `boolean`
- **Default:** `true`

  Enable/disable brotli-compressed size reporting. Compressing large output files can be slow, so disabling this may increase build performance for large projects.

### build.chunkSizeWarningLimit

- **Type:** `number`
- **Default:** `500`

  Limit for chunk size warnings (in kbs).

### build.watch

- **Type:** [`WatcherOptions`](https://rollupjs.org/guide/en/#watch-options)`| null`
- **Default:** `null`

  Set to `{}` to enable rollup watcher. This is mostly used in cases that involve build-only plugins or integrations processes.

## Dep Optimization Options

- **Related:** [Dependency Pre-Bundling](/guide/dep-pre-bundling)

### optimizeDeps.entries

- **Type:** `string | string[]`

  By default, Vite will crawl your index.html to detect dependencies that need to be pre-bundled. If build.rollupOptions.input is specified, Vite will crawl those entry points instead.

  If neither of these fit your needs, you can specify custom entries using this option - the value should be a [fast-glob pattern](https://github.com/mrmlnc/fast-glob#basic-syntax) or array of patterns that are relative from vite project root. This will overwrite default entries inference.

### optimizeDeps.exclude

- **Type:** `string[]`

  Dependencies to exclude from pre-bundling.

  :::warning CommonJS
  CommonJS dependencies should not be excluded from optimization. If an ESM dependency has a nested CommonJS dependency, it should not be excluded as well.
  :::

### optimizeDeps.include

- **Type:** `string[]`

  By default, linked packages not inside `node_modules` are not pre-bundled. Use this option to force a linked package to be pre-bundled.

### optimizeDeps.keepNames

- **Type:** `boolean`
- **Default:** `false`

  The bundler sometimes needs to rename symbols to avoid collisions.
  Set this to `true` to keep the `name` property on functions and classes.
  See [`keepNames`](https://esbuild.github.io/api/#keep-names).

## SSR Options

:::warning Experimental
SSR options may be adjusted in minor releases.
:::

- **Related:** [SSR Externals](/guide/ssr#ssr-externals)

### ssr.external

- **Type:** `string[]`

  Force externalize dependencies for SSR.

### ssr.noExternal

- **Type:** `string | RegExp | (string | RegExp)[] | true`

  Prevent listed dependencies from being externalized for SSR. If `true`, no dependencies are externalized.

### ssr.target

- **Type:** `'node' | 'webworker'`
- **Default:** `node`

  Build target for the SSR server.