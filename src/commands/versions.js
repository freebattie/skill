'use strict';

const fs = require('fs');

const git = require('../git');
const cache = require('../cache');
const lockfile = require('../lockfile');
const { unmapPath } = require('../mappings');
const { findProjectRoot, colors } = require('../util');

/**
 * skill versions <path>
 *
 * <path> can be the catalog path or the real project path.
 * Lists source commits that touched the file — the swap targets.
 */
function versions(argv) {
  const rawPath = argv.positionals[0] ? argv.positionals[0].replace(/\\/g, '/') : null;
  if (!rawPath) throw new Error('usage: skill versions <path>');

  const projectRoot = findProjectRoot();
  const lock = lockfile.read(projectRoot);
  const cacheDir = cache.cacheDirFor(lock.source);
  if (!fs.existsSync(cacheDir)) {
    throw new Error(`source cache missing for ${lock.source}. Run \`skill init ${lock.source}\`.`);
  }

  // Resolve to catalog path whether user typed catalog or project path.
  let catalogPath = rawPath;
  if (!lock.files[rawPath]) {
    const unmapped = unmapPath(rawPath, lock.mappings || {});
    if (unmapped) catalogPath = unmapped;
  }

  const current = lock.files[catalogPath] ? lock.files[catalogPath].commit : null;
  const commits = git.logFor(cacheDir, catalogPath);

  if (commits.length === 0) {
    console.log(colors.yellow(`no commits touch ${catalogPath} in the source repo.`));
    return;
  }

  for (const c of commits) {
    const marker = current && c.hash.startsWith(current) ? colors.green(' <- installed') : '';
    console.log(`${colors.yellow(c.hash)}  ${colors.dim(c.date)}  ${c.subject}${marker}`);
  }
}

module.exports = versions;
