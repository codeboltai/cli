import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'DockerProviderAgent',
      fileName: 'index',
      formats: ['cjs']
    },
    rollupOptions: {
      // Externalize Node.js built-ins and packages with native dependencies
      external: [
        // Packages with native dependencies that can't be bundled
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
      output: {
        format: 'cjs',
        entryFileNames: 'index.js',
        inlineDynamicImports: true,
        // Bundle most dependencies, keep externals separate
        manualChunks: undefined
      }
    },
    outDir: 'dist',
    emptyOutDir: true,
    minify: true,
    sourcemap: false,
    target: 'node18',
    // Bundle compatible dependencies
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [/node_modules/],
      // Ignore native dependencies
      ignore: ['dockerode']
    }
  },
  define: {
    'process.env.NODE_ENV': '"production"'
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    },
    mainFields: ['main', 'module']
  },
  // Selective bundling - exclude packages with native dependencies
  ssr: {
    noExternal: ['ws', 'uuid', 'js-yaml', '@codebolt/shared-types']
  }
});