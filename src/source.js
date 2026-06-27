'use strict';

const path = require('path');
const fs = require('fs');
const git = require('./git');
const { parseFrontmatter } = require('./frontmatter');

/**
 * Walk every tracked .md file in the cached source repo, parse its
 * frontmatter, and return [{ path, stacks }] (path uses forward slashes,
 * relative to the repo root). Untracked files and non-.md files are skipped.
 */
function index(cacheDir) {
  return git
    .lsFiles(cacheDir)
    .filter((p) => p.toLowerCase().endsWith('.md'))
    .map((p) => {
      const abs = path.join(cacheDir, p);
      let stacks = [];
      try {
        stacks = parseFrontmatter(fs.readFileSync(abs, 'utf8')).stacks;
      } catch {
        stacks = [];
      }
      return { path: p, stacks };
    });
}

/** Files whose `stacks` contains `stack` (case-insensitive). */
function selectByStack(cacheDir, stack) {
  const target = String(stack).trim().toLowerCase();
  return index(cacheDir).filter((f) => f.stacks.includes(target));
}

module.exports = { index, selectByStack };
