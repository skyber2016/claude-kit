---
name: wf_plan
description: Create project plan. Supports `init` subcommand to scaffold SRS folder. Auto-detects OpenSpec for structured spec-driven planning or classic plan.md.
version: 2.1.0
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
2. **Read and apply the knowledge from `agents/project-planner.md`**
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

1. Follow Phase -1 (Context Check) from `agents/project-planner.md`
2. Follow Phase 0 (Socratic Gate) from `agents/project-planner.md`
   - **If SRS exists**: Focus questions on ambiguities in the SRS, not general discovery
   - **If no SRS**: Standard Socratic discovery
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
   - Apply Socratic Gate from `agents/project-planner.md`
   - **If SRS exists**: Read SRS first, then ask about ambiguities only
   - If ambiguity would affect scope or behavior, ask before creating change

2. **Create OpenSpec change**
   - Derive kebab-case name from request or SRS folder name
   - Read `@[skills/openspec-propose]` for full propose protocol
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
```

---

## Full Workflow

```
/wf_plan init ngan-hang-thu-huong
    ↓ User downloads SRS vào .wiki/ngan-hang-thu-huong/srs.md
/wf_plan ngan-hang-thu-huong
    ↓ Claude reads SRS → creates plan/specs
/wf_create ngan-hang-thu-huong
    ↓ Implement
/wf_verify
/wf_test
```
