'use strict';

const config = require('../config');
const { colors } = require('../util');

/**
 * skill config source <url>     set the default source repo
 * skill config show             print current global config
 */
function configCmd(argv) {
  const sub = argv.positionals[0];
  const val = argv.positionals[1];

  if (sub === 'source') {
    if (!val) throw new Error('usage: skill config source <url>');
    config.set('source', val);
    console.log(colors.green(`default source set: ${val}`));
    return;
  }

  if (!sub || sub === 'show') {
    const data = config.read();
    if (Object.keys(data).length === 0) {
      console.log(colors.dim('no global config set. Try: skill config source <url>'));
      return;
    }
    for (const [k, v] of Object.entries(data)) {
      console.log(`${k}: ${colors.bold(v)}`);
    }
    return;
  }

  throw new Error(`unknown config key "${sub}". Available: source, show`);
}

module.exports = configCmd;
