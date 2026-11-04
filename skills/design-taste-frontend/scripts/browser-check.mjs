#!/usr/bin/env node
// dsh-taste-skill / browser-check — can the inspector run on this host?
//
// The skill's visual gate (scripts/inspect.mjs, scripts/scenes.mjs) drives a real Chrome/Edge/Chromium
// over the DevTools protocol and needs Node 22+ for its built-in WebSocket. This prints one JSON
// object for the agent to act on instead of parsing an exception from the inspector.
//
//   node scripts/browser-check.mjs
//
// Exit code 0 = ready; 1 = a browser or a new enough Node is missing.
// Zero dependencies. Node 18+ (it reports the version it was started with).
import { findChrome } from './lib/cdp.mjs';

const version = process.versions.node;
const major = Number.parseInt(String(version).split('.')[0], 10);
const envChrome = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH || null;
const chrome = findChrome();

const report = {
  ready: Boolean(chrome) && major >= 22,
  node: {
    path: process.execPath,
    version,
    ok: major >= 22,
    required: '>=22',
  },
  browser: chrome
    ? { found: true, path: chrome, source: envChrome ? 'environment' : 'default locations' }
    : {
        found: false,
        path: null,
        hint: 'Install Google Chrome, Chromium or Microsoft Edge, or set CHROME_PATH to an existing Chrome-family executable.',
      },
};

console.log(JSON.stringify(report, null, 2));
process.exit(report.ready ? 0 : 1);
