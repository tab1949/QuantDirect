// Build-only script invoked before packaging to transpile Electron TypeScript sources.
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve project root so the script works regardless of current working directory.
const rootDir = path.resolve(__dirname, '..');
const tscScript = path.join(rootDir, 'node_modules', 'typescript', 'bin', 'tsc');

// Use the bundled TypeScript compiler to emit JavaScript into dist-electron/.
const result = spawnSync(process.execPath, [tscScript, '-p', 'tsconfig.electron.json'], {
  cwd: rootDir,
  stdio: 'inherit'
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
