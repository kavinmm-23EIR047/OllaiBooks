#!/usr/bin/env node
/**
 * Builds the ollaiBooks web app as a Next.js standalone server and copies it
 * into apps/desktop/pos-server for the Electron installer.
 *
 * Keeps the installer small:
 *  - removes build-only packages that Next's file tracing pulls in from the
 *    monorepo (webpack, terser, uglify-js… — Next ships its own compiled copies)
 *  - drops source maps and marketing-only images the desktop app never shows
 *
 * Set POS_API_URL to your live API (e.g. https://api.yourdomain.in/api/v1)
 * so the installed app can sign in online and sync.
 */

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const rootDir = path.resolve(__dirname, '..');
const webDir = path.join(rootDir, 'apps', 'web');
const desktopDir = path.join(rootDir, 'apps', 'desktop');
const standaloneDir = path.join(webDir, '.next', 'standalone');
const standaloneAppDir = path.join(standaloneDir, 'apps', 'web');
const packagedServerDir = path.join(desktopDir, 'pos-server');

const BUILD_ONLY_PACKAGES = [
  'webpack', 'webpack-sources', 'terser', 'terser-webpack-plugin', 'uglify-js', 'minimizer-webpack-plugin',
  '@webassemblyjs', '@xtuc', 'enhanced-resolve', 'watchpack', 'typescript', 'eslint', '@types',
];
const DESKTOP_UNUSED_PUBLIC = ['illustrations', 'sample-pos-products.csv'];

function copyDirectory(source, destination) {
  if (!fs.existsSync(source)) throw new Error(`Required build output was not found: ${source}`);
  fs.cpSync(source, destination, { recursive: true, force: true });
}

function dirSize(dir) {
  let total = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    total += entry.isDirectory() ? dirSize(p) : fs.statSync(p).size;
  }
  return total;
}

function removeMaps(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) removeMaps(p);
    else if (entry.name.endsWith('.map')) fs.rmSync(p, { force: true });
  }
}

if (!process.env.POS_API_URL) {
  console.warn('\n⚠  POS_API_URL is not set. The desktop app will try http://localhost:4000/api/v1 for online sign-in and sync.');
  console.warn('   Example: set POS_API_URL=https://api.yourdomain.in/api/v1\n');
}

console.log('Building the POS web app for the desktop installer...');
execSync('npm run build', {
  cwd: webDir,
  stdio: 'inherit',
  env: { ...process.env, NEXT_PUBLIC_API_URL: '/api/v1' },
});

if (!fs.existsSync(path.join(standaloneAppDir, 'server.js'))) {
  throw new Error(`Next.js standalone server was not generated at ${standaloneDir}`);
}

fs.rmSync(packagedServerDir, { recursive: true, force: true });
copyDirectory(standaloneDir, packagedServerDir);
copyDirectory(path.join(webDir, '.next', 'static'), path.join(packagedServerDir, 'apps', 'web', '.next', 'static'));
copyDirectory(path.join(webDir, 'public'), path.join(packagedServerDir, 'apps', 'web', 'public'));

const before = dirSize(packagedServerDir);
for (const pkg of BUILD_ONLY_PACKAGES) {
  fs.rmSync(path.join(packagedServerDir, 'node_modules', pkg), { recursive: true, force: true });
}
for (const item of DESKTOP_UNUSED_PUBLIC) {
  fs.rmSync(path.join(packagedServerDir, 'apps', 'web', 'public', item), { recursive: true, force: true });
}
removeMaps(packagedServerDir);
const after = dirSize(packagedServerDir);

fs.mkdirSync(path.join(desktopDir, 'node_modules'), { recursive: true });
console.log(`Bundled offline POS server at ${packagedServerDir}`);
console.log(`Trimmed ${(before / 1048576).toFixed(1)} MB → ${(after / 1048576).toFixed(1)} MB`);
