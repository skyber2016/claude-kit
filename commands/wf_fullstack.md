---
name: wf_fullstack
description: "Full-stack monorepo development workflow. Orchestrates the complete SDLC: git branch → database schema → planning → API contract → backend + frontend (parallel) → testing → archive. Auto-detects monorepo via git submodule. Falls back to single-repo mode."
version: 2.0.0
requires_agents: orchestrator, backend-specialist, frontend-specialist, database-architect, api-contract, test-engineer, devops-engineer
requires_skills: monorepo-patterns, openapi-contract, plan-writing, parallel-agents, openspec-review
artifact_outputs: feature-branch, db-schema, openapi-contract, implementation, test-report
---

# /wf_fullstack — Full-Stack Feature Development

$ARGUMENTS

---

## 🔀 MANDATORY FIRST STEP: Resume Detection

Parse `$ARGUMENTS`:

| Pattern | Action |
|---------|--------|
| `resume <name>` | → **RESUME Mode** — read `.wiki/<name>/README.md` progress, jump to next incomplete phase |
| `<anything else>` | → Proceed to Repo Mode Detection below |

### RESUME Mode

**Trigger:** `/wf_fullstack resume <name>`

1. **Read** `.wiki/<name>/README.md` → find `## Progress` section
2. **Parse** checkboxes to determine last completed phase:

```bash
grep -n "\- \[x\]\|\- \[ \]" .wiki/<name>/README.md
```

3. **Jump** to the first unchecked `- [ ]` phase
4. **Re-gather context** (run Phase 0 again — fast, parallel)
5. **Announce:**
```
🔄 Resuming feature '<name>' from Phase X: <phase-name>

Completed:
✅ Phase 0: Context
✅ Phase 1: Git Branch
✅ Phase 2: Planning
⬜ Phase 3: DB Schema ← resuming here
⬜ Phase 4: API Contract
⬜ Phase 5: Implementation
⬜ Phase 6: Testing
⬜ Phase 7: Final API
⬜ Phase 8: Archive
```

6. **Continue** from that phase with fresh context

> 🔴 **RULE:** ALWAYS re-run Phase 0 (Context Gathering) on resume.
> Context is cheap, stale context is dangerous.

---

## 🔀 Repo Mode Detection

```bash
git submodule status
```

| Result | Mode | Action |
|--------|------|--------|
| Has entries | **MONOREPO** | → Jump to **MONOREPO Flow** |
| Empty | **SINGLE REPO** | → Jump to **SINGLE REPO Flow** |

Announce detected mode:
- `"🏗️ MONOREPO detected (git submodules: <list>) → Full-stack orchestration mode"`
- `"📦 SINGLE REPO detected → Standard wf_create + wf_api_contract flow"`

---

## 📦 SINGLE REPO FLOW

> Standard workflow — delegate to existing commands.

```
1. Run /wf_plan <arguments>          ← Create plan/specs
2. Run /wf_plan review <name>        ← [Optional] Tech lead review gate
3. Run /wf_api_contract <name>       ← DRAFT openapi.yaml from plan
4. Run /wf_create <name>             ← Implement (backend then frontend)
5. Run /wf_verify                    ← Verify
6. Run /wf_test                      ← Test
7. Run /wf_remember                  ← Archive
```

Announce: `"📦 Single repo — running standard workflow. Start with /wf_plan <name>."`

**STOP** — do not continue to monorepo flow.

---

## 🏗️ MONOREPO FLOW — Full Orchestration

### ⚡ Phase 0: Context Gathering (Parallel)

Each submodule has its **own** `llm-full.md` and `CLAUDE.md`. These must be read **per workspace**, not from root only.

Invoke **5 subagents via Agent tool** (concurrent background):

