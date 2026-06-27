'use strict';

const fs = require('fs');

const git = require('../git');
const cache = require('../cache');
const lockfile = require('../lockfile');
const { findProjectRoot, colors } = require('../util');

/**
 * skill versions <path>
 *
 * List the source-repo commits that touched <path> — the swap targets.
 */
function versions(argv) {
  const rel = argv.positionals[0] ? argv.positionals[0].replace(/\\/g, '/') : null;
  if (!rel) throw new Error('usage: skill versions <path>');

  const projectRoot = findProjectRoot();
  const lock = lockfile.read(projectRoot);
  const cacheDir = cache.cacheDirFor(lock.source);
  if (!fs.existsSync(cacheDir)) {
    throw new Error(`source cache missing for ${lock.source}. Run \`skill init ${lock.source}\`.`);
  }

  const current = lock.files[rel] ? lock.files[rel].commit : null;
  const commits = git.logFor(cacheDir, rel);

  if (commits.length === 0) {
    console.log(colors.yellow(`no commits touch ${rel} in the source repo.`));
    return;
  }

  for (const c of commits) {
    const marker = current && c.hash.startsWith(current) ? colors.green(' <- installed') : '';
    console.log(`${colors.yellow(c.hash)}  ${colors.dim(c.date)}  ${c.subject}${marker}`);
  }
}

module.exports = versions;
