---
name: wf_plan
description: "Create project plan. Supports init, export, review subcommands. Auto-detects OpenSpec for structured spec-driven planning or classic plan.md."
version: 4.0.0
requires_agents: project-planner
requires_skills: plan-writing, architecture, openspec-review
artifact_outputs: implementation-plan
---

# /wf_plan - Project Planning Mode

$ARGUMENTS

---

## 🏗️ MONOREPO DETECTION (BEFORE ROUTING)

```bash
git submodule status
```

| Result | Action |
|--------|--------|
| Has entries | → **Recommend `/wf_fullstack`** (full orchestration) |
| Empty | → Proceed to Subcommand Routing below |

**If monorepo detected**, announce:
```
🏗️ MONOREPO detected (git submodules found).

For full-stack monorepo development with Agent Teams, use:
  /wf_fullstack <name>

This orchestrates: branch → DB schema → planning → API contract → backend + frontend (parallel) → tests → archive.

/wf_plan will still work for planning-only tasks. Continue? (Y/N)
```

If user confirms to continue with `/wf_plan` → proceed to routing below.

---

## 🔀 Subcommand Routing (MANDATORY FIRST STEP)

Parse `$ARGUMENTS` to determine the subcommand:

| Pattern | Subcommand | Action |
|---|---|---|
| `init <name>` | **INIT** | Scaffold SRS folder → jump to **INIT Mode** |
| `export <name>` | **EXPORT** | Generate api-contract.md → jump to **EXPORT Mode** |
| `review <name>` | **REVIEW** | Tech lead review gate → jump to **REVIEW Mode** |
| `<anything else>` | **PLAN** | Create plan → jump to **PLAN Mode** |

---

## 📂 INIT Mode — Scaffold SRS Folder

**Trigger:** `/wf_plan init <name>`

**Example:** `/wf_plan init ngan-hang-thu-huong`

### Steps:

1. **Parse name** from arguments (kebab-case, e.g. `ngan-hang-thu-huong`)

2. **Create folder structure:**
   ```bash
   mkdir -p .wiki/<name>/attachments
   ```

3. **Create README.md** inside the folder:
   ```markdown
   # <Name (Title Case)>

   ## Status: ⏳ Waiting for SRS

   ## Folder Structure
   - `srs.md` ← Download SRS exported từ Confluence wiki vào đây
   - `attachments/` ← Copy hình ảnh đính kèm SRS vào đây
   - `plan.md` ← Sẽ được tạo bởi /wf_plan <name>

   ## Next Steps
   1. Download file SRS (.md) từ Confluence → đổi tên thành `srs.md` → copy vào folder này
   2. Copy hình ảnh đính kèm vào `attachments/`
   3. Chạy: `/wf_plan <name>` để Claude đọc SRS và tạo plan
   ```

4. **Announce result:**
   ```
   ✅ Folder created: .wiki/<name>/

   📂 .wiki/<name>/
   ├── README.md
   ├── srs.md          ← ⏳ Download SRS vào đây
   └── attachments/    ← ⏳ Copy hình ảnh vào đây

   Next step:
   1. Download SRS từ Confluence (.md) → copy vào .wiki/<name>/srs.md
   2. Copy hình ảnh đính kèm → .wiki/<name>/attachments/
   3. Chạy: /wf_plan <name>
   ```

**STOP HERE** — Do NOT create plan or read any files. Wait for user to add SRS.

---

## 📋 PLAN Mode — Create Plan from SRS or Request

**Trigger:** `/wf_plan <topic>` (anything that is NOT `init ...`)

### 🔴 CRITICAL RULES

1. **NO CODE WRITING** - This command creates planning artifacts only
2. **Read and apply the knowledge from `~/.claude/plugins/marketplaces/claude-kit-marketplace/agents/project-planner.md`**
3. **Socratic Gate** - Ask clarifying questions before planning
4. **Dynamic Naming** - Plan named based on task
5. **Use Agent tool** - Parallelize independent work via background subagents

---

### ⚡ Phase 0: Parallel Context Gathering (SPEED OPTIMIZATION)

> 🔴 **MANDATORY:** Use Claude Code's **Agent tool** to launch ALL context readers simultaneously.
> Subagents run in **background** by default = concurrent execution.

