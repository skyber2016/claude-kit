---
name: wf_test
description: >-
  Unified test workflow. Sub-commands: check (readiness), init (scaffold),
  run/[target] (execute), coverage, watch. For API projects without unit tests,
  generates curl-based test scripts from SRS. Unit tests are optional.
version: 3.0.0
requires_agents: test-engineer
requires_skills: testing-patterns, verify-changes, api-test-runner, wf-test-check
artifact_outputs: test-report
---

# /wf_test — Unified Test Workflow

$ARGUMENTS

---

## Sub-commands

```
/wf_test                     Run all tests (auto-detect framework)
/wf_test check               Pre-flight readiness scan — report missing configs
/wf_test check mcp           MCP servers status only
/wf_test check config        Test config files only
/wf_test check api           API test prerequisites only
/wf_test init                Scaffold test infrastructure files
/wf_test init [stack]        Scaffold for specific stack (spring|angular|dotnet|node)
/wf_test [file/feature]      Generate/run tests for specific target
/wf_test coverage            Show test coverage report
/wf_test watch               Run tests in watch mode
```

---

## 🔀 Sub-command Router

Parse `$ARGUMENTS` and route:

| Argument | Action |
|----------|--------|
| *(empty)* | → **Run** (Phase 3) |
| `check` | → **Check** (Phase 1) |
| `check mcp` | → **Check** (Phase 1, MCP only) |
| `check config` | → **Check** (Phase 1, config only) |
| `check api` | → **Check** (Phase 1, API only) |
| `init` | → **Init** (Phase 2) |
| `init [stack]` | → **Init** (Phase 2, specific stack) |
| `coverage` | → **Run** (Phase 3, coverage mode) |
| `watch` | → **Run** (Phase 3, watch mode) |
| `[file/feature]` | → **Run** (Phase 3, targeted) |

---

## Phase 1: Check (Pre-Flight Readiness)

📚 Using skill: `wf-test-check`

**Read `skills/wf-test-check/SKILL.md`** and follow all phases.

**Summary:** Scan project for missing MCP configs, test config files, dependencies.
Output readiness report. Does NOT fix anything.

**Key rules:**
- ⚪ Unit tests are **OPTIONAL** — report as optional, never blocker
- ❌ Missing required configs are **BLOCKERS**
- ✅ Don't auto-fix — only report and suggest commands
- 📋 Monorepo — scan each submodule independently
- Save report to `.wiki/{slug}/test-readiness.md`

---

## Phase 2: Init (Scaffold Test Infrastructure)

> Scaffold the minimal test files needed for a project.
> Does NOT generate test cases — only creates config/structure files.

### 2.1 Auto-detect or Use Argument

```
/wf_test init          → auto-detect from pom.xml / angular.json / *.csproj / package.json
/wf_test init spring   → force Spring Boot scaffold
/wf_test init angular  → force Angular scaffold
/wf_test init dotnet   → force .NET Core scaffold
/wf_test init node     → force Node.js scaffold
```

### 2.2 Scaffold Templates Per Stack

#### Spring Boot (Java)

```
Files to create:
├── src/test/resources/
│   └── application-test.yml          ← Test profile config
├── .wiki/{feature}/
│   ├── srs.md                        ← SRS template (for API test generation)
│   └── README.md                     ← Feature tracking
└── .env.test                         ← Test credentials (gitignored)
```

**`application-test.yml` template:**
```yaml
# Test profile configuration
spring:
  datasource:
    url: jdbc:h2:mem:testdb
    driver-class-name: org.h2.Driver
  jpa:
    hibernate:
      ddl-auto: create-drop
    show-sql: true
  security:
    user:
      name: admin
      password: admin123
```

**`.env.test` template:**
```env
# Test credentials — DO NOT commit to git
BASE_URL=http://localhost:8080
LOGIN_USER=admin
LOGIN_PASS=admin123
TEST_PROFILE=test
```

