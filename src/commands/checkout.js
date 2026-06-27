'use strict';

const path = require('path');

const lockfile = require('../lockfile');
const versions = require('../versions');
const { unmapPath } = require('../mappings');
const { findProjectRoot, writeFileEnsured, colors } = require('../util');

/**
 * skill checkout <path> <v2>
 *
 * Restore a file to a previously saved local version. The restored content
 * is written to disk and also saved as a new version entry (so history is
 * never rewritten, only extended).
 * <path> can be the catalog path or the real project path.
 */
function checkout(argv) {
  const rawPath = argv.positionals[0] ? argv.positionals[0].replace(/\\/g, '/') : null;
  const vArg = argv.positionals[1];

  if (!rawPath || !vArg) {
    throw new Error('usage: skill checkout <path> <vN>  (e.g. skill checkout .claude/skills/foo/SKILL.md v2)');
  }

  const v = parseVersion(vArg);
  if (!v) throw new Error(`invalid version "${vArg}". Expected format: v1, v2, ...`);

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

  const content = versions.readVersion(projectRoot, catalogPath, v);
  writeFileEnsured(path.join(projectRoot, dest), content);

  const newV = versions.snapshot(projectRoot, catalogPath, content, `restored from v${v}`);
  console.log(
    colors.green(`checked out ${dest}`) +
      colors.dim(` v${v} -> now v${newV}`)
  );
}

function parseVersion(s) {
  const m = String(s).match(/^v?(\d+)$/i);
  return m ? parseInt(m[1], 10) : null;
}

module.exports = checkout;