| # | Agent | Task |
|---|-------|------|
| 🅰 | `Explore` | Detect submodules + read ROOT context files |
| 🅱 | `Explore` | Read `apps/backend/llm-full.md` + `apps/backend/CLAUDE.md` |
| 🅲 | `Explore` | Read `apps/frontend/llm-full.md` + `apps/frontend/CLAUDE.md` |
| 🅳 | `Explore` | Check OpenSpec mode + read SRS |
| 🅴 | `Explore` | Read monorepo-patterns skill |

```
Agent(Explore) [🅰 — Repo Structure]: "
  1. Run: git submodule status
     → Return list of {path, name, branch} for each submodule
  2. Run: git config --file .gitmodules --get-regexp path
     → Return all submodule path entries
  3. Try read: llm-full.md at root (return ROOT_NO_LLM if missing)
  4. Try read: CLAUDE.md at root (return ROOT_NO_CLAUDE if missing)
  Return: {submodules: [...], root_llm: '...', root_claude: '...'}"

Agent(Explore) [🅱 — Backend Context]: "
  IMPORTANT: This is a git submodule. Read context FROM INSIDE the submodule directory.

  1. Try read: apps/backend/llm-full.md
     → If found: extract tech stack, package structure, coding conventions, DB config
     → If not found: return BACKEND_NO_LLM (will rely on CLAUDE.md + auto-detection)
  2. Try read: apps/backend/CLAUDE.md
     → If found: extract agent instructions, forbidden patterns, project rules
     → If not found: return BACKEND_NO_CLAUDE
  3. Auto-detect framework:
     - If apps/backend/pom.xml exists → Spring Boot (Maven)
     - If apps/backend/build.gradle exists → Spring Boot (Gradle)
     - If apps/backend/*.csproj exists → .NET Core
  4. Detect DB config:
     - Read apps/backend/src/main/resources/application.yml or application.properties
     - Or apps/backend/appsettings.json (.NET)
     - Extract: datasource URL, driver, dialect
  Return: {llm: '...', claude: '...', framework: 'spring-boot|dotnet', db: 'oracle|postgresql|mongodb', db_config: '...'}"

Agent(Explore) [🅲 — Frontend Context]: "
  IMPORTANT: This is a git submodule. Read context FROM INSIDE the submodule directory.

  1. Try read: apps/frontend/llm-full.md
     → If found: extract Angular version, module structure, state management, API base URL config
     → If not found: return FRONTEND_NO_LLM
  2. Try read: apps/frontend/CLAUDE.md
     → If found: extract agent instructions, style guidelines, forbidden patterns
     → If not found: return FRONTEND_NO_CLAUDE
  3. Auto-detect:
     - Read apps/frontend/package.json → extract Angular version, key dependencies
     - Read apps/frontend/angular.json → extract project name, build config
     - Read apps/frontend/src/environments/environment.ts → extract apiUrl
  Return: {llm: '...', claude: '...', ng_version: '...', api_base_url: '...', state_lib: 'ngrx|signals|...'}"

Agent(Explore) [🅳 — SRS + OpenSpec]: "
  1. Check openspec/ directory exists → SDD_MODE or CLASSIC_MODE
  2. If SDD_MODE: run 'openspec list --json' → return active changes
  3. Search .wiki/*/srs.md for topic matching '<arguments>' → return SRS content if found
  Return: {mode: 'SDD|CLASSIC', active_changes: [...], srs: '...'}"

Agent(Explore) [🅴 — Monorepo Patterns]: "
  Read: ~/.claude/plugins/marketplaces/claude-kit-marketplace/skills/monorepo-patterns/SKILL.md
  Extract:
  - Branch naming convention
  - File ownership rules per workspace
  - Build commands per workspace (backend + frontend)
  - Submodule sync commands
  Return: extracted rules as structured summary."
```

> ⏳ **Wait for ALL 5 subagents to complete.**

### Context Assembly (after Phase 0)

Assemble a **Workspace Context Map** for use in all subsequent phases:

