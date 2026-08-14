---
name: openapi-contract
description: "Generate OpenAPI 3.1 contract (openapi.yaml) from plan, specs, or implemented code. Covers naming conventions, schema structure, and validation rules for REST APIs."
when_to_use: "When generating openapi.yaml from plan/SRS (draft) or from implemented code (export). Use with /wf_api_contract."
allowed-tools: Read, Grep, Glob, Bash
version: 1.0.0
---

# OpenAPI Contract Skill

Guidelines for generating a standards-compliant `openapi.yaml` (OpenAPI 3.1) from plan/specs or implemented code.

---

## 📌 Input Sources

### Draft Mode (from plan — code not yet implemented)
Priority order:
1. `openspec/changes/<name>/specs/*/spec.md` — delta specs (if SDD_MODE)
2. `.wiki/<name>/plan.md` — implementation plan (if CLASSIC_MODE)
3. `.wiki/<name>/srs.md` — original SRS
4. User's text description

### Export Mode (from implemented code)
Priority order:
1. Controller/Route files (actual scan)
2. DTO/Schema classes
3. Validation annotations
4. Exception handlers

---

## 🏗️ openapi.yaml Structure

```yaml
openapi: 3.1.0

info:
  title: "<Feature Name> API"
  version: "1.0.0"
  description: |
    API contract for <feature>.
    Generated from: <source>
    Date: <YYYY-MM-DD>
    Status: DRAFT | FINAL

servers:
  - url: http://localhost:8080
    description: Local dev

tags:
  - name: <Module>
    description: <Module description>

paths:
  /api/<resource>:
    get:
      tags: [<Module>]
      summary: "List / Search <resource>"
      operationId: list<Resource>
      parameters:
        - $ref: '#/components/parameters/<Param>'
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PageOf<Resource>DTO'
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '403':
          $ref: '#/components/responses/Forbidden'

components:
  schemas: {}
  parameters: {}
  responses: {}
  securitySchemes: {}

security:
  - sessionAuth: []
```

---

## 📏 Naming Conventions

### Endpoints
| Pattern | Example |
|---------|---------|
| Collection | `GET /api/bene-banks` |
| Single item | `GET /api/bene-banks/{id}` |
| Sub-resource | `GET /api/bene-banks/{id}/branches` |
| Action | `PATCH /api/bene-banks/{id}/status` |

### OperationId (camelCase)
| HTTP + Pattern | OperationId |
|----------------|-------------|
| GET collection | `listBeneBanks` |
| GET by ID | `getBeneBank` |
| POST | `createBeneBank` |
| PUT | `updateBeneBank` |
| PATCH sub-resource | `updateBeneBankStatus` |
| DELETE | `deleteBeneBank` |

### Schema Names
| Type | Convention | Example |
|------|-----------|---------|
| Response DTO | `<Resource>DTO` | `BeneBankDTO` |
| Create request | `Create<Resource>Request` | `CreateBeneBankRequest` |
| Update request | `Update<Resource>Request` | `UpdateBeneBankRequest` |
| Partial update | `<Resource>StatusRequest` | `BeneBankStatusRequest` |
| Paged response | `PageOf<Resource>DTO` | `PageOfBeneBankDTO` |

---

## 🔑 Security Schemes

### Session-based (Spring Boot default)
```yaml
securitySchemes:
  sessionAuth:
    type: apiKey
    in: cookie
    name: JSESSIONID
```

### JWT Bearer
```yaml
securitySchemes:
  bearerAuth:
    type: http
    scheme: bearer
    bearerFormat: JWT
```

### Detect from code
```bash
grep -r "SessionCreationPolicy\|JwtAuth\|httpBasic\|BearerToken" src/
```

---

## 📄 Schemas — Standards

### DTO Schema
```yaml
BeneBankDTO:
  type: object
  description: "Beneficiary bank information"
  properties:
    id:
      type: integer
      format: int64
      readOnly: true
      example: 1
    bankCode:
      type: string
      maxLength: 10
      example: "VCB"
    status:
      $ref: '#/components/schemas/Status'
    createdAt:
      type: string
      format: date-time
      readOnly: true
  required:
    - id
    - bankCode
    - status
```

