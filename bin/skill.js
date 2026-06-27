#!/usr/bin/env node
'use strict';

const git = require('../src/git');
const { parseArgs, colors } = require('../src/util');

const commands = {
  init: require('../src/commands/init'),
  install: require('../src/commands/install'),
  list: require('../src/commands/list'),
  versions: require('../src/commands/versions'),
  swap: require('../src/commands/swap'),
  // update and status land in the next pass.
};

const HELP = `skill — static md-file installer & version-swapper

usage:
  skill init <source-repo-url> [--preset claude|copilot|none]
                                    clone/cache the source repo, create .skilllock.json
  skill install <stack>             install every .md tagged with <stack>
  skill list                        list installed files (dest path, commit, stacks)
  skill versions <path>             list source commits that touched <path>
  skill swap <path> <commit>        swap a file to a specific source commit
  skill swap <path> --latest        swap a file to its newest source commit

presets (--preset on init):
  none      mirror catalog paths as-is (default)
  claude    catalog skills/ -> .claude/skills/, agents/ -> .claude/agents/
  copilot   catalog skills/ -> .github/prompts/, instructions/ -> .github/instructions/

flags:
  --dry-run     (install) print what would change, write nothing
  --no-pull     (install) skip pulling the source cache
  --force       (install) overwrite locally-modified / conflicting files

<path> in versions/swap accepts either the catalog path or the real project path.

not yet implemented: update, status`;

function main() {
  const [, , cmd, ...rest] = process.argv;

  if (!cmd || cmd === '-h' || cmd === '--help' || cmd === 'help') {
    console.log(HELP);
    process.exit(cmd ? 0 : 1);
  }

  if (cmd === '-v' || cmd === '--version') {
    console.log(require('../package.json').version);
    return;
  }

  if (cmd === 'update' || cmd === 'status') {
    console.error(colors.yellow(`"${cmd}" is not implemented yet.`));
    process.exit(2);
  }

  const handler = commands[cmd];
  if (!handler) {
    console.error(colors.red(`unknown command: ${cmd}`));
    console.error(HELP);
    process.exit(1);
  }

  if (!git.isGitAvailable()) {
    console.error(colors.red('git is required but was not found on PATH.'));
    process.exit(1);
  }

  try {
    handler(parseArgs(rest));
  } catch (e) {
    console.error(colors.red(`error: ${e.message}`));
    process.exit(1);
  }
}

main();