```
WORKSPACE_CONTEXT = {
  root: {
    llm: <from 🅰>,
    claude: <from 🅰>,
    submodules: [{path, name, branch}, ...]
  },
  backend: {
    path: "apps/backend",           ← from 🅰 submodule list
    llm: <from 🅱 llm-full.md>,
    claude: <from 🅱 CLAUDE.md>,
    framework: "spring-boot|dotnet",
    db: "oracle|postgresql|mongodb",
    db_config: <connection string summary>
  },
  frontend: {
    path: "apps/frontend",          ← from 🅰 submodule list
    llm: <from 🅲 llm-full.md>,
    claude: <from 🅲 CLAUDE.md>,
    ng_version: "...",
    api_base_url: "...",
    state_lib: "ngrx|signals"
  },
  srs: <from 🅳>,
  openspec_mode: <from 🅳>,
  monorepo_rules: <from 🅴>
}
```

> 🔴 **RULE:** When spawning any agent for a specific workspace (backend/frontend/db), ALWAYS pass that workspace's `llm` + `claude` context, NOT the root context. Root context is only fallback when workspace has no `llm-full.md`.

---

### 📊 Progress Tracker (MANDATORY — created in Phase 1)

After creating the feature branch, **create or update** `.wiki/<feature-name>/README.md` with progress section:

```markdown
# <Feature Name>

## Status: 🚧 In Progress

## Progress

- [x] Phase 0: Context Gathering
- [x] Phase 1: Git Branch Setup
- [ ] Phase 2: Planning
- [ ] Phase 2.5: Tech Lead Review
- [ ] Phase 3: Database Schema
- [ ] Phase 4: API Contract (DRAFT)
- [ ] Phase 5: Implementation (Backend + Frontend)
- [ ] Phase 6: Testing
- [ ] Phase 7: API Contract (FINAL)
- [ ] Phase 8: Archive

## Phase Log

| Phase | Status | Timestamp | Commit |
|-------|--------|-----------|--------|
| Phase 0 | ✅ Done | YYYY-MM-DD HH:mm | — |
| Phase 1 | ✅ Done | YYYY-MM-DD HH:mm | abc1234 |
```

> 🔴 **After EACH phase completes:**
> 1. Update the checkbox: `- [ ]` → `- [x]`
> 2. Add row to Phase Log table with timestamp and commit hash
> 3. This enables `/wf_fullstack resume <name>` to detect where to continue

---

### 🔄 Auto-Commit Protocol (MANDATORY)

> Commit after every phase that produces artifacts. This ensures progress is never lost
> when user stops to switch model, takes a break, or session expires.

| After Phase | Commit Message | What's committed |
|-------------|---------------|------------------|
| Phase 1 | `chore(<name>): init feature branch` | Branch setup, README progress |
| Phase 2 | `docs(<name>): planning artifacts` | plan.md / OpenSpec proposal + specs + design + tasks |
| Phase 2.5 | `docs(<name>): tech lead review` | review.md (if review was run) |
| Phase 3 | `feat(<name>): database schema` | Migration files, db-spec |
| Phase 4 | `docs(<name>): draft API contract` | openapi.yaml DRAFT |
| Phase 5 | `feat(<name>): implementation` | Backend + Frontend code (per submodule) |
| Phase 6 | `test(<name>): test results` | Test files, report.md |
| Phase 7 | `docs(<name>): final API contract` | openapi.yaml FINAL |
| Phase 8 | `chore(<name>): archive` | OpenSpec archive, final status |

**Commit procedure (after each phase):**

```bash
# 1. Stage all changes
git add -A

# 2. Commit with phase-specific message
git commit -m "<message from table above>"

# 3. For monorepo — also commit in submodules if they changed
git -C apps/backend add -A && git -C apps/backend commit -m "<message>" --allow-empty 2>/dev/null
git -C apps/frontend add -A && git -C apps/frontend commit -m "<message>" --allow-empty 2>/dev/null

# 4. Update root to track submodule commits
git add apps/backend apps/frontend
git commit --amend --no-edit 2>/dev/null
```

