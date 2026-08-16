---
name: quick-reference
version: 2.0.0
priority: P2
trigger: model_decision
description: Apply when you need a fast lookup of which agents, skills, commands, or validation scripts exist — for routing decisions or recalling the master/key components of the kit.
---

# Quick Reference - AG Kit

> A fast index of the most-used agents, skills, commands, and scripts.

## Agents & Skills

- **Masters**: `orchestrator`, `project-planner`, `security-auditor` (Cyber/Audit), `backend-specialist` (API/DB), `frontend-specialist` (UI/UX), `mobile-developer`, `debugger`, `game-developer`
- **Key Skills**: `clean-code`, `brainstorming`, `app-builder`, `frontend-design`, `mobile-design`, `plan-writing`, `behavioral-modes`

## Commands (all `wf_` prefix)

| Command | Purpose | SDD Auto-detect? |
|---|---|---|
| `/wf_brainstorm` | Explore ideas, options | ✅ SDD explore mode |
| `/wf_plan` | Create plan / OpenSpec specs | ✅ Creates structured specs |
| `/wf_create` | Implement from plan/specs | ✅ Implements from OpenSpec tasks |
| `/wf_enhance` | Update existing features | ✅ Revises specs then implements |
| `/wf_orchestrate` | Multi-agent parallel execution | — |
| `/wf_coordinate` | Cross-domain specialist routing | — |
| `/wf_debug` | Systematic debugging | — |
| `/wf_test` | TDD / test generation | — |
| `/wf_test_check` | Pre-flight test readiness check | — |
| `/wf_deploy` | Deployment procedures | — |
| `/wf_verify` | Verify by execution | — |
| `/wf_preview` | Dev server management | — |
| `/wf_remember` | Persistent memory | — |
| `/wf_status` | Project status dashboard | — |

> **SDD Auto-detect:** Commands marked ✅ check for `openspec/` directory. If present, they use Spec-Driven Development. If absent, they work in classic mode.

## Key Scripts

- **Verify**: `scripts/verify_all.py`, `scripts/checklist.py`
- **Scanners**: `security_scan.py`
- **Audits**: `ux_audit.py`, `mobile_audit.py`, `lighthouse_audit.py`, `seo_checker.py`
- **Test**: `playwright_runner.py`, `test_runner.py`

---
