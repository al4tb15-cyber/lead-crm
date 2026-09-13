/**
 * Business HUB Australia - cPanel Phusion Passenger Startup Script
 *
 * This file serves as the main entry point for cPanel's "Setup Node.js App"
 * (CloudLinux Phusion Passenger) environment.
 *
 * Prerequisites:
 * Run `npm run build` once prior to starting so `dist/server.cjs` and `dist/`
 * static assets are generated.
 */

// Ensure working directory is set to the folder where app.js is located
try {
  process.chdir(__dirname);
} catch (err) {
  console.warn('[cPanel Startup] Warning: Could not chdir to __dirname:', err);
}

// Ensure environment variables from .env are loaded
try {
  require('dotenv').config();
} catch (e) {
  // dotenv optional if environment variables are set directly in cPanel UI
}

// Ensure NODE_ENV is set to production when running under Passenger
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}

console.log('[cPanel Startup] Initializing Business HUB Australia Production Server...');
console.log(`[cPanel Startup] Directory: ${process.cwd()} | Node: ${process.version}`);

// Require the compiled, self-contained CommonJS server bundle
try {
  require('./dist/server.cjs');
  console.log('[cPanel Startup] Successfully loaded dist/server.cjs bundle.');
} catch (err) {
  console.error('[cPanel Startup ERROR] Failed to load dist/server.cjs!');
  console.error('Did you run "npm run build" to compile the application?');
  console.error('Run "bash cpanel-install.sh" or "npm install && npm run build" via terminal.');
  console.error(err);
  process.exit(1);
}
