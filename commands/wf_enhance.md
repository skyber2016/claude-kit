---
name: wf_enhance
description: Add or update features in existing application. Auto-detects OpenSpec to revise specs before implementing, or uses classic enhancement.
version: 2.0.0
requires_agents: code-archaeologist
requires_skills: simplify-code, clean-code, verify-changes
artifact_outputs: change-plan, changed-files, verification-report
---

# /wf_enhance - Update Application

$ARGUMENTS

---

## 🔍 OpenSpec Detection (MANDATORY FIRST STEP)

```bash
test -d openspec/ && echo "SDD_MODE" || echo "CLASSIC_MODE"
```

If **SDD_MODE**, check for active changes:
```bash
openspec list --json
```

Announce:
- **SDD_MODE + active change**: `"🔄 OpenSpec detected → Updating change: <name>"`
- **SDD_MODE + no change**: `"📋 OpenSpec detected → Creating new change for this enhancement"`
- **CLASSIC_MODE**: `"🔧 Classic enhance mode"`

---

## Behavior — CLASSIC_MODE (no OpenSpec)

1. **Understand Current State**
   - Understand existing features, tech stack
   - Read relevant source files

2. **Plan Changes**
   - Determine what will be added/changed
   - Detect affected files
   - Check dependencies

3. **Present Plan to User** (for major changes)
   ```
   "To add admin panel:
   - New files: admin routes, components, and access control
   - Updates: navigation, auth middleware
   - Scope: moderate (touches auth + routing)
   
   Should I start?"
   ```

4. **Apply**
   - Call relevant agents
   - Make changes
   - Test

5. **Update Preview**
   - Hot reload or restart

---

## Behavior — SDD_MODE (OpenSpec detected)

### Path A: Active change exists → Update & Apply

1. **Load existing change**
   ```bash
   openspec status --change "<name>" --json
   ```

2. **Revise planning artifacts**
   - Read `@[skills/openspec-update-change]` for full update protocol
   - Read all existing artifacts (proposal, specs, design, tasks)
   - Identify what needs to change based on user's new request
   - Update artifacts to reflect new requirements
   - Keep artifacts mutually consistent

3. **Apply updated tasks**
   - Follow the same apply protocol as `/wf_create` SDD_MODE
   - Implement only NEW or MODIFIED tasks

### Path B: No active change → Create new change

1. **Create new OpenSpec change**
   - Derive name from request
   - Run: `openspec new change "<name>" --json`

2. **Generate artifacts**
   - Same as `/wf_plan` SDD_MODE
   - But also proceed to implementation after user approval

3. **Implement**
   - Same as `/wf_create` SDD_MODE

---

## Usage Examples

```
/wf_enhance add dark mode
/wf_enhance build admin panel
/wf_enhance integrate payment system
/wf_enhance add search feature
/wf_enhance update validation rules for beneficiary bank
```

---

## Caution

- Get approval for major changes
- Warn on conflicting requests (e.g., "use Firebase" when project uses PostgreSQL)
- Commit each change with git
- In SDD mode: always update specs BEFORE implementing code changes
