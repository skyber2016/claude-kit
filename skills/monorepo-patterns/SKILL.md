---
name: monorepo-patterns
description: "Monorepo full-stack development patterns for Git submodule-based repos with Spring Boot (Java) + Angular architecture. Covers git branching, workspace detection, build commands, and cross-workspace coordination."
when_to_use: "When working on a monorepo project (detected via git submodule). Provides branching conventions, workspace build commands, and cross-workspace file ownership rules."
allowed-tools: Read, Glob, Grep, Bash
version: 1.0.0
---

# Monorepo Patterns Skill

Patterns and conventions for developing in a **Git submodule-based monorepo** with Spring Boot backend + Angular frontend.

---

## 🔍 Monorepo Detection

```bash
# Primary detection method
git submodule status
# → Output with entries = MONOREPO
# → Empty output = SINGLE REPO

# Confirm submodule paths
git submodule status --recursive

# List submodule names and URLs
git config --file .gitmodules --get-regexp path
```

### Expected Output (Monorepo)
```
 abc1234 apps/backend (v1.2.3)
 def5678 apps/frontend (v2.0.1)
 ghi9012 packages/shared (v0.5.0)
```

---

## 📄 Per-Submodule Context Files (CRITICAL)

Each git submodule is an **independent repo** with its own `llm-full.md` and `CLAUDE.md`.
These files contain **workspace-specific** knowledge and MUST be read before spawning any agent for that workspace.

### Context File Lookup Order (per submodule)

```
1. <submodule-path>/llm-full.md     ← PRIMARY: codebase summary, package structure, tech stack, conventions
2. <submodule-path>/CLAUDE.md       ← RULES: agent instructions, forbidden patterns, coding style
3. Root llm-full.md                 ← FALLBACK: only if submodule has no llm-full.md
4. Root CLAUDE.md                   ← FALLBACK: only if submodule has no CLAUDE.md
5. Auto-detection                   ← LAST RESORT: pom.xml, angular.json, appsettings.json
```

### What Each File Contains

**`<submodule>/llm-full.md`** — Read this to understand:
- Tech stack versions (Spring Boot 3.x, Angular 17+, etc.)
- Package/module structure (e.g. `com.company.project.module`)
- Existing coding patterns (DTO naming, service conventions)
- Database connection config (dialect, schema name)
- API base URL (for frontend)
- Important domain objects already in the codebase

**`<submodule>/CLAUDE.md`** — Read this for:
- Which folders agents are allowed to edit
- Forbidden patterns (e.g. "never use @Autowired, always use constructor injection")
- Test framework and conventions
- Naming conventions specific to this workspace
- Any workspace-specific rules the team has defined

### Rule: NEVER Mix Workspace Contexts

```
✅ CORRECT:
  backend agent  → reads apps/backend/llm-full.md + apps/backend/CLAUDE.md
  frontend agent → reads apps/frontend/llm-full.md + apps/frontend/CLAUDE.md
  dba agent      → reads apps/backend/llm-full.md + apps/backend/CLAUDE.md (same as backend)

❌ WRONG:
  backend agent  → reads root llm-full.md (may describe frontend or different stack)
  frontend agent → reads backend's llm-full.md (will use wrong package names)
```



### Workspace Structure Convention
```
<root>/
├── .gitmodules             ← submodule definitions
├── .wiki/                  ← SRS, plans, openapi.yaml per feature
├── openspec/               ← OpenSpec changes (if SDD_MODE)
├── docker-compose.yml      ← local dev orchestration
├── apps/
│   ├── backend/            ← Spring Boot or .NET Core (submodule)
│   └── frontend/           ← Angular (submodule)
└── packages/
    └── shared/             ← Shared DTOs / types (optional submodule)
```

---

## 🌿 Git Branching Strategy

### Branch Naming Convention
```
feature/<feature-name>        ← New features
bugfix/<bug-description>      ← Bug fixes
hotfix/<critical-fix>         ← Production hotfixes
release/<version>             ← Release preparation
```

