---
name: wf_test
description: Test generation and execution. For projects without unit tests, generates API test scripts from SRS using curl.
version: 2.0.0
requires_agents: test-engineer
requires_skills: testing-patterns, verify-changes, api-test-runner
artifact_outputs: test-report
---

# /wf_test - Test Generation and Execution

$ARGUMENTS

---

## Purpose

This command generates tests, runs existing tests, or checks test coverage.

---

## Sub-commands

```
/wf_test                - Run all tests
/wf_test [file/feature] - Generate tests for specific target
/wf_test coverage       - Show test coverage report
/wf_test watch          - Run tests in watch mode
```

---

## Behavior

### 🔍 Test Framework Detection (FIRST STEP)

Detect what test infrastructure exists:

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
| SRS_AVAILABLE + no tests | Generate API test scripts from SRS using `@[skills/api-test-runner]` |
| Nothing found | Ask user what to test |

---

### Generate Tests — With Unit Test Framework

When unit test framework exists:

1. **Analyze the code**
   - Identify functions and methods
   - Find edge cases
   - Detect dependencies to mock

2. **Generate test cases**
   - Happy path tests
   - Error cases
   - Edge cases
   - Integration tests (if needed)

3. **Write tests**
   - Use project's test framework (Jest, Vitest, etc.)
   - Follow existing test patterns
   - Mock external dependencies

---

## Output Format

### For Test Generation

```markdown
## 🧪 Tests: [Target]

### Test Plan
| Test Case | Type | Coverage |
|-----------|------|----------|
| Should create user | Unit | Happy path |
| Should reject invalid email | Unit | Validation |
| Should handle db error | Unit | Error case |

### Generated Tests

`tests/[file].test.ts`

[Code block with tests]

---

Run with: `npm test`
```

### For Test Execution

```
🧪 Running tests...

✅ auth.test.ts (5 passed)
✅ user.test.ts (8 passed)
❌ order.test.ts (2 passed, 1 failed)

Failed:
  ✗ should calculate total with discount
    Expected: 90
    Received: 100

Total: 15 tests (14 passed, 1 failed)
```

---

## Examples

```
/wf_test                              - Run all tests
/wf_test ngan-hang-thu-huong          - Generate/run API tests from SRS
/wf_test src/services/auth.service.ts - Generate unit tests for specific file
/wf_test coverage                     - Show test coverage report
```

---

### Generate Tests — Without Unit Test Framework (API Projects)

When NO unit test framework exists but SRS is available:

1. **Read SRS** from `.wiki/<name>/srs.md`
2. **Read `@[skills/api-test-runner]`** for full generation protocol
3. **Map SRS to test cases:**

   | SRS Section | Test Cases |
   |---|---|
   | Basic Flow (BF1-BF4) | 1 success test per flow |
   | Business Rules (BR1-BR10) | 1 negative test per rule |
   | Required Fields | 1 missing-field test per required field |
   | Error Messages | Assert exact error text from SRS |

4. **Generate files:**
   - `.wiki/<name>/api-tests.http` (human-readable documentation)
   - `.wiki/<name>/api-tests.sh` (executable curl script)

5. **Run the generated script:**
   ```bash
   bash .wiki/<name>/api-tests.sh http://localhost:8080 admin admin123
   ```

6. **Report results** in standard format

---

## Test Patterns

### Unit Test Structure

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
