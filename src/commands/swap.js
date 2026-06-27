'use strict';

const fs = require('fs');
const path = require('path');

const git = require('../git');
const cache = require('../cache');
const lockfile = require('../lockfile');
const { findProjectRoot, writeFileEnsured, colors } = require('../util');

/**
 * skill swap <path> <commit>
 * skill swap <path> --latest
 *
 * Overwrite the project copy of <path> with its content at <commit> in the
 * source repo, and record that commit in the lockfile.
 */
function swap(argv) {
  const rel = normalize(argv.positionals[0]);
  const wantLatest = argv.flags.has('latest');
  const commitArg = argv.positionals[1];

  if (!rel || (!commitArg && !wantLatest)) {
    throw new Error('usage: skill swap <path> <commit> | skill swap <path> --latest');
  }

  const projectRoot = findProjectRoot();
  const lock = lockfile.read(projectRoot);

  if (!lock.files[rel]) {
    throw new Error(`${rel} is not installed (not in lockfile). Install it first.`);
  }

  const cacheDir = cache.cacheDirFor(lock.source);
  if (!fs.existsSync(cacheDir)) {
    throw new Error(`source cache missing for ${lock.source}. Run \`skill init ${lock.source}\`.`);
  }

  let commit;
  if (wantLatest) {
    commit = git.latestCommitFor(cacheDir, rel);
    if (!commit) throw new Error(`no commits touch ${rel} in the source repo.`);
  } else {
    commit = git.resolveShort(cacheDir, commitArg);
  }

  const content = git.show(cacheDir, commit, rel);
  writeFileEnsured(path.join(projectRoot, rel), content);

  const prev = lock.files[rel].commit;
  lock.files[rel].commit = commit;
  lock.files[rel].installed_at = new Date().toISOString();
  lockfile.write(projectRoot, lock);

  console.log(
    colors.green(`swapped ${rel}`) +
      colors.dim(` ${prev} -> ${commit}`)
  );
}

function normalize(p) {
  return p ? p.replace(/\\/g, '/') : p;
}

module.exports = swap;
