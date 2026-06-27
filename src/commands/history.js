'use strict';

const lockfile = require('../lockfile');
const versions = require('../versions');
const { unmapPath } = require('../mappings');
const { findProjectRoot, colors } = require('../util');

/**
 * skill history <path>
 *
 * Show all locally stored versions of an installed file.
 * <path> can be the catalog path or the real project path.
 */
function history(argv) {
  const rawPath = argv.positionals[0] ? argv.positionals[0].replace(/\\/g, '/') : null;
  if (!rawPath) throw new Error('usage: skill history <path>');

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
  const hist = versions.readHistory(projectRoot, catalogPath);

  if (hist.length === 0) {
    console.log(colors.yellow(`no versions stored for ${dest}.`));
    console.log(colors.dim('Versions are saved automatically on install/swap, or manually with `skill save <path>`.'));
    return;
  }

  const latest = hist.length;
  console.log(colors.bold(dest) + colors.dim(` (${hist.length} version${hist.length !== 1 ? 's' : ''})`));
  console.log('');

  for (const entry of [...hist].reverse()) {
    const isCurrent = entry.v === latest;
    const tag = isCurrent ? colors.green(' <- current') : '';
    const date = entry.date.replace('T', ' ').slice(0, 16);
    console.log(
      `  ${colors.yellow(`v${entry.v}`)}  ${colors.dim(date)}  ${entry.source}${tag}`
    );
  }
}

module.exports = history;
