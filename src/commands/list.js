'use strict';

const lockfile = require('../lockfile');
const { findProjectRoot, colors } = require('../util');

/**
 * skill list
 *
 * Print installed files: real project path (dest), catalog path, commit, stacks.
 */
function list() {
  const projectRoot = findProjectRoot();
  const lock = lockfile.read(projectRoot);
  const entries = Object.entries(lock.files);

  console.log(colors.dim(`source:  ${lock.source}`));
  console.log(colors.dim(`preset:  ${lock.preset || 'none'}`));

  if (entries.length === 0) {
    console.log(colors.dim('no files installed yet. Try `skill install <stack>`.'));
    return;
  }

  console.log('');
  const destPad = Math.max(...entries.map(([, info]) => (info.dest || '').length));
  for (const [catalogPath, info] of entries) {
    const dest = info.dest || catalogPath;
    console.log(
      `${dest.padEnd(destPad)}  ${colors.dim(info.commit)}  ${colors.dim('[' + (info.stacks || []).join(', ') + ']')}`
    );
    if (info.dest && info.dest !== catalogPath) {
      console.log(`  ${colors.dim('catalog: ' + catalogPath)}`);
    }
  }
  console.log(colors.dim(`\n${entries.length} file(s) installed.`));
}

module.exports = list;