Invoke **3 subagents via Agent tool** — all 3 run concurrently in background:

| # | Agent Type | Task Prompt | Returns |
|---|------------|-------------|---------|
| 🅰 | `Explore` | Read `llm-full.md` at project root | Codebase architecture, feature creation guidelines, tech stack conventions |
| 🅱 | `Explore` | Search `.wiki/*/srs.md` for matching SRS | SRS content, folder name, attachment list |
| 🅲 | `general-purpose` | Check `openspec/` + read `project-planner.md` | `SDD_MODE` or `CLASSIC_MODE` + planner knowledge |

**Implementation — invoke via Agent tool (all 3 calls in sequence, they run concurrently in background):**

```
Agent(Explore): "Read the file llm-full.md at the project root.
  If it exists, extract and summarize:
  1. Codebase architecture (modules, packages, layers)
  2. Feature creation guidelines (conventions, naming, file structure)
  3. Tech stack (frameworks, libraries, config patterns)
  If the file does not exist, report NO_LLM_CONTEXT."

Agent(Explore): "Search for .wiki/*/srs.md matching the topic '<topic>'.
  If found: read the full SRS file, list files in the attachments/ folder.
  If not found: report NO_SRS."

Agent(general-purpose): "Check if the openspec/ directory exists and report SDD_MODE or CLASSIC_MODE.
  Also read ~/.claude/plugins/marketplaces/claude-kit-marketplace/agents/project-planner.md
  and extract Phase -1 (Context Check) + Phase 0.5 (Socratic Gate) rules.
  Return the mode and the extracted planner rules."
```

> ⏳ **Wait for ALL 3 background subagents to complete before proceeding to Phase 1.**

> 💡 **Why Explore for 🅰🅱?** Read-only tasks within the project — faster and cheaper.
> **Why general-purpose for 🅲?** Needs to read files outside the project (`~/.claude/plugins/...`).

---

### 📋 Phase 1: Merge Context & Announce

After all subagents return, merge results and announce:

**LLM Context (from 🅰):**
- If found → `"📚 Codebase context: llm-full.md → Loaded"`
- If not found → (silent, no announcement)

