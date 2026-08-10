# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

AG Kit / Claude Kit is an AI agent engineering kit designed to support both Google Antigravity and Claude Code runtimes. The product is the workspace contract itself—Markdown and JSON files that define rules, skills, agents, workflows, and memory, rather than compiled code.

Three deliverables live in one repo:
- **`.agents/` / `.claude/`** — the toolkit, containing 20 specialist agents, 47 skills, 13 slash-command workflows, rules, persistent memory templates, and runtime layers.
- **`cli/`** — published npm package `@vudovn/ag-kit` (Node ≥18, ESM). Installs the kit into user projects.
- **`web/`** — docs site (Next.js 16 + MDX + Tailwind 4, React 19).

## Dual Structure

The toolkit relies on a dual structure to support different runtimes:
- **`.claude/`**: Contains Claude Code native configurations (rules, custom commands, hooks, and settings like `settings.json`).
- **`.agents/`**: Contains the core toolkit content (agents, skills, memory files, utility scripts, and schemas) which are consumed by runtimes.

## Agent/Skill Loading Protocol

When working in this repo or applying the kit, follow this protocol:
1. **Session Start**: ALWAYS read `.agents/memory/MEMORY.md` to load persistent project conventions and decisions.
2. **Before Implementation**: Identify the most relevant specialist agent from the `.agents/agent/` directory based on the task.
3. **Load Skills**: Read the agent's Markdown file, check its YAML frontmatter under `skills:`, and load those specific skills.
4. **Announce**: Explicitly announce which agent and skills are being used (e.g., `🤖 Applying knowledge of @[agent]...`).

## Commands

All commands are run from the repo root unless noted otherwise:

```bash
# Toolkit (.agents/) — run after ANY change to managed components
npm run generate:agents      # regenerate manifest.json, manifest.lock.json, DEPENDENCY_GRAPH.md
npm run check:agents         # manifest --check + graph --check + validate_kit.py (what CI runs)
npm run test:toolkit         # python -m unittest discover -s .agents/scripts/tests -v

# Runtime layers
npm run check:antigravity    # doctor: validates contract, hooks, schemas
npm run test:antigravity     # node --test .agents/hooks/tests/antigravity.test.mjs
npm run build:antigravity-plugin

# CLI
npm run test:cli             # run CLI tests
node --test cli/test/managed-tree.test.js   # single test file

# Web
npm run lint:web
npm run typecheck:web
npm run build:web            # next build --webpack (not turbopack)
```

## The Managed Component Registry

Any edit to a managed component (files in `agent/`, `skills/`, `workflows/`, `rules/`, hooks, schemas) **must** be followed by `npm run generate:agents`. CI runs `check:agents` and will fail if hashes mismatch. Never hand-edit `manifest.json`, `manifest.lock.json`, or `DEPENDENCY_GRAPH.md`.

## Component Conventions

- **Frontmatter**: Agents, skills, workflows, and rules are Markdown with YAML frontmatter (`name`, `description`, `version`, `tools`/`dependencies`). Validated by `validate_kit.py`.
- **Progressive Loading**: Skills use "Selective Reading" (progressive/conditional loading). A short always-loaded core with deeper sections loaded on demand.
- **Dependencies**: Cross-component dependencies are declared in frontmatter and materialize in the dependency graph.

## Safety Hook

The native PreToolUse hook (configured in `.claude/settings.json` mapping to `validate-tool-call.mjs`) is deliberately narrow: it blocks root-filesystem deletion, drive formatting, and raw-disk writes. Do not broaden it into a general linter.

## Versioning

Dual-track versioning is used:
- **Toolkit releases**: **CalVer** `YYYY.M.D` in `.agents/VERSION`.
- **Individual components**: **SemVer** in their Markdown frontmatter. Bump the frontmatter version when changing a component.
