---
name: wf_api_contract
description: "Generate API contract (openapi.yaml) from plan/specs (draft) or from implemented code (export). Run after /wf_plan for backend projects."
version: 1.0.0
requires_agents: api-contract
requires_skills: openapi-contract
artifact_outputs: openapi-contract
---

# /wf_api_contract - API Contract Generator

$ARGUMENTS

---

## 🔀 Subcommand Routing (MANDATORY FIRST STEP)

Parse `$ARGUMENTS`:

| Pattern | Subcommand | Action |
|---------|-----------|--------|
| `export <name>` | **EXPORT** | Scan implemented code → generate FINAL openapi.yaml |
| `<name>` | **DRAFT** | Read plan/specs → generate DRAFT openapi.yaml |
| *(empty)* | **DRAFT** | Auto-detect name from current context |

---

## 📋 DRAFT Mode — Contract from Plan

**Trigger:** `/wf_api_contract <name>`

**Use case:** Run immediately after `/wf_plan <name>` when the backend is not yet implemented, so Frontend can start mocking data early.

### Steps:

#### ⚡ Phase 0: Parallel Context Load

Invoke **3 subagents via Agent tool** (concurrent background):

| # | Agent | Task |
|---|-------|------|
| 🅰 | `Explore` | Read `openspec/changes/<name>/specs/*/spec.md` if SDD_MODE, or `.wiki/<name>/plan.md` if CLASSIC_MODE |
| 🅱 | `Explore` | Read `.wiki/<name>/srs.md` if available + `llm-full.md` if available |
| 🅲 | `Explore` | Check if `openspec/` exists (detect mode) + detect tech stack (pom.xml, package.json, etc.) |

```
Agent(Explore): "Check if openspec/ directory exists (SDD_MODE or CLASSIC_MODE).
  If SDD_MODE: read openspec/changes/<name>/specs/*/spec.md
  If CLASSIC_MODE: read .wiki/<name>/plan.md
  Return: mode + full content of specs/plan"

Agent(Explore): "Read .wiki/<name>/srs.md if it exists (return content or NO_SRS).
  Also read llm-full.md at project root if it exists (return content or NO_LLM).
  Return both."

Agent(Explore): "Detect tech stack: check pom.xml (Spring Boot), package.json (Node/Express/NestJS), build.gradle, requirements.txt.
  Also check src/ for auth pattern: SessionCreationPolicy, JwtFilter, BearerToken.
  Return: tech_stack + auth_type"
```

> ⏳ **Wait for ALL 3 subagents to complete.**

#### Phase 1: Generate Contract

Invoke **api-contract agent** with full context:

```
Agent(api-contract): "Generate DRAFT openapi.yaml for feature '<name>'.

  MODE: <CLASSIC_MODE | SDD_MODE>
  TECH STACK: <from 🅲>
  AUTH TYPE: <from 🅲>

  PLAN/SPECS:
  <content from 🅰>

  SRS (if available):
  <content from 🅱>

  LLM CONTEXT (if available):
  <content from 🅱>

  Instructions:
  1. Read the openapi-contract skill for naming conventions and schema templates
  2. Map use cases/tasks from plan to REST endpoints
  3. Create full openapi.yaml with:
     - All endpoints with operationId, summary, tags, parameters, responses
     - All DTO schemas with required fields and examples
     - Reusable components (pagination params, standard error responses)
     - Correct security scheme
     - info.description: 'Status: DRAFT — generated from plan, not yet validated against code'
  4. Mark unclear items with # TODO: confirm comments
  5. Save to: <output_path based on mode>
  6. Return summary of what was created"
```

> ⏳ **Wait for api-contract agent to complete.**

#### Phase 2: Announce

```
✅ API Contract (DRAFT) created: <output_path>

📄 Summary:
- Endpoints: X total (GET: X, POST: X, PUT: X, PATCH: X, DELETE: X)
- Schemas: X DTOs + X request bodies
- Auth: <type>

⚠️ Status: DRAFT — not yet validated against implemented code
<TODO list if any>

Next steps:
- Review openapi.yaml and resolve TODO items
- Share with Frontend team to start mocking
- After Backend implementation is complete:
  /wf_api_contract export <name>
```

---

## 📤 EXPORT Mode — Contract from Code

**Trigger:** `/wf_api_contract export <name>`

**Use case:** Backend implementation is complete; generate a FINAL contract that accurately reflects the actual code.