#### Angular

```
Files to create:
├── src/
│   └── environments/
│       └── environment.test.ts       ← Test environment config
├── .wiki/{feature}/
│   ├── srs.md                        ← SRS template
│   └── README.md                     ← Feature tracking
└── .env.test                         ← E2E test config
```

**`environment.test.ts` template:**
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',
  mockAuth: true,
};
```

#### .NET Core

```
Files to create:
├── tests/
│   └── {Project}.Tests/
│       ├── {Project}.Tests.csproj     ← Test project
│       └── appsettings.Test.json      ← Test config
├── .wiki/{feature}/
│   ├── srs.md                         ← SRS template
│   └── README.md                      ← Feature tracking
└── .env.test                          ← Test credentials
```

**`appsettings.Test.json` template:**
```json
{
  "ConnectionStrings": {
    "Default": "Server=localhost;Database=TestDb;Trusted_Connection=true"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Warning"
    }
  }
}
```

#### Node.js (Express/NestJS)

```
Files to create:
├── jest.config.ts                     ← Jest config (if not exists)
├── .wiki/{feature}/
│   ├── srs.md                         ← SRS template
│   └── README.md                      ← Feature tracking
└── .env.test                          ← Test environment
```

**`jest.config.ts` template:**
```typescript
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.spec.ts', '**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts'],
};

export default config;
```

### 2.3 SRS Template (Shared Across All Stacks)

**`.wiki/{feature}/srs.md` template:**

```markdown
# SRS: {Feature Name}

## Overview
[Brief description of the feature]

## Basic Flows

### BF1 — [Flow Name]
- **Actor:** [User/Admin/System]
- **Endpoint:** `[METHOD] /api/v1/[resource]`
- **Input:** [Request body or params]
- **Output:** [Expected response]
- **Status:** [HTTP status code]

## Business Rules

### BR1 — [Rule Name]
- **Condition:** [When this happens]
- **Expected:** [System should do this]
- **Error:** [Error message if violated]

## Validation Rules

| Field | Type | Required | Min | Max | Pattern | Error Message |
|-------|------|----------|-----|-----|---------|---------------|
| name | string | ✅ | 1 | 255 | — | "Tên không được để trống" |
```

### 2.4 Init Rules

1. **NEVER overwrite** existing files — skip with `⚠️ Already exists: [file]`
2. **Auto-detect `{feature}`** from `.wiki/` subdirectories or ask user
3. **Add `.env.test` to `.gitignore`** if not already there
4. **Monorepo:** run init per submodule, create shared `.env.test` at root
5. **Report** what was created:

```
✅ Created: src/test/resources/application-test.yml
✅ Created: .env.test
✅ Created: .wiki/auth-feature/srs.md
✅ Created: .wiki/auth-feature/README.md
⚠️ Already exists: jest.config.ts (skipped)
📝 Added .env.test to .gitignore
```

---

## Phase 3: Run (Test Execution)

### 3.1 Test Framework Detection (FIRST STEP)

```bash
# Unit test framework?
test -f pom.xml && grep -q "junit\|mockito" pom.xml && echo "JUNIT"
test -f package.json && grep -q "jest\|vitest\|mocha" package.json && echo "JS_TEST"

