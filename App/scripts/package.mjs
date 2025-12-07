// Packaging orchestrator: builds the web app, emits Electron assets, and invokes electron-builder.
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Centralise path resolution to keep the script portable.
const rootDir = path.resolve(__dirname, '..');
const nextCli = path.join(rootDir, 'node_modules', 'next', 'dist', 'bin', 'next');
const buildElectronScript = path.join(rootDir, 'scripts', 'build-electron.mjs');
const electronBuilderCli = path.join(rootDir, 'node_modules', 'electron-builder', 'out', 'cli', 'cli.js');

function runStep(label, command, args, extraEnv = {}) {
  console.log(`• ${label}`);
  // Each step runs synchronously so failures halt the pipeline immediately.
  const result = spawnSync(command, args, {
    cwd: rootDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      ...extraEnv,
    },
  });

  if (result.status !== 0) {
    console.error(`✖ Failed: ${label}`);
    process.exit(result.status ?? 1);
  }
}

// 1) Build the Next.js app with export mode enabled for static assets.
runStep('Building Next.js for static export', process.execPath, [nextCli, 'build', '--turbopack'], {
  NEXT_APP_EXPORT: 'true',
});

// 2) Transpile Electron sources using the shared build script.
runStep('Compiling Electron TypeScript', process.execPath, [buildElectronScript]);

// 3) Package everything into an installer via electron-builder.
runStep('Packaging Electron application', process.execPath, [electronBuilderCli]);

console.log('✓ Electron package created successfully.');
