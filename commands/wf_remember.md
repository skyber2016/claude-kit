---
name: wf_remember
description: Save information to persistent memory. Auto-archives completed OpenSpec changes and updates .wiki/ status.
version: 2.0.0
requires_agents: orchestrator
requires_skills: memory-system
artifact_outputs: memory-entry
---

# /wf_remember — Persistent Memory Management

$ARGUMENTS

---

## 🔴 CRITICAL RULES

1. **Load memory-system skill** — Read `skills/memory-system/SKILL.md` first
2. **Never auto-delete memories** — Always ask user before pruning
3. **Keep index under 200 lines** — Warn if approaching limit
4. **Distill, don't copy** — Save insights, not full conversations

---

## 🔍 OpenSpec Auto-Archive (BEFORE saving memory)

Check if there are completed OpenSpec changes to archive:

```bash
test -d openspec/ && echo "SDD_MODE" || echo "CLASSIC_MODE"
```

**If SDD_MODE:**

1. Check for active changes:
   ```bash
   openspec list --json
   ```

2. For each active change, check if all tasks are completed:
   - Read `openspec/changes/<name>/tasks.md`
   - Count `- [x]` (done) vs `- [ ]` (pending)

3. **If ALL tasks completed:**
   ```
   📦 OpenSpec change "<name>" has all tasks completed.
   Archiving before saving memory...
   ```
   - Read `@[skills/openspec-archive-change]` for archive protocol
   - If delta specs exist, sync them first using `@[skills/openspec-sync-specs]`
   - Archive the change: move to `openspec/archive/YYYY-MM-DD-<name>/`
   - Report: `"✅ Archived: <name>"`

4. **If some tasks still pending:**
   ```
   ⚠️ OpenSpec change "<name>" has X/Y tasks remaining.
   Skipping archive. Complete tasks with /wf_create first.
   ```

**Also update `.wiki/<name>/README.md`** status if it exists:
- All tasks done → `## Status: ✅ Completed & Archived`
- Partial → `## Status: 🔨 In Progress (X/Y tasks)`

---

## Task — Save Memory

Use the `memory-system` skill to save information:

```
CONTEXT:
- User wants to remember: $ARGUMENTS
- Memory location: memory/

WORKFLOW:
1. CLASSIFY the information type: user | feedback | project | reference
2. CHECK if relevant topic file exists in memory/
3. SAVE to appropriate topic file (create if needed)
4. UPDATE memory/MEMORY.md index with one-line pointer
5. CONFIRM to user what was saved

RULES:
1. Follow skills/memory-system/SKILL.md taxonomy
2. Keep index entries under 150 characters
3. Topic files must have frontmatter (type, created, updated)
4. Don't save information derivable from code
5. Don't save temporary debug context
```

---

## Expected Output

```
📦 OpenSpec: Archived "bene-bank-crud" (7/7 tasks completed)
✅ Specs synced to openspec/specs/

💾 Saved to memory:
  Type: project
  File: memory/tech-decisions.md
  Entry: "Bene Bank CRUD: Layered architecture, session auth, JSESSIONID"

This will be available in future sessions.
```

---

## Usage Examples

```
/wf_remember I prefer using bun instead of npm
/wf_remember Our API uses JWT with httpOnly cookies
/wf_remember The production server is at api.example.com:8080
/wf_remember Completed bene-bank-crud, used layered architecture
```