### Monorepo Branch Flow

In a git submodule monorepo, **each submodule has its own branch**.
The root repo tracks the submodule commit references.

```bash
# 1. Create branch in ROOT repo
git checkout -b feature/<name>

# 2. Create matching branch in each submodule
cd apps/backend && git checkout -b feature/<name> && cd ../..
cd apps/frontend && git checkout -b feature/<name> && cd ../..

# 3. Update root to track new submodule HEADs
git add apps/backend apps/frontend
git commit -m "chore: init feature/<name> branches in submodules"
```

### Branch Auto-Create Script
```bash
#!/bin/bash
# Usage: create-feature-branch.sh <feature-name>
FEATURE=$1

# Root repo
git checkout -b feature/$FEATURE

# All submodules
git submodule foreach "git checkout -b feature/$FEATURE || echo 'Branch exists, switching'; git checkout feature/$FEATURE"

# Commit root tracking
git add -A
git commit -m "chore: create feature/$FEATURE branches across submodules"

echo "✅ Branch feature/$FEATURE created in root + all submodules"
```

---

## 🏗️ Build Commands Per Workspace

### Root Level
```bash
# Start all services (dev)
docker compose up -d

# Or start individually
cd apps/backend && mvn spring-boot:run    # Spring Boot
cd apps/frontend && ng serve              # Angular
```

### Backend Workspace (Spring Boot)
```bash
cd apps/backend

# Build
mvn compile
mvn package -DskipTests

# Test
mvn test

# Run
mvn spring-boot:run
java -jar target/*.jar
```

### Backend Workspace (.NET Core)
```bash
cd apps/backend

# Build
dotnet build
dotnet publish -c Release -o ./publish

# Test
dotnet test

# Run
dotnet run
```

### Frontend Workspace (Angular)
```bash
cd apps/frontend

# Install
npm install

# Dev server
ng serve

# Build
ng build --configuration=production

# Test
ng test --no-watch --code-coverage
ng e2e

# Lint
ng lint
```

### Shared Package (if exists)
```bash
cd packages/shared

# Java shared types
mvn install -DskipTests

# TypeScript shared types (from openapi.yaml)
npx openapi-typescript ../../.wiki/<feature>/openapi.yaml -o src/types/api.ts
```

---

## 📁 File Ownership Rules (Agent Teams)

In monorepo Agent Teams, file ownership is workspace-scoped:

| File Area | Owner Agent | Workspace |
|-----------|-------------|----------|
| `apps/backend/src/main/**` | `backend-specialist` | `apps/backend` |
| `apps/backend/src/test/**` | `test-engineer` | `apps/backend` |
| `apps/frontend/src/**` | `frontend-specialist` | `apps/frontend` |
| `apps/frontend/src/**/*.spec.ts` | `test-engineer` | `apps/frontend` |
| `packages/shared/**` | `backend-specialist` | `packages/shared` |
| `.wiki/<feature>/openapi.yaml` | `api-contract` agent | root |
| `openspec/changes/**` | Orchestrator | root |
| `docker-compose*.yml` | `devops-engineer` | root |
| `apps/backend/src/main/resources/*.yml` | `database-architect` | `apps/backend` |

> 🔴 **CRITICAL:** Two agents must NOT edit the same file concurrently.
> The orchestrator enforces these boundaries.

---

## 🔄 Submodule Sync Commands

```bash
# Init and fetch all submodules (first clone)
git submodule update --init --recursive

# Pull latest from all submodules
git submodule update --remote --merge

# Check submodule status
git submodule status

# Push changes (must push submodules first, then root)
git submodule foreach git push origin feature/<name>
git push origin feature/<name>
```

---

## 🧪 Cross-Workspace Testing

### API Contract Verification
```bash
# After backend is running (port 8080)
# Validate frontend can reach all endpoints defined in openapi.yaml
npx @redocly/cli lint .wiki/<feature>/openapi.yaml

# Run backend integration tests
cd apps/backend && mvn verify -P integration-test

# Run frontend API tests (mocked or real)
cd apps/frontend && ng test --include=**/api*.spec.ts
```

