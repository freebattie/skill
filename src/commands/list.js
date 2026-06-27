'use strict';

const lockfile = require('../lockfile');
const { findProjectRoot, colors } = require('../util');

/**
 * skill list
 *
 * Print installed files from the lockfile: path, stacks, short commit.
 */
function list() {
  const projectRoot = findProjectRoot();
  const lock = lockfile.read(projectRoot);
  const entries = Object.entries(lock.files);

  console.log(colors.dim(`source: ${lock.source}`));

  if (entries.length === 0) {
    console.log(colors.dim('no files installed yet. Try `skill install <stack>`.'));
    return;
  }

  const pad = Math.max(...entries.map(([p]) => p.length));
  for (const [p, info] of entries) {
    console.log(
      `${p.padEnd(pad)}  ${colors.dim(info.commit)}  ${colors.dim('[' + (info.stacks || []).join(', ') + ']')}`
    );
  }
  console.log(colors.dim(`\n${entries.length} file(s) installed.`));
}

module.exports = list;