> 💡 **Why commit after every phase?** User may stop at any point to switch model.
> Without commits, all work in that session is lost. Commits = save points.

---

### 🌿 Phase 1: Git Branch Setup (Sequential — requires confirmation)

#### 1.1 — Derive feature name

From `$ARGUMENTS` or SRS folder name → kebab-case feature name: `<feature-name>`

#### 1.2 — Propose branch

```
🌿 Git Branch Plan

Feature: <feature-name>
Branch: feature/<feature-name>

Submodules detected:
  - apps/backend  → feature/<feature-name>
  - apps/frontend → feature/<feature-name>
  (+ any others from 🅰)

Commands that will run:
  git checkout -b feature/<feature-name>
  git submodule foreach "git checkout -b feature/<feature-name>"
  git add -A && git commit -m "chore: init feature/<feature-name> branches"

⚠️ CHECKPOINT: Confirm before creating branches? (Y/N)
```

> 🔴 **DO NOT create branches without user confirmation.**

#### 1.3 — Execute on confirmation

```bash
# Create branch in root
git checkout -b feature/<feature-name>

# Create branch in all submodules
git submodule foreach "git checkout -b feature/<feature-name> 2>/dev/null || git checkout feature/<feature-name>"

# Commit root tracking
git add -A
git commit -m "chore: init feature/<feature-name> branches in submodules"
```

Announce: `"✅ Branch feature/<feature-name> created in root + all submodules"`

---

### 📋 Phase 2: Planning (mode-dependent)

#### CLASSIC_MODE — Create plan.md

Delegate to existing `wf_plan` logic:
- Read SRS (from 🅱) → create `.wiki/<feature-name>/plan.md`
- Announce: `"📋 Plan created: .wiki/<feature-name>/plan.md"`

#### SDD_MODE — Create OpenSpec change with Monorepo structure

1. **Create the change:**
   ```bash
   openspec new change "<feature-name>"
   ```

2. **Generate planning artifacts in parallel** (3 subagents):

   ```
   Agent(general-purpose): "Create proposal.md for OpenSpec change '<feature-name>'.
     Context: [SRS content from 🅱] + [llm-full.md summary from 🅱]
     Run: openspec instructions proposal --change '<feature-name>' --json
     Write proposal.md (what & why, reference SRS Use Case IDs)."

   Agent(general-purpose): "Create domain-split specs for OpenSpec change '<feature-name>' (MONOREPO mode).
     Context: [SRS content from 🅱] + [llm-full.md summary from 🅱]
     Run: openspec instructions specs --change '<feature-name>' --json

     Create these files inside openspec/changes/<feature-name>/specs/<domain>/:
       - backend-spec.md: Endpoints, JPA entities, business rules, error codes, acceptance criteria
       - frontend-spec.md: Angular components, services, routes, state management, acceptance criteria
       - db-spec.md: Schema changes (Oracle/PostgreSQL/MongoDB), indexes, migration plan, rollback plan

     Use the spec templates from the monorepo-patterns skill."

   Agent(general-purpose): "Create design.md and tasks.md for OpenSpec change '<feature-name>'.
     Context: [SRS content] + [llm-full.md summary]
     Run: openspec instructions design --change '<feature-name>' --json
     Run: openspec instructions tasks --change '<feature-name>' --json

     In tasks.md, organize tasks by workspace:
     ## Phase 0: Git & Database
     ## Phase 1: API Contract (mock)
     ## Phase 2A: Backend (apps/backend)
     ## Phase 2B: Frontend (apps/frontend)
     ## Phase 2C: Database Migration
     ## Phase 3: Testing
     ## Phase 4: Archive"
   ```

