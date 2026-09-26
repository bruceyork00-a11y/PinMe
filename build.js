import { build } from 'esbuild'
import { execSync } from 'child_process'
import { rmSync } from 'fs'

console.log('[PinMe] Cleaning lib/...')
rmSync('lib', { recursive: true, force: true })

console.log('[PinMe] Running TypeScript compiler (tsc)...')
execSync('npx tsc', { stdio: 'inherit' })

console.log('[PinMe] Bundling client into DSH module loader format (lib/client.js)...')
await build({
  entryPoints: ['src/client/index.ts'],
  bundle: true,
  format: 'cjs',
  outfile: 'lib/client.js',
  target: 'es2022',
  external: [
    'react',
    'react-dom',
    'react/jsx-runtime',
    '@deepseek-ai/*',
  ],
  banner: {
    js: `window.__ModuleLoader__.load({
\tid: "dsh-plugin-pinme",
\tfactory: (require) => {
\t\tvar module = { exports: {} };
\t\tvar exports = module.exports;
\t\tObject.defineProperty(exports, Symbol.toStringTag, { value: "Module" });`,
  },
  footer: {
    js: `\t\treturn module.exports;
\t}
});`,
  },
})

console.log('[PinMe] Build completed successfully!')
