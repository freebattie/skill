'use strict';

const fs = require('fs');
const path = require('path');

const git = require('../git');
const cache = require('../cache');
const lockfile = require('../lockfile');
const { unmapPath } = require('../mappings');
const versions = require('../versions');
const { findProjectRoot, writeFileEnsured, colors } = require('../util');

/**
 * skill swap <path> <commit>
 * skill swap <path> --latest
 *
 * <path> can be the catalog path ("skills/X/SKILL.md") OR the real project
 * path (".claude/skills/X/SKILL.md") — the tool resolves either.
 */
function swap(argv) {
  const rawPath = normalize(argv.positionals[0]);
  const wantLatest = argv.flags.has('latest');
  const commitArg = argv.positionals[1];

  if (!rawPath || (!commitArg && !wantLatest)) {
    throw new Error('usage: skill swap <path> <commit> | skill swap <path> --latest');
  }

  const projectRoot = findProjectRoot();
  const lock = lockfile.read(projectRoot);

  // Accept catalog path directly, or reverse-map from a project path.
  let catalogPath = rawPath;
  if (!lock.files[rawPath]) {
    const unmapped = unmapPath(rawPath, lock.mappings || {});
    if (unmapped && lock.files[unmapped]) {
      catalogPath = unmapped;
    } else {
      throw new Error(
        `"${rawPath}" is not installed (not in lockfile). Install it first.\n` +
          `  Installed files: ${Object.keys(lock.files).join(', ') || 'none'}`
      );
    }
  }

  const entry = lock.files[catalogPath];
  const dest = entry.dest || catalogPath;
  const cacheDir = cache.cacheDirFor(lock.source);
  if (!fs.existsSync(cacheDir)) {
    throw new Error(`source cache missing for ${lock.source}. Run \`skill init ${lock.source}\`.`);
  }

  let commit;
  if (wantLatest) {
    commit = git.latestCommitFor(cacheDir, catalogPath);
    if (!commit) throw new Error(`no commits touch ${catalogPath} in the source repo.`);
  } else {
    commit = git.resolveShort(cacheDir, commitArg);
  }

  const content = git.show(cacheDir, commit, catalogPath);
  writeFileEnsured(path.join(projectRoot, dest), content);

  const prev = entry.commit;
  lock.files[catalogPath].commit = commit;
  lock.files[catalogPath].installed_at = new Date().toISOString();
  lockfile.write(projectRoot, lock);

  const v = versions.snapshot(projectRoot, catalogPath, content, `swapped from catalog @ ${commit}`);
  console.log(
    colors.green(`swapped ${dest}`) +
      colors.dim(` ${prev} -> ${commit} (saved as v${v})`)
  );
}

function normalize(p) {
  return p ? p.replace(/\\/g, '/') : p;
}

module.exports = swap;
