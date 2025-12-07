// Production launcher: runs the Next.js server build and attaches the Electron shell for packaged workflows.
import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Keep all paths relative to the script to simplify invocation.
const rootDir = path.resolve(__dirname, '..');
const isWin = process.platform === 'win32';
const npxCommand = isWin ? 'npx.cmd' : 'npx';
const electronBinary = isWin
  ? path.join(rootDir, 'node_modules', 'electron', 'dist', 'electron.exe')
  : path.join(rootDir, 'node_modules', '.bin', 'electron');
const tscScript = path.join(rootDir, 'node_modules', 'typescript', 'bin', 'tsc');
const port = process.env.PORT || '3210';
const electronEntry = path.join(rootDir, 'dist-electron', 'main.js');
const electronArgs = [electronEntry];

let electronProcess = null;
let electronStarted = false;
let resolvedUrl = process.env.NEXT_APP_URL || `http://127.0.0.1:${port}`;

// Compile Electron main/preload TypeScript into dist-electron/ before starting services.
const compileElectron = () => {
  const result = spawnSync(process.execPath, [tscScript, '-p', 'tsconfig.electron.json'], {
    cwd: rootDir,
    stdio: 'inherit'
  });
  if (result.status !== 0) {
    throw new Error('Electron TypeScript compilation failed');
  }
};

compileElectron();

// Ensure both Electron and the Next server shut down together.
const shutdown = () => {
  if (!prodServer.killed) {
    prodServer.kill('SIGINT');
  }
  if (electronProcess && !electronProcess.killed) {
    electronProcess.kill('SIGINT');
  }
  process.exit(0);
};

const launchElectron = () => {
  if (electronStarted) {
    return;
  }
  electronStarted = true;
  // Launch Electron pointed at the resolved Next.js production URL.
  electronProcess = spawn(electronBinary, electronArgs, {
    cwd: rootDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production',
      NEXT_APP_URL: resolvedUrl
    }
  });

  electronProcess.on('exit', (code) => {
    if (!prodServer.killed) {
      prodServer.kill('SIGINT');
    }
    process.exit(code ?? 0);
  });
};

// Use the Next.js CLI to serve the production build for the desktop runtime.
const prodServer = spawn(npxCommand, ['next', 'start', '--hostname', '127.0.0.1', '--port', port], {
  cwd: rootDir,
  env: {
    ...process.env,
    NODE_ENV: 'production',
    PORT: port
  },
  stdio: ['inherit', 'pipe', 'pipe']
});

prodServer.stdout.on('data', (data) => {
  const text = data.toString();
  process.stdout.write(text);
  // Capture the HTTP endpoint emitted by Next.js for Electron to consume.
  const match = text.match(/https?:\/\/[^\s]+:\d+/);
  if (match) {
    resolvedUrl = match[0];
  }
  // Start Electron when the server indicates it is serving requests.
  if (!electronStarted && /started server/i.test(text)) {
    launchElectron();
  }
});

prodServer.stderr.on('data', (data) => {
  process.stderr.write(data);
});

prodServer.on('exit', (code) => {
  if (electronProcess && !electronProcess.killed) {
    electronProcess.kill('SIGINT');
  }
  process.exit(code ?? 0);
});

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