### End-to-End
```bash
# Start full stack
docker compose up -d

# Run E2E
cd apps/frontend && npx playwright test
```

---

## 📦 OpenSpec Folder Structure (Monorepo Mode)

When in monorepo + SDD_MODE, each OpenSpec change gets domain-split specs:

```
openspec/
└── changes/
    └── <feature-name>/
        ├── proposal.md          ← What & why (unchanged)
        ├── design.md            ← Architecture decisions (unchanged)
        ├── tasks.md             ← Implementation tasks (unchanged)
        ├── api-contract.md      ← Shared API contract summary
        ├── openapi.yaml         ← Full OpenAPI 3.1 spec
        ├── srs-reference.md     ← SRS copy (if SRS exists)
        └── specs/
            └── <domain>/
                ├── backend-spec.md    ← Spring Boot / .NET implementation spec
                ├── frontend-spec.md   ← Angular component/service spec
                └── db-spec.md         ← Schema changes, migrations
```

### backend-spec.md Template
```markdown
# Backend Spec: <Domain>

## Workspace: apps/backend
## Branch: feature/<name>

### Endpoints to Implement
| Method | Path | Controller | Service | Notes |
|--------|------|-----------|---------|-------|

### JPA Entities
- Entity: `<Name>` in package `<package>`
- Table: `<TABLE_NAME>`
- Fields: ...

### Business Rules
- BR1: ...

### Error Codes
| Code | HTTP | Description |
|------|------|-------------|

### Acceptance Criteria
- [ ] All endpoints return correct HTTP status
- [ ] All validations enforced
- [ ] Unit tests coverage > 80%
```

### frontend-spec.md Template
```markdown
# Frontend Spec: <Domain>

## Workspace: apps/frontend
## Branch: feature/<name>

### Components to Create
| Component | Path | Responsibility |
|-----------|------|----------------|

### Services
| Service | Path | API Calls |
|---------|------|----------|

### Routes
| Path | Component | Guard |
|------|-----------|-------|

### State Management
- Signals / NgRx for: ...

### Acceptance Criteria
- [ ] All routes accessible
- [ ] Forms validate correctly
- [ ] API integration working
- [ ] Unit tests pass
```

### db-spec.md Template
```markdown
# Database Spec: <Domain>

## Database: Oracle / PostgreSQL / MongoDB

### Schema Changes
#### New Tables/Collections
```sql
-- Oracle/PostgreSQL
CREATE TABLE <TABLE_NAME> (
  ...
);
```

#### Indexes
```sql
CREATE INDEX idx_<name> ON <table>(<column>);
```

#### Migration Plan
1. Step 1: ...
2. Step 2: ...

### Rollback Plan
1. ...
```
```

---

## ⚡ Parallel Development Pattern

In monorepo with full parallel execution:

```
Phase 0: Branch creation (sequential)
  └── Create feature/<name> in root + all submodules

Phase 1: Planning (parallel)
  ├── Agent A: Read SRS + generate backend-spec.md
  ├── Agent B: Read SRS + generate frontend-spec.md  
  └── Agent C: Read SRS + generate db-spec.md

Phase 2: Mock Contract (sequential, fast)
  └── Agent D: Generate DRAFT openapi.yaml from backend-spec.md

Phase 3: Implementation (full parallel)
  ├── backend-specialist → apps/backend (uses openapi.yaml as contract)
  ├── frontend-specialist → apps/frontend (uses openapi.yaml as mock)
  └── database-architect → apps/backend/resources (schema + migrations)

Phase 4: Integration + Testing (sequential)
  ├── test-engineer → backend unit tests
  ├── test-engineer → frontend unit tests
  └── test-engineer → E2E tests (docker compose)

Phase 5: Archive
  └── wf_remember → tag + commit + archive OpenSpec change
```
