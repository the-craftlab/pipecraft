# Pipecraft Claude Skill

AI coding assistant skill for [Pipecraft](https://pipecraft.thecraftlab.dev) - the trunk-based CI/CD workflow generator for GitHub Actions.

## Installation

### Option 1: npm (Recommended)

```bash
# Global installation (available in all projects)
npm install -g @pipecraft/claude-skill

# Project-level installation
npm install --save-dev @pipecraft/claude-skill
```

### Option 2: OpenSkills

```bash
npx openskills install the-craftlab/pipecraft
```

### Option 3: Manual Installation

Copy `SKILL.md` to your skills directory:

| Tool           | Global Path                             | Project Path                  |
| -------------- | --------------------------------------- | ----------------------------- |
| Claude Code    | `~/.claude/skills/pipecraft/`           | `.claude/skills/pipecraft/`   |
| Cursor         | `~/.cursor/skills/pipecraft/`           | `.cursor/skills/pipecraft/`   |
| GitHub Copilot | `~/.copilot/skills/pipecraft/`          | `.github/skills/pipecraft/`   |
| Windsurf       | `~/.codeium/windsurf/skills/pipecraft/` | `.windsurf/skills/pipecraft/` |

## Usage

Once installed, the skill activates automatically when you:

- Ask about CI/CD setup or GitHub Actions
- Mention Pipecraft, trunk-based development, or workflow generation
- Need help with `.pipecraftrc` configuration

### Claude Code

```
/pipecraft help me set up CI/CD for my monorepo
```

Or just ask naturally:

```
How do I configure Pipecraft for a three-branch flow?
```

## What This Skill Provides

- **Command reference** - All Pipecraft CLI commands and flags
- **Configuration help** - Required fields, optional settings, domain setup
- **Troubleshooting** - Common errors and solutions
- **Best practices** - Branch flow patterns, domain configuration examples

## Links

- [Pipecraft Documentation](https://pipecraft.thecraftlab.dev)
- [GitHub Repository](https://github.com/the-craftlab/pipecraft)
- [Full AI Guide](https://github.com/the-craftlab/pipecraft/blob/main/PIPECRAFT_AI_GUIDE.md)

## License

MIT
