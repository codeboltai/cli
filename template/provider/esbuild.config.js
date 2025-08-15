const esbuild = require('esbuild');
const path = require('path');

async function build() {
  try {
    await esbuild.build({
      entryPoints: [path.resolve(__dirname, 'src/index.ts')],
      bundle: true,
      outfile: path.resolve(__dirname, 'dist/index.js'),
      platform: 'node',
      target: 'node18',
      format: 'cjs',
      sourcemap: false,
      minify: false,
      external: [
        // External dependencies that should not be bundled
        'dockerode',
        
        // Node.js built-in modules
        'fs',
        'path',
        'http',
        'https',
        'net',
        'tls',
        'crypto',
        'stream',
        'events',
        'util',
        'os',
        'url',
        'querystring',
        'zlib',
        'child_process',
        'dns',
        'http2',
        'assert',
        'buffer',
        'console',
        'constants',
        'domain',
        'module',
        'process',
        'punycode',
        'readline',
        'repl',
        'string_decoder',
        'sys',
        'timers',
        'tty',
        'vm',
        'worker_threads'
      ],
      define: {
        'process.env.NODE_ENV': '"production"'
      },
      loader: {
        '.ts': 'ts'
      },
      tsconfig: path.resolve(__dirname, 'tsconfig.json'),
      logLevel: 'info'
    });
    
    console.log('✅ Build completed successfully');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

build();