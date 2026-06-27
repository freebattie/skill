'use strict';

const fs = require('fs');
const git = require('../git');
const cache = require('../cache');
const lockfile = require('../lockfile');
const { getPreset, presetNames } = require('../mappings');
const { colors } = require('../util');

/**
 * skill init <source-repo-url> [--preset claude|copilot|none]
 *
 * Clone/cache the source repo and create an empty .skilllock.json in the
 * current directory. --preset sets the path-mapping strategy so installed
 * files land in the correct real project locations (e.g. .claude/skills/).
 */
function init(argv) {
  const url = argv.positionals[0];
  if (!url) {
    throw new Error(
      `usage: skill init <source-repo-url> [--preset ${presetNames().join('|')}]`
    );
  }

  const presetName = argv.options.get('preset') || 'none';
  const mappings = getPreset(presetName);
  if (mappings === null) {
    throw new Error(
      `unknown preset "${presetName}". Available: ${presetNames().join(', ')}`
    );
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

  lockfile.create(projectRoot, url, presetName, mappings);
  console.log(
    colors.green(`initialized ${lockfile.LOCKFILE_NAME}`) +
      ` (source: ${url}, preset: ${presetName}, HEAD ${git.head(cacheDir)})`
  );
}

module.exports = init;