3. **After planning artifacts created:**

   Announce:
   ```
   ✅ OpenSpec change created: <feature-name> (MONOREPO mode)

   📦 Change artifacts:
   - proposal.md ✅
   - specs/<domain>/backend-spec.md ✅
   - specs/<domain>/frontend-spec.md ✅
   - specs/<domain>/db-spec.md ✅
   - design.md ✅
   - tasks.md ✅

   ⚠️ CHECKPOINT: Review specs before proceeding? (Y/N/review)
   - Y → proceed to Phase 3
   - N → abort
   - review → run tech lead review first, then proceed
   ```

> 🔴 **DO NOT proceed to Phase 3 without checkpoint confirmation.**

### 🔍 Phase 2.5: Tech Lead Review (Optional — user triggered)

> **Trigger:** User responds `review` at the Phase 2 checkpoint.
> **Skip:** If user responds `Y` — go straight to Phase 3.

📚 Using skill: `openspec-review`

If SDD_MODE and user chose `review`:

```
Agent(general-purpose): "Run tech lead review for OpenSpec change '<name>'.
  Read skills/openspec-review/SKILL.md and follow full protocol.
  Load artifacts: openspec/changes/<name>/proposal.md, design.md, tasks.md, specs/*.md
  Run 6-lens analysis, pre-mortem, Socratic openings.
  Output verdict: READY / READY WITH CAVEATS / NOT READY / RETHINK.
  Save report to openspec/changes/<name>/review.md
  DO NOT modify any artifact files — read-only review."
```

| Verdict | Action |
|---------|--------|
| **READY** | → Proceed to Phase 3 |
| **READY WITH CAVEATS** | → Show findings, ask user to confirm proceed or fix |
| **NOT READY** | → Show critical findings, return to Phase 2 for revision |
| **RETHINK** | → Abort, suggest `/wf_plan <name>` to re-plan |

---

### 🗄️ Phase 3: Database Schema (Sequential — before code)

Invoke **database-architect agent** with **backend workspace context**:

```
Agent(database-architect): "Create database schema for feature '<feature-name>'.
  Mode: MONOREPO
  Workspace: apps/backend

  ── WORKSPACE CONTEXT (from WORKSPACE_CONTEXT.backend) ──
  llm-full.md: [paste WORKSPACE_CONTEXT.backend.llm — NOT root llm]
  CLAUDE.md:   [paste WORKSPACE_CONTEXT.backend.claude — NOT root claude]
  Framework:   [WORKSPACE_CONTEXT.backend.framework]
  Database:    [WORKSPACE_CONTEXT.backend.db]
  DB Config:   [WORKSPACE_CONTEXT.backend.db_config]

  Input spec:
  - db-spec.md: <content from Phase 2>

  Tasks:
  1. Read db-spec.md for schema requirements
  2. Use database type from WORKSPACE_CONTEXT.backend.db (Oracle / PostgreSQL / MongoDB)
     → Do NOT guess — use the actual DB from llm-full.md / application.yml
  3. Follow coding conventions from CLAUDE.md (naming, migration tool, package structure)
  4. Generate:
     - If Oracle/PostgreSQL: Flyway migration SQL in apps/backend/src/main/resources/db/migration/
       File naming: V<timestamp>__<description>.sql (e.g. V20240814_001__create_user_table.sql)
     - If MongoDB: Collection validation JSON in apps/backend/src/main/resources/mongo/
  5. Document schema decisions in db-spec.md (update the file)
  6. Return: list of files created + summary"
```

> ⏳ **Wait for database-architect to complete before Phase 4.**

---

### 📄 Phase 4: API Contract — DRAFT (Sequential, fast)

Invoke **api-contract agent** with **backend workspace context**:

