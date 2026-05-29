import { spawn } from 'node:child_process';

const hostIndex = process.argv.indexOf('--host');
const host = hostIndex >= 0 ? process.argv[hostIndex + 1] : undefined;

const children = [];

function run(name, command, args, options = {}) {
  const child = spawn(command, args, {
    stdio: 'inherit',
    env: { ...process.env, ...options.env },
  });

  children.push(child);

  child.on('exit', (code, signal) => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    for (const other of children) {
      if (other !== child && !other.killed) {
        other.kill('SIGTERM');
      }
    }

    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });

  child.on('error', (error) => {
    console.error(`${name} failed to start: ${error.message}`);
    process.exit(1);
  });
}

let shuttingDown = false;

process.on('SIGINT', stopChildren);
process.on('SIGTERM', stopChildren);

run('api', 'node', ['server/index.mjs'], {
  env: host ? { VALIDATION_API_HOST: host } : {},
});

const viteArgs = ['vite', '--port', '5177', '--strictPort'];
if (host) {
  viteArgs.push('--host', host);
}
run('web', 'pnpm', viteArgs);

function stopChildren() {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) {
      child.kill('SIGTERM');
    }
  }
}
