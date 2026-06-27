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
  config: require('../src/commands/config'),
  save: require('../src/commands/save'),
  history: require('../src/commands/history'),
  checkout: require('../src/commands/checkout'),
};

const HELP = `skill — static md-file installer & version-swapper

setup (once, global):
  skill config source <url>         set your default catalog repo URL
  skill config show                 show current global config

per-project:
  skill init [--preset claude|copilot|none]
                                    init project, using default source (or pass URL)
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

local version history (stored in ~/.skill/versions/, never in project repo):
  skill save <path>               snapshot current file state as next version
  skill history <path>            list all versions: v1, v2... with date + source
  skill checkout <path> <vN>      restore file to version vN (recorded as new version)

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