```
Agent(api-contract): "Generate DRAFT openapi.yaml for feature '<feature-name>' (MONOREPO mode).

  ── WORKSPACE CONTEXT (from WORKSPACE_CONTEXT.backend) ──
  llm-full.md: [paste WORKSPACE_CONTEXT.backend.llm]
  Framework:   [WORKSPACE_CONTEXT.backend.framework]
  DB:          [WORKSPACE_CONTEXT.backend.db]
  API base URL (from frontend): [WORKSPACE_CONTEXT.frontend.api_base_url]

  Input specs:
  - backend-spec.md: <content>
  - db-spec.md: <content>

  Instructions:
  1. Read openapi-contract skill for conventions
  2. Map all endpoints from backend-spec.md to OpenAPI paths
  3. Create schemas from JPA entities / data models in db-spec.md
  4. Set servers[0].url = WORKSPACE_CONTEXT.frontend.api_base_url (or http://localhost:8080 if missing)
  5. Set info.description: 'Status: DRAFT (MONOREPO) — generated from specs, not yet from code'
  6. Save to:
     - .wiki/<feature-name>/openapi.yaml (primary)
     - openspec/changes/<feature-name>/openapi.yaml (if SDD_MODE)
  7. Return summary: endpoint count, schema count"
```

Announce: `"📄 DRAFT openapi.yaml ready (servers.url = <api_base_url>) → Backend and Frontend will start in parallel"`

> ⏳ **Wait for api-contract agent before Phase 5.**

---

### ⚡ Phase 5: Parallel Implementation (FULL PARALLEL)

> 🔴 Read file ownership rules from `WORKSPACE_CONTEXT.monorepo_rules` before spawning.
> Two agents must NOT edit the same file.
> Each teammate receives **its own workspace's** `llm-full.md` + `CLAUDE.md` — NOT root.

Spawn **3 teammates via Agent Teams**:

```
Spawn 3 teammates to implement feature '<feature-name>':

- A backend-specialist teammate named "backend" to implement in apps/backend:

  ── WORKSPACE CONTEXT ──
  llm-full.md:  [paste WORKSPACE_CONTEXT.backend.llm in full]
  CLAUDE.md:    [paste WORKSPACE_CONTEXT.backend.claude in full]
  Framework:    [WORKSPACE_CONTEXT.backend.framework]  ← spring-boot OR dotnet
  Database:     [WORKSPACE_CONTEXT.backend.db]          ← oracle / postgresql / mongodb
  DB Config:    [WORKSPACE_CONTEXT.backend.db_config]

  Specs:
  - backend-spec.md: [paste content]
  - openapi.yaml: [paste content]
  - Note: DB migration already done in Phase 3. Follow existing schema.

  Allowed files: apps/backend/**
  DO NOT touch: apps/backend/src/main/resources/db/** (owned by dba teammate)
  DO NOT touch: apps/frontend/** (owned by frontend teammate)

  Tasks:
  1. Follow package structure from llm-full.md (do NOT invent new package names)
  2. Follow coding conventions from CLAUDE.md (naming, annotations, patterns)
  3. Implement all endpoints from backend-spec.md
  4. Create JPA entities / EF Core entities matching the migration schema from Phase 3
  5. Implement repositories, services, controllers, DTOs + MapStruct/AutoMapper
  6. Add @Valid / FluentValidation matching openapi.yaml constraints
  7. Add @ControllerAdvice / IExceptionHandler for error responses
  8. Mark tasks complete in openspec/changes/<name>/tasks.md (Phase 2A section)

- A frontend-specialist teammate named "frontend" to implement in apps/frontend:

  ── WORKSPACE CONTEXT ──
  llm-full.md:  [paste WORKSPACE_CONTEXT.frontend.llm in full]
  CLAUDE.md:    [paste WORKSPACE_CONTEXT.frontend.claude in full]
  Angular version: [WORKSPACE_CONTEXT.frontend.ng_version]
  API base URL: [WORKSPACE_CONTEXT.frontend.api_base_url]
  State lib:    [WORKSPACE_CONTEXT.frontend.state_lib]

  Specs:
  - frontend-spec.md: [paste content]
  - openapi.yaml: [paste content — treat as contract, backend may not be ready yet]

  Allowed files: apps/frontend/**
  DO NOT touch: apps/backend/** (owned by backend/dba teammates)

  Tasks:
  1. Follow module/component structure from llm-full.md (do NOT invent new folder names)
  2. Follow coding conventions from CLAUDE.md (naming, imports, style)
  3. Create Angular components, services, routes from frontend-spec.md
  4. Set up HttpClient services calling endpoints from openapi.yaml
     → Use api_base_url from environment.ts — do NOT hardcode localhost
  5. Use openapi.yaml schemas to type API responses (TypeScript interfaces)
  6. Use state_lib from context (Signals / NgRx) — do NOT switch libraries
  7. Mark tasks complete in openspec/changes/<name>/tasks.md (Phase 2B section)

- A database-architect teammate named "dba" to finalize DB in apps/backend/src/main/resources:

  ── WORKSPACE CONTEXT ──
  llm-full.md:  [paste WORKSPACE_CONTEXT.backend.llm]
  CLAUDE.md:    [paste WORKSPACE_CONTEXT.backend.claude]
  Database:     [WORKSPACE_CONTEXT.backend.db]
  DB Config:    [WORKSPACE_CONTEXT.backend.db_config]

  Specs:
  - db-spec.md: [paste content]
  - openapi.yaml: [paste content]

  Allowed files: apps/backend/src/main/resources/**
  DO NOT touch: apps/backend/src/main/java/** (owned by backend teammate)
  DO NOT touch: apps/frontend/** (owned by frontend teammate)

  Tasks:
  1. Verify migration files are consistent with openapi.yaml schemas
  2. Add any missing indexes based on query patterns in backend-spec.md
  3. Add DB-specific constraints (Oracle: VARCHAR2 CHAR, timestamp types; PG: proper types; MongoDB: TTL indexes)
  4. Update db-spec.md with final schema decisions
  5. Mark tasks complete in openspec/changes/<name>/tasks.md (Phase 2C section)

Require plan approval before they make changes.
```

