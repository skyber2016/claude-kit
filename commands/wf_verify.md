---
name: wf_verify
description: Verify code changes by execution. Auto-detects API test scripts for projects without unit tests.
version: 2.0.0
requires_agents: test-engineer
requires_skills: verify-changes, lint-and-validate, api-test-runner
artifact_outputs: verification-report
---

# /wf_verify — Prove Code Works

$ARGUMENTS

---

## 🔴 CRITICAL RULES

1. **Load verify-changes skill** — Read `~/.claude/plugins/marketplaces/claude-kit-marketplace/skills/verify-changes/SKILL.md` first
2. **Execute, don't inspect** — Run the code, don't just read it
3. **Report evidence** — Show actual output, not assumptions
4. **Cover edge cases** — Test error paths, not just happy path

---

## Task

Use the `verify-changes` skill to prove code works:

```
CONTEXT:
- What to verify: $ARGUMENTS
- If empty: verify the most recent code changes in this session

WORKFLOW:
1. IDENTIFY what changed (files, functions, behavior)
2. DETECT verification method:
   a. Unit tests exist → run test framework (mvn test, npm test, etc.)
   b. API test script exists (.wiki/<name>/api-tests.sh) → run it
   c. Neither exists → generate API test script from SRS using @[~/.claude/plugins/marketplaces/claude-kit-marketplace/skills/api-test-runner]
3. For API projects: ensure server is running first
4. EXECUTE verification commands
5. REPORT evidence of success or failure
6. FLAG anything that couldn't be verified automatically

API PROJECT DETECTION:
- Check: find . -name "pom.xml" -o -name "build.gradle" | head -1
- If Spring Boot project detected AND no test files exist:
  → Use @[~/.claude/plugins/marketplaces/claude-kit-marketplace/skills/api-test-runner] to generate and run curl-based tests
  → Handle session auth (JSESSIONID) automatically

SERVER STARTUP (if needed):
- Check if server is running: curl -s http://localhost:8080/actuator/health
- If not running, start it: mvn spring-boot:run -Dspring-boot.run.profiles=local &
- Wait for ready: curl --retry 15 --retry-delay 2 --retry-connrefused http://localhost:8080/actuator/health

RULES:
1. Follow verify-changes skill protocol
2. "It should work" is NOT verification — run it
3. Test error paths, not just success paths
4. Report with actual command output as evidence
```

---

## Expected Output

```
## Verification Report

### Changes Verified
- [file/change 1]: ✅ Pass
- [file/change 2]: ✅ Pass

### Evidence
- Build: ✅ Compiled without errors
- Tests: ✅ [N]/[N] passing
- Runtime: ✅ [specific verification result]

### Not Verified
- [anything that needs manual testing]
```

---

## Usage Examples

```
/wf_verify
/wf_verify ngan-hang-thu-huong
/wf_verify the login endpoint handles expired tokens
/wf_verify build passes after refactoring
```