**SRS (from 🅱):**
- If found → `"📄 SRS found: .wiki/<name>/srs.md → Loaded"`
- If found → Update README.md status to `## Status: 📋 Planning`
- If not found → (silent, proceed with user's text description)

**Mode (from 🅲):**
- **SDD_MODE** → `"📋 OpenSpec detected → Creating structured spec (proposal + specs + design + tasks)"`
- **CLASSIC_MODE** → `"📋 Classic plan mode → Creating .wiki/{task-slug}/plan.md"`

---

### 🗣️ Phase 2: Socratic Gate (Sequential — requires user interaction)

Apply **Phase 0.5 (Socratic Gate)** rules from subagent 🅲's output:

- Present questions as **CLI-style numbered list** (user dùng phím mũi tên chọn)
- **If SRS exists** (from 🅱): Skip Q1–Q3, only ask about SRS ambiguities via Q5 (custom)
- **If no SRS**: Ask Q1→Q2→Q3 (skip if obvious), then any custom Q5
- **If `llm-full.md` exists** (from 🅰): Skip Q3 (Tech Stack) since it's already known from codebase context
- Group all questions in **one single message** — do NOT ask one-by-one
- If ambiguity would affect scope or behavior, ask before creating plan

> ⏳ **Wait for user answers before proceeding to Phase 3.**

---

### 🏗️ Phase 3: Create Plan (mode-dependent)

#### Behavior — CLASSIC_MODE (no OpenSpec)

1. Apply Phase -1 (Context Check) knowledge from subagent 🅲
2. Apply `llm-full.md` context from subagent 🅰 (if available) — ensure plan follows existing codebase conventions
3. Apply SRS from subagent 🅱 as primary source of truth (if available)
4. Create `.wiki/{task-slug}/plan.md` with task breakdown
5. DO NOT write any code files

#### Naming Rules (Classic)

1. If SRS folder exists, use that name: `.wiki/<name>/plan.md`
2. Otherwise: extract 2-3 key words, lowercase, hyphen-separated, max 30 chars

#### After Planning (Classic)

```
✅ Plan created: .wiki/<name>/plan.md

📂 .wiki/<name>/
├── README.md        ✅ Updated
├── srs.md           ✅ Source (read)
├── attachments/     📎 Images
└── plan.md          ✅ Created (X tasks)

Next steps:
- Review the plan
- [Backend project] Run /wf_api_contract <name> để tạo DRAFT openapi.yaml ngay bây giờ
- Run /wf_create to start implementation
- Or modify plan manually
```

Update README.md status to `## Status: ✅ Planned`

---

#### Behavior — SDD_MODE (OpenSpec detected)

1. **Create OpenSpec change** (sequential — needs name first)
   - Derive kebab-case name from request or SRS folder name
   - Read `@[~/.claude/plugins/marketplaces/claude-kit-marketplace/skills/openspec-propose]` for full propose protocol
   - Run: `openspec new change "<name>" --json`

2. **Generate artifacts with parallel Agent tool calls** (SPEED OPTIMIZATION)

   > 🔴 **Parallelize where dependency allows. Use Agent tool with background execution.**

   **Round 1 — Invoke 2 subagents via Agent tool (run concurrently in background):**

   | # | Artifact | Input |
   |---|----------|-------|
   | 🅳 | `proposal.md` — what & why | User request + SRS (from 🅱) + LLM context (from 🅰) |
   | 🅴 | `specs/<capability>/spec.md` — delta specs | User request + SRS (from 🅱) + LLM context (from 🅰) |

   ```
   Agent(general-purpose): "Create proposal.md for OpenSpec change '<name>'.
     Context: [paste user request] + [paste SRS content if available] + [paste llm-full.md summary]
     Run: openspec instructions proposal --change '<name>' --json
     Write the proposal.md file with what & why, reference SRS Use Case IDs."

   Agent(general-purpose): "Create specs/<capability>/spec.md for OpenSpec change '<name>'.
     Context: [paste user request] + [paste SRS content if available] + [paste llm-full.md summary]
     Run: openspec instructions specs --change '<name>' --json
     Write delta specs (ADDED/MODIFIED/REMOVED)."
   ```

   > ⏳ **Wait for 🅳 + 🅴 background subagents to complete.**

   **Round 2 — Invoke 2 subagents via Agent tool (run concurrently in background):**

   | # | Artifact | Input |
   |---|----------|-------|
   | 🅵 | `design.md` — architecture & patterns | Proposal (🅳) + Specs (🅴) + LLM context (🅰) |
   | 🅶 | `tasks.md` — implementation steps | Proposal (🅳) + Specs (🅴) + LLM context (🅰) |

   ```
   Agent(general-purpose): "Create design.md for OpenSpec change '<name>'.
     Context: [paste proposal.md content] + [paste specs content] + [paste llm-full.md summary]
     Run: openspec instructions design --change '<name>' --json
     Write design.md with architecture decisions and patterns."

   Agent(general-purpose): "Create tasks.md for OpenSpec change '<name>'.
     Context: [paste proposal.md content] + [paste specs content] + [paste llm-full.md summary]
     Run: openspec instructions tasks --change '<name>' --json
     Write tasks.md with implementation steps and checkboxes."
   ```

   > ⏳ **Wait for 🅵 + 🅶 background subagents to complete.**

3. **Copy SRS reference** into change directory (if SRS exists):
   ```bash
   cp .wiki/<name>/srs.md openspec/changes/<name>/srs-reference.md
   ```

4. **Planning boundary**
   - Do NOT edit project code — only create planning artifacts
   - Do NOT start implementation in the same response

#### After Planning (SDD)

```
✅ OpenSpec change created: <name>

📄 SRS source: .wiki/<name>/srs.md
📦 Change artifacts:
- proposal.md ✅
- specs/<capability>/spec.md ✅
- design.md ✅
- tasks.md ✅ (X tasks)
- srs-reference.md ✅ (copy of SRS)

⚡ Speed: Used parallel subagents (3 context + 4 artifact workers)

Next steps:
- Review the artifacts above
- [Optional] Run /wf_plan review <name> — tech lead review gate (6-lens analysis + pre-mortem)
- [Backend project] Run /wf_api_contract <name> để tạo DRAFT openapi.yaml từ specs
- Run /wf_create to start implementation
- Or /wf_plan <name> again to revise
```

Update README.md status to `## Status: ✅ Planned (SDD)`

---

## 🔍 REVIEW Mode — Tech Lead Review Gate (Optional)

**Trigger:** `/wf_plan review <name>`

**Example:** `/wf_plan review ngan-hang-thu-huong`

> **This is OPTIONAL.** User decides whether to run review before implementation.
> Useful for complex features, critical business logic, or when multiple people collaborate.

### Purpose

Senior tech lead + architect review of all OpenSpec artifacts BEFORE implementation.
Challenges whether the design is worth implementing. **Read-only — never modifies files.**

### Prerequisites

| File | Required |
|------|----------|
| `openspec/changes/<name>/proposal.md` | ✅ Yes |
| `openspec/changes/<name>/tasks.md` | ✅ Yes |
| `openspec/changes/<name>/design.md` | If exists |
| `openspec/changes/<name>/specs/*.md` | If exist |

If `proposal.md` or `tasks.md` missing → `⛔ Cannot review. Run /wf_plan <name> first.`

### Steps

📚 Using skill: `openspec-review`

**Read `~/.claude/plugins/marketplaces/claude-kit-marketplace/skills/openspec-review/SKILL.md`** and follow full protocol:

1. **Load all artifacts** in order (proposal → design → tasks → specs)
2. **Run 6-lens analysis:**

   | Lens | Question |
   |------|----------|
   | 1: Problem-Solution Fit | Right problem? Alternatives considered? |
   | 2: Design Soundness | Will it work? One-way doors identified? |
   | 3: Best Practices | Error handling, security, observability? |
   | 4: Over-Engineering | YAGNI violations? Gold-plating? |
   | 5: Task & Test Quality | Implementable? Gates at right places? |
   | 6: Gap Detection | Operational readiness? Blast radius? |

3. **Pre-mortem** — 3 failure scenarios ("6 months from now, this failed. Why?")
4. **Socratic openings** — 3-5 genuine questions surfacing unstated assumptions
5. **Verdict:**

   | Verdict | Meaning | Next |
   |---------|---------|------|
   | **READY** | No critical findings | → `/wf_create <name>` |
   | **READY WITH CAVEATS** | Major findings to address | → Fix, then `/wf_create` |
   | **NOT READY** | Critical findings block | → Fix, then `/wf_plan review` |
   | **RETHINK** | Problem-solution fit questioned | → `/wf_plan <name>` |

### Output

Review report saved to `openspec/changes/<name>/review.md`

### When to Use

| Scenario | Recommendation |
|----------|---------------|
| Complex business logic | ✅ Run review |
| Critical security/payment features | ✅ Run review |
| Simple CRUD feature | ⚪ Skip — go straight to `/wf_create` |
| Solo developer, fast iteration | ⚪ Skip — review adds latency |
| Team collaboration, PR-based | ✅ Run review |

---

## Examples

```
# Scaffold SRS folder:
/wf_plan init ngan-hang-thu-huong

# Plan after SRS is ready:
/wf_plan ngan-hang-thu-huong

# Review plan before implementing (optional):
/wf_plan review ngan-hang-thu-huong

# Plan without SRS (classic):
/wf_plan add dark mode feature

# Export API contract after backend implementation:
/wf_plan export ngan-hang-thu-huong
```

---

## Full Workflow

```
/wf_plan init ngan-hang-thu-huong
    ↓ User downloads SRS vào .wiki/ngan-hang-thu-huong/srs.md
/wf_plan ngan-hang-thu-huong
    ↓ Claude reads SRS → creates plan/specs
/wf_plan review ngan-hang-thu-huong        ← [Optional] Tech lead review gate
    ↓
/wf_api_contract ngan-hang-thu-huong       ← DRAFT openapi.yaml (Frontend bắt đầu mock)
    ↓
/wf_create ngan-hang-thu-huong
    ↓ Implement Backend
/wf_api_contract export ngan-hang-thu-huong  ← FINAL openapi.yaml (validated from code)
    ↓ Share openapi.yaml sang Frontend project
/wf_test check
/wf_test
/wf_verify
```

---

## 📤 EXPORT Mode — Generate API Contract

**Trigger:** `/wf_plan export <name>`

**Example:** `/wf_plan export ngan-hang-thu-huong`

### Purpose

After Backend implements an SRS feature, export an **api-contract.md** that Frontend project can use to understand exactly what was built.

### Steps:

1. **Parse name** from arguments

2. **Scan implemented code** to extract API contract:

   **For Spring Boot projects:**
   ```bash
   # Find controllers related to this feature
   grep -rl "@RestController\|@RequestMapping" src/ | head -20
   ```

   Read each relevant controller and extract:
   - Endpoints (method, path, params)
   - Request/Response DTOs
   - Validation annotations
   - Error handling patterns

   **For other frameworks:** Scan equivalent routing/controller files.

3. **Detect auth mechanism:**
   ```bash
   grep -r "SessionCreationPolicy\|JwtAuth\|httpBasic" src/ 2>/dev/null
   ```

4. **Detect error format:**
   - Search for `@ExceptionHandler`, `ErrorResponse`, `ApiError` classes
   - Extract error response structure

5. **Generate `.wiki/<name>/api-contract.md`:**

   ```markdown
   # API Contract: <Name>
   
   > Auto-generated by `/wf_plan export` on YYYY-MM-DD
   > Source: <backend project path>
   
   ## Base URL
   http://localhost:8080
   
   ## Authentication
   - Type: Session-based (JSESSIONID)
   - Login: POST /api/auth/login (form: username, password)
   
   ## Endpoints
   
   | Method | Path | Description | Request Body | Response |
   |--------|------|-------------|-------------|----------|
   | GET | /api/bene-banks | Search with filters | — | Page<BeneBankDTO> |
   | GET | /api/bene-banks/{id} | Get by ID | — | BeneBankDTO |
   | POST | /api/bene-banks | Create new | CreateBeneBankRequest | BeneBankDTO (201) |
   | PUT | /api/bene-banks/{id} | Update | UpdateBeneBankRequest | BeneBankDTO |
   | PATCH | /api/bene-banks/{id}/status | Lock/Unlock | StatusRequest | BeneBankDTO |
   
   ## Query Parameters (GET /api/bene-banks)
   
   | Param | Type | Description |
   |-------|------|-------------|
   | bankNameVn | String | Filter by Vietnamese name (contains) |
   | status | String | Filter by status (ACTIVE/INACTIVE) |
   | page | int | Page number (default: 0) |
   | size | int | Page size (default: 20) |
   
   ## DTOs
   
   ### BeneBankDTO
   ```json
   {
     "id": 1,
     "bankCode": "VCB",
     "bankNameVn": "Ngân hàng TMCP Ngoại Thương Việt Nam",
     "bankNameEn": "Vietcombank",
     "shortName": "VCB",
     "citadCode": "97036001",
     "napasCode": "970360",
     "logoUrl": "https://...",
     "priority": 1,
     "status": "ACTIVE",
     "createdAt": "2026-08-11T10:00:00",
     "updatedAt": "2026-08-11T10:00:00"
   }
   ```
   
   ### CreateBeneBankRequest
   ```json
   {
     "bankCode": "VCB",         // required, unique
     "bankNameVn": "...",       // required
     "bankNameEn": "...",       // required
     "shortName": "...",        // required
     "citadCode": "97036001",   // optional (but CITAD or NAPAS required)
     "napasCode": "970360",     // optional (but CITAD or NAPAS required)
     "logoUrl": "https://...",  // optional
     "priority": 1              // optional, default: 99
   }
   ```
   
   ## Error Format
   ```json
   {
     "code": "DUPLICATE_BANK_CODE",
     "message": "Mã ngân hàng đã tồn tại",
     "field": "bankCode"
   }
   ```
   
   ## Business Rules Validated by Backend
   - BR2: bankCode must be unique
   - BR9: At least one of citadCode or napasCode is required
   - BR10: priority defaults to 99
   ```

6. **Announce result:**
   ```
   ✅ API contract exported: .wiki/<name>/api-contract.md

   Extracted:
   - X endpoints
   - X DTOs
   - X business rules
   - Auth: Session-based (JSESSIONID)

   Next step:
   Copy this file to Frontend project:
     cp .wiki/<name>/api-contract.md /path/to/frontend/.wiki/<name>/
   Then run /wf_plan <name> in Frontend project.
   ```

