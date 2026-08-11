---
name: wf_create
description: Create or implement application/feature. Auto-detects SRS folder and OpenSpec for structured implementation.
version: 2.1.0
requires_agents: orchestrator, project-planner
requires_skills: app-builder, design-spec, verify-changes
artifact_outputs: implementation-plan, changed-files, verification-report
---

# /wf_create - Create / Implement

$ARGUMENTS

---

## 📄 SRS Detection (MANDATORY FIRST STEP)

If `$ARGUMENTS` matches a name, check for SRS folder:

```bash
test -f .wiki/<name>/srs.md && echo "SRS_FOUND" || echo "NO_SRS"
test -f .wiki/<name>/plan.md && echo "PLAN_FOUND" || echo "NO_PLAN"
```

**If SRS_FOUND:**
- Read `.wiki/<name>/srs.md` for full requirements context
- Read `.wiki/<name>/plan.md` if it exists (created by `/wf_plan`)
- Announce: `"📄 SRS loaded: .wiki/<name>/srs.md → Implementing..."`
- Update README.md status to `## Status: 🔨 Implementing`

**If NO_SRS + NO_PLAN:**
- Proceed with standard flow (from user description)

---

## 🔍 OpenSpec Detection

```bash
test -d openspec/ && echo "SDD_MODE" || echo "CLASSIC_MODE"
```

If **SDD_MODE**, also check for active changes:
```bash
openspec list --json
```

Announce:
- **SDD_MODE + active change**: `"⚡ OpenSpec detected → Implementing from spec: <change-name>"`
- **SDD_MODE + no change**: `"📋 OpenSpec detected but no active change. Run /wf_plan first to create specs, or proceed with classic mode."`
- **CLASSIC_MODE**: `"🚀 Classic create mode"`

---

## Behavior — CLASSIC_MODE (no OpenSpec)

1. **Request Analysis**
   - Understand what the user wants
   - If information is missing, use the `brainstorming` skill to ask clarifying questions

2. **Project Planning**
   - Read and apply the knowledge from `agents/project-planner.md` for task breakdown
   - Determine tech stack
   - Plan file structure
   - Create `.wiki/{task-slug}/plan.md` (then proceed to building)

3. **Design Source-of-Truth (UI projects only)**
   - If the app has a UI, create `.wiki/{task-slug}/design.md` BEFORE building UI — follow the `design-spec` skill
   - Skip only for headless/CLI/API-only projects

4. **Application Building (After Approval)**
   - Orchestrate with `app-builder` skill
   - Coordinate expert agents:
     - `database-architect` → Schema
     - `backend-specialist` → API
     - `frontend-specialist` → UI

5. **Preview**
   - Start preview when complete
   - Present URL to user

---

## Behavior — SDD_MODE (OpenSpec detected)

1. **Select the change**
   - If a name is provided via arguments, use it
   - If only one active change exists, auto-select it
   - If multiple, run `openspec list --json` and ask user to select
   - Announce: `"Using change: <name>"`

2. **Check status and load instructions**
   ```bash
   openspec status --change "<name>" --json
   openspec instructions apply --change "<name>" --json
   ```
   - Read `@[skills/openspec-apply-change]` for full apply protocol
   - Parse context files (proposal, specs, design, tasks)
   - Understand task list with completion status

3. **Implement tasks sequentially**
   - For each incomplete task:
     - Read the task description and acceptance criteria
     - Route to appropriate agent (`backend-specialist`, `frontend-specialist`, etc.)
     - Implement the code
     - Mark task as complete: update `- [ ]` to `- [x]` in tasks.md
   - Pause and report after each task or group of related tasks

4. **After all tasks complete**
   ```
   ✅ All tasks completed for change: <name>

   Next steps:
   - Run /wf_verify to verify the implementation
   - Run /wf_test to generate and run tests
   - When satisfied, commit and archive with /wf_remember
   ```

---

## Usage Examples

```
/wf_create blog site
/wf_create e-commerce app with product listing and cart
/wf_create                        ← (SDD: auto-picks active change)
/wf_create bene-bank-crud         ← (SDD: picks specific change)
```

---

## Before Starting

If request is unclear (Classic mode), ask these questions:
- What type of application?
- What are the basic features?
- Who will use it?

Use defaults, add details later.
