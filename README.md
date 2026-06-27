# skill

A static `.md` file installer & version-swapper. It copies stack-tagged markdown
files from a **git source repo** into your project, and lets you swap each
installed file to any version from the source repo's git history.

No registry, no npm, no semver. Just a git repo of md files, frontmatter tags,
and `git show`.

## Install

```sh
npm install -g .      # or: npm link
```

Requires `git` on your PATH and Node >= 16.

## How it works

- **Source repo** — one git repo of `.md` files, organized however you like.
  The top-level folder of each file (`skills/`, `instructions/`, `agents/`, …)
  is mirrored into your project on install.
- **Frontmatter tagging** — every tracked file starts with a YAML block whose
  only required key is `stacks`. `skill install <stack>` pulls every file whose
  `stacks` contains `<stack>` (case-insensitive). Files without `stacks` are
  ignored.

  ```markdown
  ---
  stacks: [React, .NET]
  ---
  # ... content
  ```

  List, comma-string, and block-list forms are all accepted:
  `stacks: [react, dotnet]`, `stacks: react, dotnet`, or
  `stacks:` followed by `- react` lines.
- **Lockfile** — `.skilllock.json` at your project root records, per installed
  file, which source commit it came from. It's the single source of truth and is
  meant to be committed.
- **Versions** — version history *is* the source repo's git history. The tool
  keeps a local clone in `~/.skill/cache/<hash>` and reads old versions with
  `git show <commit>:<path>`. No branches in your project.

## Commands

| Command | What it does |
| --- | --- |
| `skill init <source-repo-url>` | Clone/cache the source repo, create `.skilllock.json`. |
| `skill install <stack>` | Install every `.md` tagged with `<stack>`, recording each at source HEAD. |
| `skill list` | List installed files: path, commit, stacks. |
| `skill versions <path>` | List source commits that touched `<path>` — the swap targets. |
| `skill swap <path> <commit>` | Overwrite the project file with its content at `<commit>`. |
| `skill swap <path> --latest` | Swap to the newest commit touching the file. |

### Flags

- `--dry-run` *(install)* — print what would change, write nothing.
- `--no-pull` *(install)* — skip pulling the source cache (offline).
- `--force` *(install)* — overwrite locally-modified / conflicting files.

### Conflict handling

On install, if a target file already exists and differs from its locked version
(i.e. you edited it locally), that file is skipped with a warning. Pass
`--force` to overwrite.

## Example

```sh
cd my-project
skill init git@github.com:you/ai-files.git
skill install react           # mirrors every react-tagged .md into the project
skill list
skill versions skills/frontend-design/SKILL.md
skill swap skills/frontend-design/SKILL.md a1b2c3d
```

## Not yet implemented

- `skill update [stack]` — bulk swap installed files to latest.
- `skill status` — flag files that are behind or locally modified.
