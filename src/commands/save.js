'use strict';

const fs = require('fs');
const path = require('path');

const lockfile = require('../lockfile');
const versions = require('../versions');
const { unmapPath } = require('../mappings');
const { findProjectRoot, colors } = require('../util');

/**
 * skill save <path>
 *
 * Snapshot the current on-disk state of an installed file into the local
 * version store. Use this after editing a file locally to record a new version.
 * <path> can be the catalog path or the real project path.
 */
function save(argv) {
  const rawPath = argv.positionals[0] ? argv.positionals[0].replace(/\\/g, '/') : null;
  if (!rawPath) throw new Error('usage: skill save <path>');

  const projectRoot = findProjectRoot();
  const lock = lockfile.read(projectRoot);

  let catalogPath = rawPath;
  if (!lock.files[rawPath]) {
    const unmapped = unmapPath(rawPath, lock.mappings || {});
    if (unmapped && lock.files[unmapped]) {
      catalogPath = unmapped;
    } else {
      throw new Error(`"${rawPath}" is not installed. Install it first.`);
    }
  }

  const entry = lock.files[catalogPath];
  const dest = entry.dest || catalogPath;
  const destAbs = path.join(projectRoot, dest);

  if (!fs.existsSync(destAbs)) {
    throw new Error(`file not found on disk: ${dest}`);
  }

  const content = fs.readFileSync(destAbs, 'utf8');
  const v = versions.snapshot(projectRoot, catalogPath, content, 'local edit');

  console.log(colors.green(`saved ${dest}`) + colors.dim(` as v${v}`));
}

module.exports = save;
