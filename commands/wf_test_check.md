---
name: wf_test_check
description: Pre-flight readiness check before running tests. Scans for missing MCP configs, test config files, environment setup, and dependencies. Reports what needs to be fixed. Unit tests are optional.
version: 1.0.0
requires_agents: test-engineer
requires_skills: wf-test-check, testing-patterns
artifact_outputs: test-readiness-report
---

# /wf_test_check — Test Readiness Check

> **Pre-flight diagnostic.** Reports what's missing before tests can run.
> Does NOT run tests or auto-fix anything.

## Usage

```
/wf_test_check              → Full readiness scan
/wf_test_check mcp          → MCP status only
/wf_test_check config       → Test config files only
/wf_test_check api          → API test readiness only
```

## Execution

📚 Using skill: `wf-test-check`

1. **Read** `skills/wf-test-check/SKILL.md` — follow all phases
2. **Detect** project type(s) — handle monorepo per-submodule
3. **Run** all applicable checks from Phase 2
4. **Output** readiness report (Phase 3 format)
5. **Save** report to `.wiki/{slug}/test-readiness.md` or project root

## Sub-commands

| Argument | Scope |
|----------|-------|
| *(none)* | Full scan: MCP + config + API + deps |
| `mcp` | MCP servers status only |
| `config` | Test config files only |
| `api` | API test prerequisites only |

## Key Rules

- ⚪ **Unit tests are OPTIONAL** — report as optional, never blocker
- ❌ **Missing configs are BLOCKERS** — report as must-fix
- ✅ **Don't auto-fix** — only report and suggest commands
- 📋 **Monorepo** — scan each submodule independently