### Phase 5 — File Ownership Enforcement

| File Area | Owner |
|-----------|-------|
| `apps/backend/src/main/java/**` | backend teammate |
| `apps/backend/src/main/resources/db/**` | dba teammate |
| `apps/backend/src/test/**` | test-engineer (Phase 6) |
| `apps/frontend/src/**` (except *.spec.ts) | frontend teammate |
| `apps/frontend/src/**/*.spec.ts` | test-engineer (Phase 6) |
| `openspec/changes/<name>/tasks.md` | ALL (append only, different sections) |
| `.wiki/<name>/openapi.yaml` | api-contract agent (readonly for others) |

> ⏳ **Wait for ALL 3 teammates to complete before Phase 6.**

---

### 🧪 Phase 6: Testing (Sequential after parallel)

After all Phase 5 teammates complete, invoke **test-engineer** with **both workspace contexts**:

```
Agent(test-engineer): "Write and run tests for feature '<feature-name>' (MONOREPO).

  ── BACKEND WORKSPACE CONTEXT ──
  llm-full.md: [paste WORKSPACE_CONTEXT.backend.llm]
  CLAUDE.md:   [paste WORKSPACE_CONTEXT.backend.claude]
  Framework:   [WORKSPACE_CONTEXT.backend.framework]
  Database:    [WORKSPACE_CONTEXT.backend.db]

  ── FRONTEND WORKSPACE CONTEXT ──
  llm-full.md: [paste WORKSPACE_CONTEXT.frontend.llm]
  CLAUDE.md:   [paste WORKSPACE_CONTEXT.frontend.claude]
  Angular:     [WORKSPACE_CONTEXT.frontend.ng_version]

  Backend tests (apps/backend):
  - Follow test conventions from WORKSPACE_CONTEXT.backend.claude (existing test patterns)
  - Write JUnit 5 unit tests for all new service methods
  - Write @WebMvcTest for all new controllers
  - Write @DataJpaTest for all new repositories
  - Build command:
    → If framework = spring-boot (Maven): cd apps/backend && mvn test
    → If framework = spring-boot (Gradle): cd apps/backend && ./gradlew test
    → If framework = dotnet: cd apps/backend && dotnet test

  Frontend tests (apps/frontend):
  - Follow test conventions from WORKSPACE_CONTEXT.frontend.claude
  - Write Jasmine/Jest unit tests for all new services and components
  - Set up TestBed correctly for Angular DI
  - Build command: cd apps/frontend && ng test --no-watch

  Integration (if docker-compose.yml exists at root):
  - Start: docker compose up -d
  - Run E2E: cd apps/frontend && npx playwright test (or ng e2e)

  Return: test report with pass/fail per workspace."
```

