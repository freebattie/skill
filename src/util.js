'use strict';

const fs = require('fs');
const path = require('path');

const lockfile = require('./lockfile');

/**
 * Find the project root by walking up from `start` looking for a lockfile.
 * Falls back to `start` (cwd) when none is found — callers that require an
 * existing lockfile will surface the friendly error from lockfile.read().
 */
function findProjectRoot(start = process.cwd()) {
  let dir = path.resolve(start);
  for (;;) {
    if (fs.existsSync(lockfile.lockfilePath(dir))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return path.resolve(start);
    dir = parent;
  }
}

/** Write `content` to `dest`, creating parent directories as needed. */
function writeFileEnsured(dest, content) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, content, 'utf8');
}

/** Parse `--flag` style args into { flags: Set, positionals: [] }. */
function parseArgs(argv) {
  const flags = new Set();
  const positionals = [];
  for (const a of argv) {
    if (a.startsWith('--')) flags.add(a.slice(2));
    else positionals.push(a);
  }
  return { flags, positionals };
}

const colors = {
  enabled: process.stdout.isTTY && !process.env.NO_COLOR,
  wrap(code, s) {
    return this.enabled ? `\x1b[${code}m${s}\x1b[0m` : s;
  },
  green(s) {
    return this.wrap('32', s);
  },
  yellow(s) {
    return this.wrap('33', s);
  },
  red(s) {
    return this.wrap('31', s);
  },
  dim(s) {
    return this.wrap('2', s);
  },
  bold(s) {
    return this.wrap('1', s);
  },
};

module.exports = { findProjectRoot, writeFileEnsured, parseArgs, colors };
