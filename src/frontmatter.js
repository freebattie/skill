'use strict';

/**
 * Minimal frontmatter reader. We only care about the `stacks` key, so rather
 * than pull in a full YAML dependency we parse the leading `---` ... `---`
 * block ourselves and read `stacks` in either list or comma-string form.
 *
 *   ---
 *   stacks: [React, .NET]
 *   ---
 *
 *   ---
 *   stacks: react, dotnet
 *   ---
 *
 *   ---
 *   stacks:
 *     - React
 *     - .NET
 *   ---
 */

function normalizeStacks(value) {
  return value
    .map((s) => String(s).trim().toLowerCase())
    .filter(Boolean);
}

function stripInlineList(raw) {
  // "[React, .NET]" -> ["React", ".NET"]
  const inner = raw.replace(/^\[/, '').replace(/\]$/, '');
  return inner.split(',');
}

function unquote(s) {
  const t = s.trim();
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    return t.slice(1, -1);
  }
  return t;
}

/**
 * Parse the frontmatter of a markdown string.
 * Returns { stacks: string[] }. Files with no frontmatter, or no `stacks`
 * key, yield an empty stacks list (and are therefore ignored by install).
 */
function parseFrontmatter(content) {
  const text = content.replace(/^﻿/, ''); // strip BOM
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { stacks: [] };

  const block = match[1];
  const lines = block.split(/\r?\n/);

  let stacks = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(/^stacks\s*:\s*(.*)$/i);
    if (!m) continue;

    const rest = m[1].trim();

    if (rest.startsWith('[')) {
      // inline list
      stacks = stripInlineList(rest).map(unquote);
    } else if (rest === '') {
      // block list on following indented `- item` lines
      const collected = [];
      for (let j = i + 1; j < lines.length; j++) {
        const item = lines[j].match(/^\s*-\s+(.*)$/);
        if (!item) break;
        collected.push(unquote(item[1]));
      }
      stacks = collected;
    } else {
      // comma string (or single value)
      stacks = rest.split(',').map(unquote);
    }
    break;
  }

  if (!stacks) return { stacks: [] };
  return { stacks: normalizeStacks(stacks) };
}

module.exports = { parseFrontmatter, normalizeStacks };
