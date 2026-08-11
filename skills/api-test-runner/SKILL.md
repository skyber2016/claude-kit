---
name: api-test-runner
version: 1.0.0
description: Generate and execute API test scripts using curl for projects without unit tests. Handles session-based auth (JSESSIONID), JWT, and Basic Auth. Use when /wf_verify or /wf_test needs to call real API endpoints.
---

# API Test Runner Skill

> For projects **without unit tests** that need to verify APIs by actually calling them.

---

## When to Use

- `/wf_verify` detects a Spring Boot / API project with no test framework
- `/wf_test` is called but no test files exist
- User explicitly asks to test API endpoints

---

## File Structure

Each SRS/feature gets a test file inside its `.wiki/` folder:

```
.wiki/<name>/
├── srs.md              ← SRS source
├── plan.md             ← Plan
├── api-tests.http      ← Human-readable test definitions
└── api-tests.sh        ← Executable test script (generated from .http)
```

---

## Step 1: Detect Auth Type

Check project configuration:

```bash
# Spring Security with session
grep -r "SessionCreationPolicy" src/ 2>/dev/null && echo "SESSION_AUTH"

# JWT
grep -r "JwtAuthenticationFilter\|Bearer\|jjwt" src/ 2>/dev/null && echo "JWT_AUTH"

# Basic Auth
grep -r "httpBasic" src/ 2>/dev/null && echo "BASIC_AUTH"
```

---

## Step 2: Generate `.http` File

Create human-readable API test definitions. These serve as **documentation + test cases**.

### Template — Session Auth (JSESSIONID)

```http
### === CONFIG ===
@host = http://localhost:9010
@username = admin
@password = admin123

### === LOGIN ===
# @name login
POST {{host}}/api/v1/auth/login
Content-Type: application/x-www-form-urlencoded

username={{username}}&password={{password}}

### === TEST: Search (BF1) ===
# @name search_all
GET {{host}}/api/v1/bene-banks
Cookie: JSESSIONID={{login.response.headers.Set-Cookie}}

### === TEST: Search with filter ===
# @name search_filter
GET {{host}}/api/v1/bene-banks?bankNameVn=vietcom&status=ACTIVE
Cookie: JSESSIONID={{login.response.headers.Set-Cookie}}

### === TEST: Create (BF2) ===
# @name create
POST {{host}}/api/v1/bene-banks
Content-Type: application/json
Cookie: JSESSIONID={{login.response.headers.Set-Cookie}}

{
  "bankCode": "VCB",
  "bankNameVn": "Ngân hàng TMCP Ngoại Thương Việt Nam",
  "bankNameEn": "Joint Stock Commercial Bank for Foreign Trade of Vietnam",
  "shortName": "Vietcombank",
  "citadCode": "97036001",
  "napasCode": "970360",
  "logoUrl": "https://media.vietbank.com.vn/vcb-logo.png",
  "priority": 1
}

### === TEST: Create duplicate bankCode (BR2 - expect error) ===
# @name create_duplicate
POST {{host}}/api/v1/bene-banks
Content-Type: application/json
Cookie: JSESSIONID={{login.response.headers.Set-Cookie}}

{
  "bankCode": "VCB",
  "bankNameVn": "Duplicate Bank",
  "bankNameEn": "Duplicate Bank",
  "shortName": "DUP",
  "citadCode": "99999999",
  "napasCode": "999999",
  "logoUrl": "https://example.com/logo.png",
  "priority": 99
}

### === TEST: Update (BF3) ===
# @name update
PUT {{host}}/api/v1/bene-banks/1
Content-Type: application/json
Cookie: JSESSIONID={{login.response.headers.Set-Cookie}}

{
  "bankNameVn": "Ngân hàng TMCP Ngoại Thương VN (Updated)",
  "bankNameEn": "Vietcombank Updated",
  "shortName": "VCB",
  "citadCode": "97036001",
  "napasCode": "970360",
  "logoUrl": "https://media.vietbank.com.vn/vcb-logo-v2.png",
  "priority": 1
}

### === TEST: Lock (BF4) ===
# @name lock
PATCH {{host}}/api/v1/bene-banks/1/status
Content-Type: application/json
Cookie: JSESSIONID={{login.response.headers.Set-Cookie}}

{
  "status": "INACTIVE"
}

### === TEST: Unlock (BF4) ===
# @name unlock
PATCH {{host}}/api/v1/bene-banks/1/status
Content-Type: application/json
Cookie: JSESSIONID={{login.response.headers.Set-Cookie}}

{
  "status": "ACTIVE"
}
```

