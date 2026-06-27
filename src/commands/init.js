'use strict';

const fs = require('fs');
const git = require('../git');
const cache = require('../cache');
const lockfile = require('../lockfile');
const { colors } = require('../util');

/**
 * skill init <source-repo-url>
 *
 * Clone/cache the source repo and create an empty .skilllock.json in the
 * current directory pointing at that source.
 */
function init(argv) {
  const url = argv.positionals[0];
  if (!url) {
    throw new Error('usage: skill init <source-repo-url>');
  }

  const projectRoot = process.cwd();
  const cacheDir = cache.cacheDirFor(url);

  if (fs.existsSync(cacheDir)) {
    console.log(colors.dim(`cache exists, pulling: ${cacheDir}`));
    try {
      git.pull(cacheDir);
    } catch (e) {
      console.log(colors.yellow(`warning: pull failed (${e.message})`));
    }
  } else {
    console.log(colors.dim(`cloning ${url} -> ${cacheDir}`));
    git.clone(url, cacheDir);
  }

  if (lockfile.exists(projectRoot)) {
    const existing = lockfile.read(projectRoot);
    if (existing.source !== url) {
      console.log(
        colors.yellow(
          `note: ${lockfile.LOCKFILE_NAME} already exists with a different source (${existing.source}); leaving it untouched.`
        )
      );
      return;
    }
    console.log(colors.dim(`${lockfile.LOCKFILE_NAME} already initialized.`));
    return;
  }

  lockfile.create(projectRoot, url);
  console.log(
    colors.green(`initialized ${lockfile.LOCKFILE_NAME}`) +
      ` (source: ${url}, HEAD ${git.head(cacheDir)})`
  );
}

module.exports = init;
