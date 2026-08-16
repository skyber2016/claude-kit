---
name: wf-test-check
description: >-
  Pre-flight readiness check before running tests. Scans for missing MCP configs,
  test config files, environment setup, and dependencies. Reports what the user
  needs to fix before tests can run. Unit tests are optional.
  Requires skills: testing-patterns.
when_to_use: "Invoked by /wf_test check sub-command. Also auto-runs when /wf_test detects nothing and falls back to readiness scan."
allowed-tools: Read, Glob, Grep, Bash
version: 1.0.0
---

# Test Readiness Check (Pre-Flight)

> **PURPOSE:** Scan the project and report what's missing before tests can run.
> **NOT** a test runner — this is a diagnostic tool.

---

## 🔴 CRITICAL RULE: Report, Don't Fix

This workflow **ONLY reports** missing items. It does NOT auto-install or auto-configure.
Present findings as a CLI-style checklist so the user knows exactly what to do.

---

## Phase 1: Project Detection

Detect project type and tech stack by scanning for marker files:

| Marker File | Tech Stack | Test Framework Expected |
|-------------|-----------|------------------------|
| `pom.xml` | Spring Boot (Java) | JUnit 5 + Mockito |
| `build.gradle` | Spring Boot (Gradle) | JUnit 5 + Mockito |
| `angular.json` | Angular | Karma/Jasmine or Jest |
| `*.csproj` / `*.sln` | .NET Core | xUnit / NUnit / MSTest |
| `package.json` (no angular.json) | Node.js | Jest / Vitest / Mocha |

For **monorepo** (git submodules): scan each submodule independently.

```
# Detect monorepo
git submodule status 2>/dev/null
# If output is non-empty → scan each submodule path
```

---

## Phase 2: Readiness Checks

Run ALL applicable checks. Report each as ✅ PASS or ❌ MISSING.

### 2.1 MCP Readiness

> Check if MCP tools required for testing/development are configured and functional.

| Check | How to Verify | Required? |
|-------|--------------|-----------|
| **codebase-memory-mcp indexed** | `index_status(project_path=".")` — check if status is "indexed" | Recommended |
| **codebase-memory-mcp installed** | Check `.mcp.json` or MCP server config for `codebase-memory-mcp` | Recommended |
| **basic-memory available** | Check MCP config for `basic-memory` server entry | Optional |
| **context7 available** | Check MCP config for `context7` server entry | Optional |

**MCP Config Locations to Check (priority order):**

```bash
# Project-level
cat .mcp.json 2>/dev/null

# Claude Code project-level
cat .claude/mcp.json 2>/dev/null

# User-level (Claude Code)
cat ~/.claude/mcp.json 2>/dev/null

# Antigravity project-level
cat .gemini/settings.json 2>/dev/null
```

### 2.2 Test Config Files

| Tech Stack | Config File | Required? | Purpose |
|-----------|------------|-----------|---------|
| **Spring Boot** | `src/test/resources/application-test.yml` or `application-test.properties` | ✅ Yes (if test profile used) | Test database, mock configs |
| **Spring Boot** | `pom.xml` → `junit-jupiter`, `mockito-core` in deps | Optional (unit test) | Unit test framework |
| **Angular** | `karma.conf.js` or `jest.config.ts` | Optional (unit test) | Test runner config |
| **Angular** | `playwright.config.ts` or `protractor.conf.js` | Optional (E2E) | E2E test config |
| **.NET Core** | `*.Tests.csproj` or `*.Test.csproj` | Optional (unit test) | Test project |
| **.NET Core** | `appsettings.Test.json` | ✅ Yes (if test env used) | Test environment config |
| **Node.js** | `jest.config.*` or `vitest.config.*` or `mocha` in package.json | Optional (unit test) | Test framework config |
| **Node.js** | `playwright.config.*` | Optional (E2E) | E2E test config |
| **All** | `.env.test` or `.env.testing` | Recommended | Test environment variables |

### 2.3 API Test Readiness (for `/wf_test` API script mode)

