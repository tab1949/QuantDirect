// Development launcher: rebuilds Electron, starts Next.js dev server, then opens the desktop shell.
import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve project paths relative to this script.
const rootDir = path.resolve(__dirname, '..');
const port = process.env.PORT || '3000';
const isWin = process.platform === 'win32';
const electronBinary = isWin
  ? path.join(rootDir, 'node_modules', 'electron', 'dist', 'electron.exe')
  : path.join(rootDir, 'node_modules', '.bin', 'electron');
const tscScript = path.join(rootDir, 'node_modules', 'typescript', 'bin', 'tsc');
const nextScript = path.join(rootDir, 'node_modules', 'next', 'dist', 'bin', 'next');
const electronEntry = path.join(rootDir, 'dist-electron', 'main.js');
const electronArgs = [electronEntry];

// Ensure the Electron main process code is up to date before launching.
const compileElectron = () => {
  const result = spawnSync(process.execPath, [tscScript, '-p', 'tsconfig.electron.json'], {
    cwd: rootDir,
    stdio: 'inherit'
  });
  if (result.status !== 0) {
    throw new Error('Electron TypeScript compilation failed');
  }
};

let electronProcess = null;
let electronStarted = false;
let pendingUrl = `http://localhost:${port}`;

compileElectron();

// Gracefully stop both processes when the user exits.
const shutdown = () => {
  if (!devServer.killed) {
    devServer.kill('SIGINT');
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
  console.log('Launching Electron:', electronBinary, electronArgs.join(' '));
  try {
    // Spawn the Electron shell pointing at the freshly compiled entry file.
    electronProcess = spawn(electronBinary, electronArgs, {
      cwd: rootDir,
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'development',
        NEXT_APP_URL: pendingUrl
      }
    });
  } catch (error) {
    console.error('Failed to spawn Electron process:', error);
    throw error;
  }

  electronProcess.on('error', (error) => {
    console.error('Electron failed to start:', error);
  });

  electronProcess.on('exit', (code) => {
    if (!devServer.killed) {
      devServer.kill('SIGINT');
    }
    process.exit(code ?? 0);
  });
};

// Start the Next.js dev server directly via its CLI so it shares the same Node runtime.
const devServer = spawn(process.execPath, [nextScript, 'dev', '--turbopack', '--hostname', '127.0.0.1', '--port', port], {
  cwd: rootDir,
  env: {
    ...process.env,
    NODE_ENV: 'development',
    PORT: port
  },
  stdio: ['inherit', 'pipe', 'pipe']
});

devServer.stdout.on('data', (data) => {
  const text = data.toString();
  process.stdout.write(text);
  // Capture the dev server URL so Electron knows where to load the app from.
  const match = text.match(/https?:\/\/[^\s]+:\d+/);
  if (match) {
    pendingUrl = match[0];
  }
  // Launch Electron once Next.js signals readiness.
  if (!electronStarted && /ready/i.test(text)) {
    launchElectron();
  }
});

devServer.stderr.on('data', (data) => {
  process.stderr.write(data);
});

devServer.on('exit', (code) => {
  if (electronProcess && !electronProcess.killed) {
    electronProcess.kill('SIGINT');
  }
  process.exit(code ?? 0);
});

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
