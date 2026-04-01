const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  outdir: 'dist',
  format: 'cjs',
}).catch(() => process.exit(1));