| Check | How to Verify | Required? |
|-------|--------------|-----------|
| **SRS exists** | `ls .wiki/*/srs.md` | Needed for API test generation |
| **API test script exists** | `ls .wiki/*/api-tests.sh` | Needed for API test execution |
| **Server health endpoint** | `curl -s http://localhost:8080/actuator/health` (Spring) | Needed for API test execution |
| **Auth config available** | Grep for `SessionCreationPolicy` / `JwtAuthenticationFilter` / `httpBasic` | Needed for auth-based tests |
| **Test credentials** | Check `.env.test` or `api-tests.sh` for LOGIN_USER/LOGIN_PASS | Needed for auth-based tests |

### 2.4 Dependencies

| Tech Stack | Check | Command |
|-----------|-------|---------|
| **Java** | Maven deps resolved | `mvn dependency:resolve -q` exit code |
| **Node.js** | node_modules exists | `ls node_modules/.package-lock.json` |
| **Angular** | ng CLI available | `npx ng version` exit code |
| **.NET** | NuGet restored | `dotnet restore` exit code |

---

## Phase 3: Output Report

### Report Format (CLI-style)

```markdown
# 🔍 Test Readiness Report

**Project:** [project-name]
**Tech Stack:** [detected stack]
**Scan Date:** [timestamp]

## MCP Status

| MCP Server | Status | Action Needed |
|-----------|--------|---------------|
| codebase-memory-mcp | ❌ Not indexed | Run `index_repository(project_path=".")` |
| basic-memory | ✅ Available | — |

## Test Infrastructure

| Item | Status | Action Needed |
|------|--------|---------------|
| Test config (application-test.yml) | ❌ Missing | Create `src/test/resources/application-test.yml` |
| Unit test framework (JUnit 5) | ⚪ Optional — not installed | Add `junit-jupiter` to pom.xml if needed |
| E2E config (playwright.config.ts) | ⚪ Optional — not found | — |
| .env.test | ❌ Missing | Create `.env.test` with test credentials |
| API test script | ✅ Found | `.wiki/auth-feature/api-tests.sh` |

## API Test Readiness

| Item | Status | Action Needed |
|------|--------|---------------|
| SRS document | ✅ Found | `.wiki/auth-feature/srs.md` |
| Server running | ❌ Not responding | Start server: `mvn spring-boot:run` |
| Auth config detected | ✅ SESSION_AUTH | — |
| Test credentials | ❌ Missing | Add LOGIN_USER/LOGIN_PASS to `.env.test` |

## Summary

| Category | ✅ Pass | ❌ Missing | ⚪ Optional |
|----------|---------|-----------|------------|
| MCP | 1 | 1 | 0 |
| Test Infra | 2 | 2 | 2 |
| API Test | 2 | 2 | 0 |
| **Total** | **5** | **5** | **2** |

### 🔴 Blockers (Must Fix Before Testing)
1. Create `src/test/resources/application-test.yml`
2. Create `.env.test` with test credentials
3. Start server: `mvn spring-boot:run`
4. Run `index_repository(project_path=".")` to index codebase for MCP

### ⚪ Optional (Not Required)
- Unit test framework (JUnit 5) — unit tests are optional
- E2E config (playwright) — only needed for E2E tests
```

### Status Icons

| Icon | Meaning |
|------|---------|
| ✅ | Available / Configured |
| ❌ | Missing / Blocker — must fix |
| ⚪ | Optional — not installed but not required |
| ⚠️ | Partially configured — may cause issues |

---

## Phase 4: Save Report

Save the report to `.wiki/{project-slug}/test-readiness.md`.

If `.wiki/` does not exist, save to project root as `test-readiness.md`.

---

## Monorepo Handling

For monorepo projects (detected via `git submodule status`):

1. Run Phase 2 checks **per submodule** independently
2. Report is split into workspace sections:

```markdown
## 📦 apps/backend (Spring Boot)
[checks for backend...]

## 📦 apps/frontend (Angular)
[checks for frontend...]
```

3. Each workspace gets its own blocker list

---

## Integration with Existing Workflows

This skill can be invoked:

1. **Standalone:** via `/wf_test_check` command
2. **As Phase 0** of `/wf_test`: when test framework detection fails, suggest running this check
3. **As Phase 0** of `/wf_verify`: before attempting verification

### Suggested Integration Point

In `wf_test` Phase 1 (Test Framework Detection), when **Branch D (Nothing found)** is reached:

```
Instead of just prompting user for direction, suggest:
"Run /wf_test_check to diagnose what's missing for testing."
```
