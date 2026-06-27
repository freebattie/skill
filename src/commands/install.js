'use strict';

const fs = require('fs');
const path = require('path');

const git = require('../git');
const cache = require('../cache');
const source = require('../source');
const lockfile = require('../lockfile');
const { mapPath } = require('../mappings');
const { findProjectRoot, writeFileEnsured, colors } = require('../util');

/**
 * skill install <stack>
 *
 * Pull the source cache, select every .md whose `stacks` contains <stack>,
 * translate each catalog path to its real project destination (via the preset
 * mappings stored in the lockfile), copy the file, and record it.
 *
 * Flags: --dry-run, --no-pull, --force
 */
function install(argv) {
  const stack = argv.positionals[0];
  if (!stack) {
    throw new Error('usage: skill install <stack> [--dry-run] [--no-pull] [--force]');
  }

  const dryRun = argv.flags.has('dry-run');
  const force = argv.flags.has('force');
  const noPull = argv.flags.has('no-pull');

  const projectRoot = findProjectRoot();
  const lock = lockfile.read(projectRoot);
  const cacheDir = cache.cacheDirFor(lock.source);
  const mappings = lock.mappings || {};

  if (!fs.existsSync(cacheDir)) {
    throw new Error(
      `source cache missing for ${lock.source}. Run \`skill init ${lock.source}\`.`
    );
  }

  if (!noPull) {
    try {
      git.pull(cacheDir);
    } catch (e) {
      console.log(colors.yellow(`warning: pull failed, using cached copy (${e.message})`));
    }
  }

  const headCommit = git.head(cacheDir);
  const selected = source.selectByStack(cacheDir, stack);

  if (selected.length === 0) {
    console.log(colors.yellow(`no files tagged with stack "${stack}".`));
    return;
  }

  let installed = 0;
  let skipped = 0;
  const now = new Date().toISOString();

  for (const file of selected) {
    const catalogPath = file.path;
    const dest = mapPath(catalogPath, mappings);
    const destAbs = path.join(projectRoot, dest);
    const newContent = git.show(cacheDir, headCommit, catalogPath);

    if (fs.existsSync(destAbs) && !force) {
      const onDisk = fs.readFileSync(destAbs, 'utf8');
      const locked = lock.files[catalogPath];
      const baseline = locked ? git.show(cacheDir, locked.commit, catalogPath) : null;
      const conflict = locked ? onDisk !== baseline : onDisk !== newContent;
      if (conflict) {
        const why = locked ? 'locally modified' : 'exists and differs from source';
        console.log(colors.yellow(`skip ${dest} (${why}); use --force to overwrite.`));
        skipped++;
        continue;
      }
    }

    if (dryRun) {
      console.log(
        colors.dim(`would install ${catalogPath}`) +
          colors.dim(` -> ${dest} @ ${headCommit} [${file.stacks.join(', ')}]`)
      );
      installed++;
      continue;
    }

    writeFileEnsured(destAbs, newContent);
    lock.files[catalogPath] = {
      dest,
      stacks: file.stacks,
      commit: headCommit,
      installed_at: now,
    };
    console.log(
      colors.green(`install ${dest}`) +
        colors.dim(` (catalog: ${catalogPath} @ ${headCommit})`)
    );
    installed++;
  }

  if (!dryRun) lockfile.write(projectRoot, lock);

  const verb = dryRun ? 'would install' : 'installed';
  console.log(
    `\n${verb} ${colors.bold(String(installed))} file(s)` +
      (skipped ? `, skipped ${colors.bold(String(skipped))}` : '') +
      ` for stack "${stack}".`
  );
}

module.exports = install;
