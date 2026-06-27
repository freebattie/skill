'use strict';

/**
 * Built-in presets that translate catalog top-level folders to real project
 * paths. A preset of "none" (the default) mirrors paths as-is.
 *
 * Catalog layout (tool-agnostic):
 *   skills/     — reusable skill workflows
 *   agents/     — autonomous subagent definitions
 *   instructions/ — project/directory guidance
 *
 * Claude Code layout:
 *   .claude/skills/<name>/SKILL.md   — skill invoked by Claude
 *   .claude/agents/<name>.md         — subagent delegated to by Claude
 *   CLAUDE.md                        — project instructions (at project root)
 *
 * GitHub Copilot layout:
 *   .github/prompts/<name>.prompt.md             — reusable prompt files
 *   .github/instructions/<name>.instructions.md  — path-scoped instructions
 *   .github/copilot-instructions.md              — repo-wide instructions
 */
const PRESETS = {
  none: {},

  claude: {
    skills: '.claude/skills',
    agents: '.claude/agents',
    instructions: '.claude/commands',
  },

  copilot: {
    skills: '.github/prompts',
    agents: '.github/prompts',
    instructions: '.github/instructions',
  },
};

/**
 * Translate a catalog-relative path to its project destination path.
 *
 *   catalogPath: "skills/frontend-design/SKILL.md"
 *   mappings:    { skills: ".claude/skills", ... }
 *   → ".claude/skills/frontend-design/SKILL.md"
 *
 * If the top-level folder has no mapping, the path is returned unchanged.
 */
function mapPath(catalogPath, mappings) {
  if (!mappings || Object.keys(mappings).length === 0) return catalogPath;
  const slash = catalogPath.indexOf('/');
  if (slash === -1) return catalogPath;
  const topLevel = catalogPath.slice(0, slash);
  const rest = catalogPath.slice(slash + 1);
  const dest = mappings[topLevel];
  return dest ? `${dest}/${rest}` : catalogPath;
}

/**
 * Reverse: translate a project-relative path back to its catalog path.
 *
 *   projectPath: ".claude/skills/frontend-design/SKILL.md"
 *   mappings:    { skills: ".claude/skills", ... }
 *   → "skills/frontend-design/SKILL.md"
 *
 * Returns null if the path doesn't match any mapped destination.
 */
function unmapPath(projectPath, mappings) {
  if (!mappings) return null;
  for (const [catalogDir, projectDir] of Object.entries(mappings)) {
    if (projectPath === projectDir || projectPath.startsWith(projectDir + '/')) {
      const rest = projectPath.slice(projectDir.length + 1);
      return rest ? `${catalogDir}/${rest}` : catalogDir;
    }
  }
  return null;
}

function presetNames() {
  return Object.keys(PRESETS);
}

function getPreset(name) {
  return PRESETS[name] || null;
}

module.exports = { PRESETS, mapPath, unmapPath, presetNames, getPreset };