> ⏳ **Wait for test-engineer to complete.**

---

### ✅ Phase 7: API Contract — FINAL Export

Now that backend is implemented, update the contract:

```
Agent(api-contract): "Generate FINAL openapi.yaml for feature '<feature-name>' from implemented code.
  Scan: apps/backend/src/main/java/**/*Controller.java (or .NET equivalent)
  Update: .wiki/<feature-name>/openapi.yaml with Status: FINAL
  Update: openspec/changes/<feature-name>/openapi.yaml (if SDD_MODE)"
```

---

### 📦 Phase 8: Archive

```bash
# Archive OpenSpec change (if SDD_MODE)
openspec archive --change "<feature-name>"
```

**Update `.wiki/<feature-name>/README.md`:**
- Mark `- [x] Phase 8: Archive`
- Change `## Status: 🚧 In Progress` → `## Status: ✅ Complete`
- Add final row to Phase Log

**Auto-commit** (follow Auto-Commit Protocol):
```bash
git add -A && git commit -m "chore(<feature-name>): archive"
# + submodule commits per protocol
```

Announce:
```
🎉 Feature '<feature-name>' Complete!

📊 Summary:
- Branch: feature/<feature-name> (root + submodules)
- Database: <N> migration files created
- API Contract: .wiki/<feature-name>/openapi.yaml (FINAL)
- Backend: apps/backend — <N> endpoints implemented
- Frontend: apps/frontend — <N> components created
- Tests: Backend ✅/❌ | Frontend ✅/❌ | E2E ✅/❌
- Commits: <N> phase commits on feature branch

Next steps:
1. Review changes: git diff main feature/<feature-name>
2. Create PR: gh pr create --base main --head feature/<feature-name>
3. Or continue with /wf_deploy when ready
```

---

## Examples

```bash
# Full-stack feature from SRS
/wf_fullstack ngan-hang-thu-huong

# Full-stack with description
/wf_fullstack add user management module

# Resume after switching model (reads progress from README.md)
/wf_fullstack resume ngan-hang-thu-huong

# Auto-detect and proceed
/wf_fullstack
```

---

## Full Workflow Diagram

```
/wf_fullstack <name>
    │
    ├── git submodule status
    │   ├── MONOREPO → Full orchestration
    │   └── SINGLE REPO → delegate to wf_plan + wf_create
    │
    ├── Phase 0: Context (4 parallel agents)
    ├── Phase 1: Git branch (sequential + checkpoint ✋)
    ├── Phase 2: Planning (CLASSIC: plan.md / SDD: OpenSpec + domain specs + checkpoint ✋)
    ├── Phase 2.5: Tech Lead Review (optional — user chooses at checkpoint)
    ├── Phase 3: DB Schema (sequential)
    ├── Phase 4: DRAFT API Contract (sequential, fast)
    ├── Phase 5: Backend + Frontend + DBA (FULL PARALLEL 🚀)
    ├── Phase 6: Testing (sequential)
    ├── Phase 7: FINAL API Contract (sequential)
    └── Phase 8: Archive + commit
```