---

## Step 3: Generate Executable Test Script

Generate `api-tests.sh` that Claude Code can run directly:

```bash
#!/bin/bash
# Auto-generated API test script
# Usage: bash .wiki/<name>/api/v1-tests.sh [base_url] [username] [password]

BASE_URL="${1:-http://localhost:9010}"
USERNAME="${2:-admin}"
PASSWORD="${3:-admin123}"

PASSED=0
FAILED=0
TOTAL=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# --- Utility Functions ---

assert_status() {
  local test_name="$1"
  local expected="$2"
  local actual="$3"
  TOTAL=$((TOTAL + 1))
  if [ "$actual" -eq "$expected" ]; then
    echo -e "${GREEN}✅ PASS${NC} [$test_name] → HTTP $actual (expected $expected)"
    PASSED=$((PASSED + 1))
  else
    echo -e "${RED}❌ FAIL${NC} [$test_name] → HTTP $actual (expected $expected)"
    FAILED=$((FAILED + 1))
  fi
}

assert_contains() {
  local test_name="$1"
  local expected="$2"
  local body="$3"
  TOTAL=$((TOTAL + 1))
  if echo "$body" | grep -q "$expected"; then
    echo -e "${GREEN}✅ PASS${NC} [$test_name] → body contains '$expected'"
    PASSED=$((PASSED + 1))
  else
    echo -e "${RED}❌ FAIL${NC} [$test_name] → body missing '$expected'"
    FAILED=$((FAILED + 1))
  fi
}

# --- Login ---

echo -e "${YELLOW}🔐 Logging in as $USERNAME...${NC}"
LOGIN_RESPONSE=$(curl -s -c cookies.txt -w "\n%{http_code}" \
  -X POST "$BASE_URL/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=$USERNAME&password=$PASSWORD")

LOGIN_STATUS=$(echo "$LOGIN_RESPONSE" | tail -1)
assert_status "Login" 200 "$LOGIN_STATUS"

if [ "$LOGIN_STATUS" -ne 200 ]; then
  echo -e "${RED}🔴 Login failed. Cannot continue.${NC}"
  exit 1
fi

echo ""
echo -e "${YELLOW}📡 Running API tests...${NC}"
echo "---"

# --- Test: Search All (BF1) ---
RESP=$(curl -s -b cookies.txt -w "\n%{http_code}" "$BASE_URL/api/v1/bene-banks")
STATUS=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
assert_status "BF1 - Search All" 200 "$STATUS"

# --- Test: Search with Filter ---
RESP=$(curl -s -b cookies.txt -w "\n%{http_code}" "$BASE_URL/api/v1/bene-banks?bankNameVn=test&status=ACTIVE")
STATUS=$(echo "$RESP" | tail -1)
assert_status "BF1 - Search Filter" 200 "$STATUS"

# --- Test: Create (BF2) ---
RESP=$(curl -s -b cookies.txt -w "\n%{http_code}" \
  -X POST "$BASE_URL/api/v1/bene-banks" \
  -H "Content-Type: application/json" \
  -d '{
    "bankCode": "TEST01",
    "bankNameVn": "Ngân hàng Test",
    "bankNameEn": "Test Bank",
    "shortName": "TESTBANK",
    "citadCode": "12345678",
    "napasCode": "123456",
    "logoUrl": "https://example.com/logo.png",
    "priority": 99
  }')
STATUS=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
assert_status "BF2 - Create" 201 "$STATUS"

# --- Test: Create Duplicate bankCode (BR2) ---
RESP=$(curl -s -b cookies.txt -w "\n%{http_code}" \
  -X POST "$BASE_URL/api/v1/bene-banks" \
  -H "Content-Type: application/json" \
  -d '{
    "bankCode": "TEST01",
    "bankNameVn": "Duplicate",
    "bankNameEn": "Duplicate",
    "shortName": "DUP",
    "citadCode": "99999999",
    "napasCode": "999999",
    "logoUrl": "https://example.com/dup.png",
    "priority": 98
  }')
STATUS=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
assert_status "BR2 - Duplicate bankCode" 400 "$STATUS"
assert_contains "BR2 - Error message" "đã tồn tại" "$BODY"

# --- Test: Create missing required fields ---
RESP=$(curl -s -b cookies.txt -w "\n%{http_code}" \
  -X POST "$BASE_URL/api/v1/bene-banks" \
  -H "Content-Type: application/json" \
  -d '{"bankCode": ""}')
STATUS=$(echo "$RESP" | tail -1)
assert_status "Validation - Missing fields" 400 "$STATUS"

# --- Test: Create without CITAD and NAPAS (BR9) ---
RESP=$(curl -s -b cookies.txt -w "\n%{http_code}" \
  -X POST "$BASE_URL/api/v1/bene-banks" \
  -H "Content-Type: application/json" \
  -d '{
    "bankCode": "TEST02",
    "bankNameVn": "No Codes Bank",
    "bankNameEn": "No Codes Bank",
    "shortName": "NOCODE",
    "logoUrl": "https://example.com/logo.png",
    "priority": 97
  }')
STATUS=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
assert_status "BR9 - Missing CITAD+NAPAS" 400 "$STATUS"
assert_contains "BR9 - Error message" "CITAD" "$BODY"

# --- Cleanup test data ---
echo ""
echo -e "${YELLOW}🧹 Cleaning up test data...${NC}"
# Delete test records if API supports it, or note for manual cleanup

# --- Summary ---
echo ""
echo "=================================="
echo -e "📊 Results: ${GREEN}$PASSED passed${NC}, ${RED}$FAILED failed${NC}, $TOTAL total"
echo "=================================="

# Cleanup
rm -f cookies.txt

if [ "$FAILED" -gt 0 ]; then
  exit 1
fi
```

