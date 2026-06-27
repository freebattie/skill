'use strict';

const fs = require('fs');
const path = require('path');

const LOCKFILE_NAME = '.skilllock.json';

function lockfilePath(projectRoot) {
  return path.join(projectRoot, LOCKFILE_NAME);
}

function exists(projectRoot) {
  return fs.existsSync(lockfilePath(projectRoot));
}

/** Read the lockfile, throwing a friendly error if it's missing. */
function read(projectRoot) {
  const p = lockfilePath(projectRoot);
  if (!fs.existsSync(p)) {
    throw new Error(
      `no ${LOCKFILE_NAME} found in ${projectRoot}. Run \`skill init <source-repo-url>\` first.`
    );
  }
  const raw = fs.readFileSync(p, 'utf8');
  const data = JSON.parse(raw);
  if (!data.files) data.files = {};
  return data;
}

function write(projectRoot, data) {
  const p = lockfilePath(projectRoot);
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

/** Create a fresh, empty lockfile pointing at `source`. */
function create(projectRoot, source) {
  const data = { source, files: {} };
  write(projectRoot, data);
  return data;
}

module.exports = {
  LOCKFILE_NAME,
  lockfilePath,
  exists,
  read,
  write,
  create,
};
