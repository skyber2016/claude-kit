---
name: wf_plan
description: Create project plan. Supports `init`, `export` subcommands. Auto-detects OpenSpec for structured spec-driven planning or classic plan.md.
version: 2.2.0
requires_agents: project-planner
requires_skills: plan-writing, architecture
artifact_outputs: implementation-plan
---

# /wf_plan - Project Planning Mode

$ARGUMENTS

---

## 🔀 Subcommand Routing (MANDATORY FIRST STEP)

Parse `$ARGUMENTS` to determine the subcommand:

| Pattern | Subcommand | Action |
|---|---|---|
| `init <name>` | **INIT** | Scaffold SRS folder → jump to **INIT Mode** |
| `export <name>` | **EXPORT** | Generate api-contract.md → jump to **EXPORT Mode** |
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

### 📄 SRS Detection (BEFORE OpenSpec Detection)

Check if an SRS folder exists for this topic:

```bash
# Check for exact match or fuzzy match
ls .wiki/*/srs.md 2>/dev/null
```

**If `.wiki/<name>/srs.md` exists:**
- Announce: `"📄 SRS found: .wiki/<name>/srs.md → Reading..."`
- Read the SRS file completely
- Read any referenced images in `attachments/`
- Use the SRS as the **primary source of truth** for planning
- The Socratic Gate focuses on **clarifying SRS ambiguities**, not general discovery
- Update README.md status to `## Status: 📋 Planning`

**If no SRS found:**
- Proceed with normal planning (from user's text description)

### 🔍 OpenSpec Detection

```bash
test -d openspec/ && echo "SDD_MODE" || echo "CLASSIC_MODE"
```

Announce the mode:
- **SDD_MODE**: `"📋 OpenSpec detected → Creating structured spec (proposal + specs + design + tasks)"`
- **CLASSIC_MODE**: `"📋 Classic plan mode → Creating .wiki/{task-slug}/plan.md"`

---

### Behavior — CLASSIC_MODE (no OpenSpec)

1. Follow Phase -1 (Context Check) from `~/.claude/plugins/marketplaces/claude-kit-marketplace/agents/project-planner.md`
2. Follow **Phase 0.5 (Socratic Gate)** from `~/.claude/plugins/marketplaces/claude-kit-marketplace/agents/project-planner.md`
   - Present questions as **CLI-style numbered list** (user dùng phím mũi tên chọn)
   - **If SRS exists**: Skip Q1–Q3, only ask about SRS ambiguities via Q5 (custom)
   - **If no SRS**: Ask Q1→Q2→Q3 (skip if obvious), then any custom Q5
   - Group all questions in **one single message** — do NOT ask one-by-one
3. Create `.wiki/{task-slug}/plan.md` with task breakdown
4. DO NOT write any code files

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
- Run /wf_create to start implementation
- Or modify plan manually
```

Update README.md status to `## Status: ✅ Planned`

---

### Behavior — SDD_MODE (OpenSpec detected)

1. **Understand the request and clarify material ambiguity**
   - Apply **Phase 0.5 (Socratic Gate)** from `~/.claude/plugins/marketplaces/claude-kit-marketplace/agents/project-planner.md`
   - Present questions as **CLI-style numbered list** (user dùng phím mũi tên chọn)
   - **If SRS exists**: Read SRS first, skip Q1–Q3, ask about SRS ambiguities only via Q5
   - Group all questions in **one single message** — do NOT ask one-by-one
   - If ambiguity would affect scope or behavior, ask before creating change

2. **Create OpenSpec change**
   - Derive kebab-case name from request or SRS folder name
   - Read `@[~/.claude/plugins/marketplaces/claude-kit-marketplace/skills/openspec-propose]` for full propose protocol
   - Run: `openspec new change "<name>" --json`

3. **Generate artifacts in order**
   - For each artifact, get instructions: `openspec instructions <artifact> --change "<name>" --json`
   - **If SRS exists**: Use SRS content as input context for all artifacts
   - Create artifacts in dependency order:
     - `proposal.md` — what & why (reference SRS Use Case ID)
     - `specs/<capability>/spec.md` — delta specs (ADDED/MODIFIED/REMOVED)
     - `design.md` — how (architecture, patterns)
     - `tasks.md` — implementation steps with checkboxes

4. **Copy SRS reference** into change directory:
   ```bash
   cp .wiki/<name>/srs.md openspec/changes/<name>/srs-reference.md
   ```

5. **Planning boundary**
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

Next steps:
- Review the artifacts above
- Run /wf_create to start implementation
- Or /wf_plan <name> again to revise
```

Update README.md status to `## Status: ✅ Planned (SDD)`

---

## Examples

```
# Scaffold SRS folder:
/wf_plan init ngan-hang-thu-huong
/wf_plan init quan-ly-khach-hang
/wf_plan init chuyen-khoan-napas

# Plan after SRS is ready:
/wf_plan ngan-hang-thu-huong
/wf_plan quan-ly-khach-hang

# Plan without SRS (classic):
/wf_plan add dark mode feature
/wf_plan SaaS dashboard with analytics

# Export API contract after backend implementation:
/wf_plan export ngan-hang-thu-huong
/wf_plan export quan-ly-khach-hang
```

---

## Full Workflow

```
/wf_plan init ngan-hang-thu-huong
    ↓ User downloads SRS vào .wiki/ngan-hang-thu-huong/srs.md
/wf_plan ngan-hang-thu-huong
    ↓ Claude reads SRS → creates plan/specs
/wf_create ngan-hang-thu-huong
    ↓ Implement Backend
/wf_plan export ngan-hang-thu-huong
    ↓ Generate api-contract.md → copy sang Frontend project
/wf_verify
/wf_test
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

