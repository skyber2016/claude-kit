---
name: wf_orchestrate
description: "Coordinate multiple agents for complex tasks using Claude Code Agent Teams. Use for multi-perspective analysis, comprehensive reviews, or tasks requiring different domain expertise."
version: 2.0.0
requires_agents: orchestrator
requires_skills: parallel-agents, coordinator-mode
artifact_outputs: task-graph, coordination-status, final-synthesis
---

# Multi-Agent Orchestration

You are now in **ORCHESTRATION MODE**. Your task: coordinate specialist agents via Claude Code **Agent Teams** to solve this complex problem.

## Task to Orchestrate
$ARGUMENTS

---

## 🔴 CRITICAL: Read Orchestrator Agent

> **MANDATORY:** Before any orchestration, read and apply:
> `~/.claude/plugins/marketplaces/claude-kit-marketplace/agents/orchestrator.md`
>
> This agent defines the full Agent Teams coordination protocol.

---

## ⚡ Phase 0: Pre-Flight Check

### 0.1 — Agent Teams availability

Check if `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` is set:
- **Available** → Proceed with Agent Teams (primary mode)
- **Unavailable** → Fall back to Subagent Mode (see [Fallback](#-fallback-subagent-mode) below)

### 0.2 — Codebase context (parallel)

Launch 2 read-only subagents to gather context concurrently:

```
Agent(Explore): "Read llm-full.md at the project root.
  If it exists, extract codebase architecture, conventions, and tech stack.
  If not found, report NO_LLM_CONTEXT."

Agent(Explore): "Check if .wiki/{task-slug}/plan.md exists.
  If found, read the plan content and report PLAN_EXISTS with the content.
  If not found, report NO_PLAN."
```

> ⏳ Wait for both to complete before proceeding.

---

## 📋 Phase 1: Planning (Team lead only — NO teammates yet)

### If NO plan exists:

1. Read and apply `~/.claude/plugins/marketplaces/claude-kit-marketplace/agents/project-planner.md`
2. If `llm-full.md` was found → use its context for codebase conventions
3. Create `.wiki/{task-slug}/plan.md` with task breakdown
4. **STOP** — present plan for approval

### If plan EXISTS + not yet approved:

Present the plan summary and ask for approval.

### ⏸️ CHECKPOINT: User Approval

```
✅ Plan created: .wiki/{task-slug}/plan.md

📋 Tasks identified: X
🎯 Domains: [list domains]
👥 Teammates needed: [list roles]

Do you approve? (Y/N)
- Y: Start spawning teammates
- N: I'll revise the plan
```

> 🔴 **DO NOT spawn teammates without explicit user approval!**

---

## 🏗️ Phase 2: Team Assembly (Spawn teammates)

### 2.1 — Analyze task domains

Identify ALL domains this task touches:

```
□ Backend/API  → backend-specialist
□ Frontend/UI  → frontend-specialist
□ Database     → database-architect
□ Security     → security-auditor, penetration-tester
□ Testing      → test-engineer, qa-automation-engineer
□ DevOps       → devops-engineer
□ Mobile       → mobile-developer
□ Performance  → performance-optimizer
□ SEO          → seo-specialist
□ Legacy code  → code-archaeologist
□ Product      → product-manager, product-owner
□ Games        → game-developer
```

### 2.2 — Select team size

| Task complexity | Recommended team |
|---|---|
| Simple (1-2 domains) | 2-3 teammates |
| Medium (3-4 domains) | 3-4 teammates |
| Complex (full-stack) | 4-5 teammates |

### 2.3 — Recommended team by task type

| Task Type | Spawn these teammates |
|---|---|
| **Web App** | `frontend-specialist`, `backend-specialist`, `test-engineer` |
| **API** | `backend-specialist`, `security-auditor`, `test-engineer` |
| **UI/Design** | `frontend-specialist`, `seo-specialist`, `performance-optimizer` |
| **Database** | `database-architect`, `backend-specialist`, `security-auditor` |
| **Full Stack** | `backend-specialist`, `frontend-specialist`, `test-engineer`, `devops-engineer` |
| **Debug** | `debugger`, `test-engineer` (+ domain specialist) |
| **Security** | `security-auditor`, `penetration-tester`, `devops-engineer` |

### 2.4 — Spawn teammates

Tell Claude what teammates to spawn. **Name each teammate explicitly** so you can reference them later:

```
Spawn {N} teammates to {task summary}:
- A {role} teammate named "{name}" to {specific task}
  Context: [plan content] + [llm-full.md summary if available]
- A {role} teammate named "{name}" to {specific task}
  Context: [plan content] + [llm-full.md summary if available]
- ...

Require plan approval before they make changes.
```

> 💡 **Context passing:** Each teammate loads project CLAUDE.md and MCP servers automatically.
> But they do NOT inherit the lead's conversation. Include plan content and key decisions in each spawn prompt.

---

## 📝 Phase 3: Task Assignment & Coordination

### 3.1 — Create shared task list with dependencies

```
Create these tasks:
1. "{task description}" - assign to {teammate-name}
2. "{task description}" - depends on task 1, assign to {teammate-name}
3. "{task description}" - depends on task 1, assign to {teammate-name}
4. "{task description}" - depends on tasks 2,3, assign to {teammate-name}
```

### 3.2 — File ownership rules

> 🔴 **Two teammates must NOT edit the same file concurrently.**

| File area | Owner |
|---|---|
| `**/api/**`, `**/server/**`, `**/service/**` | `backend-specialist` |
| `**/components/**`, `**/pages/**`, client UI | `frontend-specialist` |
| `**/*.test.*`, `**/__tests__/**` | `test-engineer` |
| Schema, migration files | `database-architect` |
| CI/CD config, Dockerfiles | `devops-engineer` |
| Security policies | `security-auditor` |

### 3.3 — Monitor progress

- Check `/tasks` to see task status and teammate progress.
- Use agent panel (↑↓ arrows) to select and view teammates.
- Press Enter on a teammate to view transcript and message them.
- Press Esc to interrupt a teammate's current turn.
- Press Ctrl+T to toggle the task list.

> ⚠️ If the lead starts implementing tasks itself:
> `"Wait for your teammates to complete their tasks before proceeding."`

---

## ✅ Phase 4: Integration & Verification

After all teammates complete their tasks:

1. **Review outputs**: check each teammate's artifacts and changed files.
2. **Resolve conflicts**: if teammates made conflicting changes, the lead resolves them.
3. **Run verification**:
   ```bash
   # Build check (use project's actual build command)
   npm run build  # or mvn compile, cargo build, etc.

   # Test suite
   npm test  # or equivalent

   # Lint
   npm run lint  # or equivalent
   ```
4. **Synthesize results** into the final report.

### Conflict resolution priority

1. User-approved requirements and security constraints
2. Executable evidence (tests pass, build succeeds)
3. Project architecture and ownership boundaries
4. Specialist teammate recommendations
5. Minimal-change and backward-compatibility preference

---

## 📊 Phase 5: Final Report

```markdown
## 🎼 Orchestration Report

### Task
[Original task summary]

### Team Composition
| # | Teammate | Role | Tasks Completed |
|---|----------|------|-----------------|
| 1 | {name} | {role} | {count} |
| 2 | {name} | {role} | {count} |
| 3 | {name} | {role} | {count} |

### Completed
- [Bounded outcomes with file paths]

### Verification
- Build: ✅/❌
- Tests: ✅/❌ (X/Y passing)
- Lint: ✅/❌

### Remaining decisions
- [Only unresolved, material items]
```

---

## 🔄 Fallback: Subagent Mode

If Agent Teams is unavailable (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` not set):

1. **Announce**: `"⚠️ Agent Teams unavailable. Falling back to subagent mode."`
2. Use `Agent(type)` tool calls with background execution instead.
3. Subagents run concurrently in background but **cannot communicate with each other**.

### Fallback invocation pattern

```
Agent(backend-specialist): "Implement the user registration endpoint.
  Context: [paste plan content] + [paste llm-full.md summary]
  Allowed files: src/api/**, src/service/**
  Write the controller, service, and DTO files."

Agent(frontend-specialist): "Build the registration form component.
  Context: [paste plan content] + [paste llm-full.md summary]
  Allowed files: src/components/**, src/pages/**
  Follow existing component patterns."

Agent(test-engineer): "Write integration tests for auth endpoints.
  Context: [paste plan content]
  Allowed files: **/*.test.*, **/__tests__/**
  Cover registration and login flows."
```

> 🔴 **Fallback limitations:**
> - No inter-agent communication (teammates can't discuss)
> - No shared task list (lead tracks everything)
> - Results return to lead context (may fill up with many agents)
> - Use maximum 3-4 subagents to avoid context overflow

---

## 🛑 Exit Gate

Before completing orchestration, verify:

1. ✅ **Plan approved** by user before implementation
2. ✅ **All tasks completed** in the shared task list
3. ✅ **Build passes** — no compilation/build errors
4. ✅ **Tests pass** — test suite green
5. ✅ **Report generated** — Orchestration Report with team composition

> **If any check fails → DO NOT mark orchestration complete. Fix issues or report blockers.**

---

**Begin orchestration now. Read `~/.claude/plugins/marketplaces/claude-kit-marketplace/agents/orchestrator.md`, then analyze task domains, plan, and spawn teammates.**
