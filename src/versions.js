'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

/**
 * Local version store — lives entirely in ~/.skill/versions/, never in the
 * project repo. Tracks every snapshot of every installed file per project.
 *
 * Layout:
 *   ~/.skill/versions/
 *     <project-id>/
 *       <catalog-path>/          e.g. skills/frontend-design/SKILL.md/
 *         history.json           [{v, date, source}]
 *         v1.md
 *         v2.md
 *         ...
 */

function projectId(projectRoot) {
  return crypto
    .createHash('sha1')
    .update(path.resolve(projectRoot))
    .digest('hex')
    .slice(0, 16);
}

function versionDir(projectRoot, catalogPath) {
  return path.join(
    os.homedir(),
    '.skill',
    'versions',
    projectId(projectRoot),
    ...catalogPath.split('/')
  );
}

function historyPath(projectRoot, catalogPath) {
  return path.join(versionDir(projectRoot, catalogPath), 'history.json');
}

function readHistory(projectRoot, catalogPath) {
  const p = historyPath(projectRoot, catalogPath);
  if (!fs.existsSync(p)) return [];
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeHistory(projectRoot, catalogPath, history) {
  const p = historyPath(projectRoot, catalogPath);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(history, null, 2) + '\n', 'utf8');
}

/**
 * Save a snapshot of `content` for this file.
 * Returns the version number assigned (1-based).
 */
function snapshot(projectRoot, catalogPath, content, source) {
  const history = readHistory(projectRoot, catalogPath);
  const v = history.length + 1;
  const dir = versionDir(projectRoot, catalogPath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `v${v}.md`), content, 'utf8');
  history.push({ v, date: new Date().toISOString(), source });
  writeHistory(projectRoot, catalogPath, history);
  return v;
}

/** Read the content of a specific version. */
function readVersion(projectRoot, catalogPath, v) {
  const file = path.join(versionDir(projectRoot, catalogPath), `v${v}.md`);
  if (!fs.existsSync(file)) {
    throw new Error(`v${v} does not exist for ${catalogPath}`);
  }
  return fs.readFileSync(file, 'utf8');
}

/** Latest version number, or 0 if none. */
function latestVersion(projectRoot, catalogPath) {
  return readHistory(projectRoot, catalogPath).length;
}

module.exports = {
  projectId,
  snapshot,
  readVersion,
  readHistory,
  latestVersion,
};
