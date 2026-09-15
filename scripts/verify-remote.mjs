import { spawn } from 'node:child_process';

const url = process.argv[2];
if (!url || !/^https:\/\//i.test(url)) {
  console.error('Usage: npm run verify:remote -- https://preview-url.example');
  process.exit(2);
}
const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const child = spawn(command, ['playwright', 'test', '--config=playwright.remote.config.ts'], {
  stdio: 'inherit',
  env: { ...process.env, REMOTE_BASE_URL: url.replace(/\/+$/, '') },
});
child.on('exit', code => process.exit(code ?? 1));
