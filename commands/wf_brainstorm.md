---
name: wf_brainstorm
description: Structured brainstorming for projects and features. Explores multiple options before implementation. Auto-detects OpenSpec for SDD mode.
version: 2.0.0
requires_agents: project-planner
requires_skills: brainstorming
artifact_outputs: discovery-notes, decision-summary
---

# /wf_brainstorm - Structured Idea Exploration

$ARGUMENTS

---

## 🔍 OpenSpec Detection (MANDATORY FIRST STEP)

Before starting, detect if OpenSpec is available:

```bash
test -d openspec/ && echo "SDD_MODE" || echo "CLASSIC_MODE"
```

Announce the mode to user:
- **SDD_MODE**: `"🔍 OpenSpec detected → SDD explore mode (codebase-grounded, can scaffold specs)"`
- **CLASSIC_MODE**: `"🧠 Classic brainstorm mode"`

---

## Behavior — CLASSIC_MODE (no OpenSpec)

When `/wf_brainstorm` is triggered without OpenSpec:

1. **Understand the goal**
   - What problem are we solving?
   - Who is the user?
   - What constraints exist?

2. **Generate options**
   - Provide at least 3 different approaches
   - Each with pros and cons
   - Consider unconventional solutions

3. **Compare and recommend**
   - Summarize tradeoffs
   - Give a recommendation with reasoning

### Output Format (Classic)

```markdown
## 🧠 Brainstorm: [Topic]

### Context
[Brief problem statement]

---

### Option A: [Name]
[Description]

✅ **Pros:**
- [benefit 1]
- [benefit 2]

❌ **Cons:**
- [drawback 1]

📊 **Effort:** Low | Medium | High

---

### Option B: [Name]
...

---

## 💡 Recommendation

**Option [X]** because [reasoning].

What direction would you like to explore?
```

---

## Behavior — SDD_MODE (OpenSpec detected)

When `/wf_brainstorm` is triggered with OpenSpec present:

1. **Load context**
   - Read `openspec/config.yaml` for project context
   - Run `openspec list --json` to check active changes
   - Investigate the actual codebase: read relevant source files, search patterns, map architecture

2. **Explore with grounding**
   - Read the `@[~/.claude/plugins/marketplaces/claude-kit-marketplace/skills/openspec-explore]` skill for full explore protocol
   - Be curious, not prescriptive — open threads, don't interrogate
   - Use ASCII diagrams liberally for architecture visualization
   - Follow interesting threads, pivot when new information emerges
   - Ground discussions in actual code, not just theory

3. **Generate options with trade-offs**
   - Same as Classic: at least 3 approaches with pros/cons
   - But additionally: show concrete impact on existing codebase
   - Reference actual files, patterns, and dependencies found

4. **Offer to scaffold spec** (SDD exclusive)
   - After user picks a direction, ask:
     ```
     "Bạn đã chọn hướng đi. Muốn tôi tạo spec cho change này không?
      → /wf_plan [topic] để tạo structured spec (proposal + tasks)
      → Hoặc tiếp tục explore thêm"
     ```

---

## Examples

```
/wf_brainstorm authentication system
/wf_brainstorm state management for complex form
/wf_brainstorm database schema for social app
/wf_brainstorm caching strategy
```

---

## Key Principles

- **No code** - this is about ideas, not implementation
- **Visual when helpful** - use diagrams for architecture
- **Honest tradeoffs** - don't hide complexity
- **Defer to user** - present options, let them decide
- **Grounded (SDD)** - explore the actual codebase when relevant