# API test scripts?
ls .wiki/*/api-tests.sh 2>/dev/null && echo "API_TESTS_EXIST"

# SRS available?
ls .wiki/*/srs.md 2>/dev/null && echo "SRS_AVAILABLE"
```

| Detection Result | Action |
|---|---|
| JUNIT / JS_TEST | Run existing test framework |
| API_TESTS_EXIST | Run existing API test scripts |
| SRS_AVAILABLE + no tests | Generate API test scripts from SRS using `api-test-runner` skill |
| Nothing found | Run `check` sub-command automatically, then suggest `/wf_test init` |

### 3.2 Generate Tests — With Unit Test Framework

When unit test framework exists:

1. **Analyze the code** — functions, edge cases, dependencies
2. **Generate test cases** — happy path, errors, edge cases
3. **Write tests** — use project's framework, follow existing patterns, mock externals

### 3.3 Generate Tests — Without Unit Test (API Projects)

When NO unit test framework exists but SRS is available:

1. **Read SRS** from `.wiki/<name>/srs.md`
2. **Read `api-test-runner` skill** for full generation protocol
3. **Map SRS to test cases:**

   | SRS Section | Test Cases |
   |---|---|
   | Basic Flow (BF1-BF4) | 1 success test per flow |
   | Business Rules (BR1-BR10) | 1 negative test per rule |
   | Required Fields | 1 missing-field test per required field |
   | Error Messages | Assert exact error text from SRS |

4. **Generate files:**
   - `.wiki/<name>/api-tests.http` (documentation)
   - `.wiki/<name>/api-tests.sh` (executable script)

5. **Run the generated script:**
   ```bash
   bash .wiki/<name>/api-tests.sh http://localhost:8080 admin admin123
   ```

---

## Phase 4: Report (MANDATORY after every test run)

After ANY test execution, generate `.wiki/<name>/report.md`.

### Report template:

```markdown
# Test Report: <Name>

> Generated: YYYY-MM-DD HH:mm:ss
> Runner: [JUnit | API Test Script | Manual Verification]
> Triggered by: /wf_test <arguments>

## Summary

| Metric | Value |
|--------|-------|
| Total Tests | X |
| ✅ Passed | X |
| ❌ Failed | X |
| ⏭️ Skipped | X |
| Pass Rate | XX.X% |
| Duration | X.Xs |

## Results

| # | Test Case | Status | Details |
|---|-----------|--------|---------|
| 1 | Login | ✅ Pass | HTTP 200 |
| 2 | BF1 - Search All | ✅ Pass | HTTP 200, returned 5 records |

## Failed Tests Detail

### ❌ [Test Name]
- **Expected:** [what should happen]
- **Actual:** [what happened]
- **Possible cause:** [analysis]
- **Suggested fix:** [recommendation]

## Environment

| Key | Value |
|-----|-------|
| Base URL | http://localhost:8080 |
| Auth | Session (JSESSIONID) |
```

### Report behavior:
1. **First run:** Create new `report.md`
2. **Subsequent runs:** Prepend new report, archive previous under `## History`
3. **Update `.wiki/<name>/README.md`** status badge

---

## Test Patterns

### Unit Test Structure (AAA Pattern)

```typescript
describe('AuthService', () => {
  describe('login', () => {
    it('should return token for valid credentials', async () => {
      // Arrange
      const credentials = { email: 'test@test.com', password: 'pass123' };

      // Act
      const result = await authService.login(credentials);

      // Assert
      expect(result.token).toBeDefined();
    });

    it('should throw for invalid password', async () => {
      // Arrange
      const credentials = { email: 'test@test.com', password: 'wrong' };

      // Act & Assert
      await expect(authService.login(credentials)).rejects.toThrow('Invalid credentials');
    });
  });
});
```

---

## Key Principles

- **Test behavior not implementation**
- **One assertion per test** (when practical)
- **Descriptive test names**
- **Arrange-Act-Assert pattern**
- **Mock external dependencies**
- **Unit tests are OPTIONAL** — API test scripts are the primary test mechanism

---

## Examples

```
/wf_test                              Run all tests
/wf_test check                        What's missing for testing?
/wf_test check mcp                    Are MCP servers ready?
/wf_test init                         Scaffold test files (auto-detect stack)
/wf_test init spring                  Scaffold for Spring Boot
/wf_test ngan-hang-thu-huong          Generate/run API tests from SRS
/wf_test src/services/auth.service.ts Generate unit tests for specific file
/wf_test coverage                     Show test coverage report
/wf_test watch                        Watch mode
```