---

## Step 4: Execute from Claude Code

Claude Code runs the script:

```bash
# Make executable and run
chmod +x .wiki/<name>/api/v1-tests.sh
bash .wiki/<name>/api/v1-tests.sh http://localhost:9010 admin admin123
```

---

## Step 5: Read Results

Parse the output:
- `✅ PASS` → test passed
- `❌ FAIL` → test failed with details
- Exit code 0 = all passed, 1 = has failures

---

## Integration with wf_ Commands

### `/wf_test` should:
1. Check if `.wiki/<name>/api/v1-tests.sh` exists
2. If not, generate it from SRS (reading fields, BRs, flows)
3. If yes, run it

### `/wf_verify` should:
1. Start the Spring Boot app if not running: `mvn spring-boot:run &`
2. Wait for app to be ready: `curl --retry 10 --retry-delay 2 http://localhost:9010/actuator/health`
3. Run `api-tests.sh`
4. Report results

---

## Mapping SRS → Test Cases

| SRS Section | Test Cases Generated |
|---|---|
| **BF1 (Search)** | Search all, search with each filter, empty result |
| **BF2 (Create)** | Create success, missing required fields, each BR violation |
| **BF3 (Update)** | Update success, update non-existent, each BR violation |
| **BF4 (Lock/Unlock)** | Lock active, unlock inactive, lock already locked |
| **BR1-BR10** | One negative test per business rule |
| **Error messages** | Verify exact error message text from SRS |

---

## Auth Presets (in config)

Store auth presets so tests don't need manual credentials:

```yaml
# .wiki/test-config.yml
environments:
  local:
    base_url: http://localhost:9010
    auth_type: session
    login_url: /api/v1/auth/login
    username: admin
    password: admin123
  dev:
    base_url: https://dev-bo.vietbank.vn
    auth_type: session
    login_url: /api/v1/auth/login
    username: test_user
    password: test_pass
```

Usage:
```bash
bash .wiki/<name>/api/v1-tests.sh        # defaults to local
bash .wiki/<name>/api/v1-tests.sh dev     # uses dev environment
```