### Enum Schema
```yaml
Status:
  type: string
  enum: [ACTIVE, INACTIVE]
  description: "Record status"
```

### Paged Response Schema
```yaml
PageOfBeneBankDTO:
  type: object
  properties:
    content:
      type: array
      items:
        $ref: '#/components/schemas/BeneBankDTO'
    totalElements:
      type: integer
      format: int64
    totalPages:
      type: integer
    page:
      type: integer
    size:
      type: integer
  required:
    - content
    - totalElements
    - totalPages
```

---

## ❌ Standard Error Responses

### Error Schema
```yaml
ErrorResponse:
  type: object
  properties:
    code:
      type: string
      description: "Business error code"
      example: "DUPLICATE_BANK_CODE"
    message:
      type: string
      description: "Human-readable error description"
      example: "Bank code already exists"
    field:
      type: string
      description: "Field that caused the error (if applicable)"
      example: "bankCode"
  required:
    - code
    - message
```

### Standard Responses
```yaml
responses:
  BadRequest:
    description: "400 — Invalid input data"
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/ErrorResponse'
  Unauthorized:
    description: "401 — Not authenticated"
  Forbidden:
    description: "403 — Insufficient permissions"
  NotFound:
    description: "404 — Resource not found"
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/ErrorResponse'
  Conflict:
    description: "409 — Duplicate data"
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/ErrorResponse'
```

---

## 📋 Standard Parameters

### Pagination Parameters
```yaml
parameters:
  PageParam:
    name: page
    in: query
    schema:
      type: integer
      default: 0
      minimum: 0
    description: "Page number (zero-based)"
  SizeParam:
    name: size
    in: query
    schema:
      type: integer
      default: 20
      minimum: 1
      maximum: 100
    description: "Number of items per page"
  IdPathParam:
    name: id
    in: path
    required: true
    schema:
      type: integer
      format: int64
    description: "Resource ID"
```

---

## ✅ Draft Mode — Inference Rules

When generating contract from plan/SRS (no code yet):

1. **Read spec.md or plan.md** → identify list of use cases / user stories
2. **Each use case** → map to one or more endpoints:
   - "View list of X" → `GET /api/<x>s`
   - "View X detail" → `GET /api/<x>s/{id}`
   - "Create X" → `POST /api/<x>s`
   - "Update X" → `PUT /api/<x>s/{id}`
   - "Delete X" → `DELETE /api/<x>s/{id}`
   - "Lock/Unlock X" → `PATCH /api/<x>s/{id}/status`
3. **Read business rules** → extract validation constraints into schema
4. **Read data fields** → create DTO schemas
5. **Mark as draft** in `info.description`: `Status: DRAFT`

---

## 🔍 Export Mode — Code Scanning

### Spring Boot
```bash
# Find controllers
grep -rl "@RestController" src/

# Read request mappings
grep -n "@RequestMapping\|@GetMapping\|@PostMapping\|@PutMapping\|@PatchMapping\|@DeleteMapping" src/<controller>.java

# Find DTOs
find src/ -name "*DTO.java" -o -name "*Request.java" -o -name "*Response.java"

# Find validation annotations
grep -n "@NotNull\|@NotBlank\|@Size\|@Min\|@Max\|@Pattern" src/<dto>.java

# Find exception handlers
grep -rl "@ExceptionHandler\|@ControllerAdvice" src/
```

---

## 📁 Output Location

| Mode | Output File |
|------|-------------|
| Draft (CLASSIC) | `.wiki/<name>/openapi.yaml` |
| Draft (SDD) | `openspec/changes/<name>/openapi.yaml` |
| Export (both) | `.wiki/<name>/openapi.yaml` (overwrite) |

---

## 🚀 Validation (optional)

If `npx @redocly/cli` is available:
```bash
npx @redocly/cli lint .wiki/<name>/openapi.yaml
```

If `swagger-cli` is available:
```bash
npx swagger-cli validate .wiki/<name>/openapi.yaml
```