### Steps:

#### ⚡ Phase 0: Parallel Code Scan

Invoke **3 subagents via Agent tool** (concurrent background):

| # | Agent | Task |
|---|-------|------|
| 🅰 | `Explore` | Scan controllers/routes related to `<name>` |
| 🅱 | `Explore` | Scan related DTOs/schemas and validation annotations |
| 🅲 | `Explore` | Detect auth mechanism + scan exception handlers |

```
Agent(Explore): "Scan source code for controllers/routes related to feature '<name>'.
  Spring Boot: grep -rl '@RestController' src/ | xargs grep -l '<name-keywords>'
  Node/Express: grep -rl 'router\.' src/ routes/ | xargs grep -l '<name-keywords>'
  Return: list of controller files + full content of relevant ones."

Agent(Explore): "Find DTO/schema files related to feature '<name>'.
  Spring Boot: find src/ -name '*<name-keyword>*DTO.java' -o -name '*<name-keyword>*Request.java' -o -name '*<name-keyword>*Response.java'
  Node: find src/ -name '*.dto.ts' -o -name '*.schema.ts' | xargs grep -l '<name-keyword>'
  Return: full content of all found DTO files including @NotNull/@NotBlank/@Size annotations."

Agent(Explore): "Detect authentication mechanism in source code.
  grep -r 'SessionCreationPolicy|JwtFilter|BearerToken|@PreAuthorize' src/ 2>/dev/null | head -10
  Also find @ExceptionHandler or @ControllerAdvice for error format.
  Return: auth_type + error_response_structure."
```

> ⏳ **Wait for ALL 3 subagents to complete.**

#### Phase 1: Generate Final Contract

Invoke **api-contract agent** with real code data:

```
Agent(api-contract): "Generate FINAL openapi.yaml for feature '<name>' from implemented code.

  CONTROLLERS:
  <content from 🅰>

  DTOS:
  <content from 🅱>

  AUTH + ERROR FORMAT:
  <content from 🅲>

  Instructions:
  1. Read the openapi-contract skill for naming conventions and schema templates
  2. Extract EVERY endpoint from the controller files (do not miss any)
  3. Extract EVERY field from DTO classes (including validation constraints → map to schema constraints)
  4. Set info.description: 'Status: FINAL — generated from implemented code'
  5. No TODO comments — this is the real contract
  6. Overwrite: <output_path based on mode>
  7. Return summary"
```

> ⏳ **Wait for api-contract agent to complete.**

#### Phase 2: Update README + Announce

Update `.wiki/<name>/README.md` status to `## Status: ✅ Contract Exported`

```
✅ API Contract (FINAL) exported: <output_path>

📄 Summary:
- Endpoints: X total (GET: X, POST: X, PUT: X, PATCH: X, DELETE: X)
- Schemas: X DTOs + X request bodies
- Auth: <type>
- Status: FINAL (validated from code)

Next steps:
- Copy to Frontend project:
  cp <output_path> /path/to/frontend-project/.wiki/<name>/openapi.yaml
- Or share the file link with the Frontend team
- Frontend runs: /wf_plan <name> to read the contract and implement
```

---

## 🗺️ Output Path Logic

| Mode | Project Mode | Output |
|------|-------------|--------|
| DRAFT | CLASSIC_MODE | `.wiki/<name>/openapi.yaml` |
| DRAFT | SDD_MODE | `openspec/changes/<name>/openapi.yaml` |
| EXPORT | any | `.wiki/<name>/openapi.yaml` (always) |

---

## Examples

```bash
# Draft from plan (right after /wf_plan)
/wf_api_contract ngan-hang-thu-huong

# Export from implemented code
/wf_api_contract export ngan-hang-thu-huong

# Auto-detect (if only one active feature)
/wf_api_contract
```

---

## Full Workflow

```
/wf_plan init ngan-hang-thu-huong
    ↓ User downloads SRS into .wiki/
/wf_plan ngan-hang-thu-huong
    ↓ Claude creates plan/specs
/wf_api_contract ngan-hang-thu-huong      ← DRAFT openapi.yaml (Frontend starts mocking)
    ↓
/wf_create ngan-hang-thu-huong            ← Backend implements
    ↓
/wf_api_contract export ngan-hang-thu-huong  ← FINAL openapi.yaml (validated from code)
    ↓ Share openapi.yaml with Frontend project
/wf_verify
/wf_test
```
