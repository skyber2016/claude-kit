# AG Kit

AI agent engineering kit with rules, skills, slash-command workflows, orchestration, and safety hooks. Works with **Claude Code** and **Antigravity (agy)**.

## What's Inside

| Component | Count | Description |
|-----------|-------|-------------|
| **Skills** | 56 | Modular instruction sets — from clean-code to frontend-design to vulnerability-scanner |
| **Agents** | 21 | Specialist role definitions — backend, frontend, mobile, security, DevOps, etc. |
| **Commands** | 15 | Slash-command workflows (`/wf_create`, `/wf_plan`, `/wf_orchestrate`, ...) |
| **Rules** | 6 | Persistent engineering constraints (code rules, design rules, request routing) |
| **Hooks** | 2 | Pre-tool-use safety validation |
| **Scripts** | 1 | Plugin content generator |

## Quick Start

### Claude Code

Copy components to your project's `.claude/` directory:

```bash
# Rules (persistent constraints)
cp -r rules/ your-project/.claude/rules/

# Commands (slash workflows)
cp -r commands/ your-project/.claude/commands/

# Settings (hooks + permissions)
cp settings.json your-project/.claude/settings.json
```

### Antigravity (agy)

Install as a plugin:

```bash
# AG Kit components are auto-discovered from the plugin directory
# See CLAUDE.md for integration instructions
```

## Architecture

```
ag-kit/
├── rules/              ← Always-active engineering constraints
│   ├── core-protocol.md
│   ├── code-rules.md
│   ├── design-rules.md
│   ├── request-routing.md
│   ├── universal-rules.md
│   └── quick-reference.md
├── skills/             ← Modular, on-demand instruction sets (56 skills)
│   ├── brainstorming/
│   ├── plan-writing/
│   ├── clean-code/
│   ├── frontend-design/
│   ├── monorepo-patterns/
│   ├── openspec-*/     ← Spec-Driven Development (SDD)
│   └── ...
├── agents/             ← Specialist role definitions (21 agents)
│   ├── orchestrator.md
│   ├── project-planner.md
│   ├── backend-specialist.md
│   ├── frontend-specialist.md
│   └── ...
├── commands/           ← Slash-command workflows (15 commands)
│   ├── wf_create.md
│   ├── wf_plan.md
│   ├── wf_fullstack.md
│   ├── wf_orchestrate.md
│   └── ...
├── hooks/              ← Safety hooks
│   ├── hooks.json
│   └── validate-tool-call.mjs
├── scripts/            ← Build utilities
│   └── generate-plugin-contents.mjs
├── memory/             ← Persistent cross-session memory
├── CLAUDE.md           ← Integration instructions
├── claude-extension.json
└── settings.json       ← Hooks, MCP, permissions config
```

## Key Workflows

| Command | Purpose |
|---------|---------|
| `/wf_brainstorm` | Explore ideas with Socratic questioning |
| `/wf_plan` | Create structured task plans with evidence-based planning |
| `/wf_create` | Implement from plan — auto-detects OpenSpec SDD |
| `/wf_enhance` | Add or update features in existing apps |
| `/wf_fullstack` | Full monorepo SDLC: branch → schema → plan → API contract → build → test |
| `/wf_orchestrate` | Multi-agent parallel execution |
| `/wf_coordinate` | Cross-domain specialist routing |
| `/wf_test` | TDD / test generation |
| `/wf_verify` | Verify by execution, not inspection |
| `/wf_deploy` | Production deployment with pre-flight checks |

## Specialist Agents

| Domain | Agent |
|--------|-------|
| Planning | `project-planner`, `product-manager`, `product-owner` |
| Backend | `backend-specialist`, `database-architect`, `api-contract` |
| Frontend | `frontend-specialist` |
| Mobile | `mobile-developer` |
| Quality | `test-engineer`, `qa-automation-engineer`, `debugger` |
| Security | `security-auditor`, `penetration-tester` |
| Operations | `devops-engineer`, `performance-optimizer` |
| Research | `explorer-agent`, `code-archaeologist` |
| Content | `documentation-writer`, `seo-specialist` |
| Games | `game-developer` |
| Orchestration | `orchestrator` |

## Anti-Hallucination System

The brainstorming and planning skills include an evidence-based planning system to prevent LLM hallucination when adding features to existing codebases:

1. **Pattern Discovery Gate** — MCP-first (`search_graph`, `query_graph`) with grep/glob fallback
2. **Evidence Blocks** — Every plan value must cite `file:line` or user confirmation
3. **CLI Question Fallback** — When no evidence is found, ask the user instead of inventing values
4. **Exit Gate Verification** — Plan cannot be finalized without evidence for all constants/configs

## OpenSpec SDD Integration

Commands auto-detect `openspec/` directory. If present, they use Spec-Driven Development with structured artifacts and change tracking. Run `openspec init --tools claude` in your project to enable SDD.

### Monorepo Support

For full-stack monorepos (Git submodule-based), specs auto-split into domain-specific files:

```
openspec/changes/<feature>/specs/<domain>/
├── backend-spec.md
├── frontend-spec.md
└── db-spec.md
```

Each workspace maintains its own `llm-full.md` and `CLAUDE.md` for context isolation.

## License

Private — internal use only.
