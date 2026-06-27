'use strict';

const { spawnSync } = require('child_process');

/**
 * Run a git command and return trimmed stdout.
 * Throws an Error carrying stderr when git exits non-zero.
 */
function git(args, opts = {}) {
  const res = spawnSync('git', args, {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    ...opts,
  });
  if (res.error) {
    throw new Error(`failed to run git: ${res.error.message}`);
  }
  if (res.status !== 0) {
    const stderr = (res.stderr || '').trim();
    throw new Error(`git ${args.join(' ')} failed: ${stderr || `exit ${res.status}`}`);
  }
  return (res.stdout || '').trim();
}

/** Run git inside a specific repo directory (-C dir). */
function gitIn(dir, args, opts = {}) {
  return git(['-C', dir, ...args], opts);
}

function clone(url, dest) {
  return git(['clone', url, dest]);
}

function pull(dir) {
  return gitIn(dir, ['pull', '--ff-only']);
}

/** Current HEAD short commit of the repo. */
function head(dir) {
  return gitIn(dir, ['rev-parse', '--short', 'HEAD']);
}

/** Raw bytes of `path` at `commit`, as returned by `git show <commit>:<path>`. */
function show(dir, commit, path) {
  return gitIn(dir, ['show', `${commit}:${path}`]);
}

/** Resolve any commit-ish to its short hash (validates it exists). */
function resolveShort(dir, commitish) {
  return gitIn(dir, ['rev-parse', '--short', `${commitish}^{commit}`]);
}

/** Newest short commit hash that touched `path`. */
function latestCommitFor(dir, path) {
  const out = gitIn(dir, ['log', '-n', '1', '--format=%h', '--', path]);
  return out || null;
}

/**
 * Commits that touched `path`, newest first.
 * Returns [{ hash, date, subject }].
 */
function logFor(dir, path) {
  const out = gitIn(dir, [
    'log',
    '--format=%h\t%ad\t%s',
    '--date=short',
    '--',
    path,
  ]);
  if (!out) return [];
  return out.split('\n').map((line) => {
    const [hash, date, ...rest] = line.split('\t');
    return { hash, date, subject: rest.join('\t') };
  });
}

/** List tracked files at HEAD (relative paths, forward slashes). */
function lsFiles(dir) {
  const out = gitIn(dir, ['ls-files']);
  if (!out) return [];
  return out.split('\n');
}

function isGitAvailable() {
  try {
    git(['--version']);
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  git,
  gitIn,
  clone,
  pull,
  head,
  show,
  resolveShort,
  latestCommitFor,
  logFor,
  lsFiles,
  isGitAvailable,
};
