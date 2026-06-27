'use strict';

const os = require('os');
const path = require('path');
const crypto = require('crypto');

/** Root of the local source-repo cache: ~/.skill/cache */
function cacheRoot() {
  return path.join(os.homedir(), '.skill', 'cache');
}

/** Stable per-source directory name derived from the repo URL. */
function repoHash(url) {
  return crypto.createHash('sha1').update(url).digest('hex').slice(0, 16);
}

/** Absolute path to the cached clone for a given source URL. */
function cacheDirFor(url) {
  return path.join(cacheRoot(), repoHash(url));
}

module.exports = { cacheRoot, repoHash, cacheDirFor };
