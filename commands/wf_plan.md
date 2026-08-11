---
name: plan
description: Create project plan using project-planner agent. No code writing - only plan file generation.
version: 1.0.0
requires_agents: project-planner
requires_skills: plan-writing, architecture
artifact_outputs: implementation-plan
---

# /wf_plan - Project Planning Mode

$ARGUMENTS

---

## 🔴 CRITICAL RULES

1. **NO CODE WRITING** - This command creates plan file only
2. **Read and apply the knowledge from `~/.claude/plugins/marketplaces/claude-kit-marketplace/agents/project-planner.md`** - NOT Claude's native Plan mode
3. **Socratic Gate** - Ask clarifying questions before planning
4. **Dynamic Naming** - Plan file named based on task

---

## Task

Read and apply ALL instructions from the file `~/.claude/plugins/marketplaces/claude-kit-marketplace/agents/project-planner.md` with this context:

```
CONTEXT:
- User Request: $ARGUMENTS
- Mode: PLANNING ONLY (no code)
- Output: {task-slug}.md in project root (dynamic naming)

NAMING RULES:
1. Extract 2-3 key words from request
2. Lowercase, hyphen-separated
3. Max 30 characters
4. Example: "e-commerce cart" → ecommerce-cart.md

RULES:
1. Follow Phase -1 (Context Check) from `~/.claude/plugins/marketplaces/claude-kit-marketplace/agents/project-planner.md`
2. Follow Phase 0 (Socratic Gate) from `~/.claude/plugins/marketplaces/claude-kit-marketplace/agents/project-planner.md`
3. Create {slug}.md with task breakdown
4. DO NOT write any code files
5. REPORT the exact file name created
```

---

## Expected Output

| Deliverable | Location |
|-------------|----------|
| Project Plan | `{task-slug}.md` in project root |
| Task Breakdown | Inside plan file |
| Agent Assignments | Inside plan file |
| Verification Checklist | Phase X in plan file |

---

## After Planning

Tell user:
```
[OK] Plan created: {slug}.md in project root

Next steps:
- Review the plan
- Run `/wf_create` to start implementation
- Or modify plan manually
```

---

## Naming Examples

| Request | Plan File |
|---------|-----------|
| `/wf_plan e-commerce site with cart` | `ecommerce-cart.md` |
| `/wf_plan mobile app for fitness` | `fitness-app.md` |
| `/wf_plan add dark mode feature` | `dark-mode.md` |
| `/wf_plan fix authentication bug` | `auth-fix.md` |
| `/wf_plan SaaS dashboard` | `saas-dashboard.md` |

---

## Usage

```
/wf_plan e-commerce site with cart
/wf_plan mobile app for fitness tracking
/wf_plan SaaS dashboard with analytics
```
