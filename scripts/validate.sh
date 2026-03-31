#!/bin/bash
# Dipesh Tutorials — Pre-Deployment Validation
# Run: ./scripts/validate.sh
# Exit 0 = pass, 1 = fail, 2 = warnings only

RED='\\033[0;31m'; GREEN='\\033[0;32m'; YELLOW='\\033[1;33m'; BLUE='\\033[0;34m'; BOLD='\\033[1m'; NC='\\033[0m'
PASS=0; FAIL=0; WARN=0

pass() { echo -e "  ${GREEN}✓${NC} $1"; PASS=$((PASS+1)); }
fail() { echo -e "  ${RED}✗${NC} $1"; FAIL=$((FAIL+1)); }
warn() { echo -e "  ${YELLOW}⚠${NC} $1"; WARN=$((WARN+1)); }
info() { echo -e "  ${BLUE}ℹ${NC} $1"; }
section() { echo -e "\n${BOLD}${BLUE}━━━ $1 ━━━${NC}"; }

cd "$(dirname "$0")/.."

# ── .env check ──
section "Environment Configuration"
if [ -f .env ]; then
    pass ".env exists"
    . .env 2>/dev/null
    if [ -n "$VITE_SUPABASE_URL" ] && [ "$VITE_SUPABASE_URL" != "https://YOUR_PROJECT_ID.supabase.co" ]; then
        pass "VITE_SUPABASE_URL is set"
    else
        fail "VITE_SUPABASE_URL not configured — copy .env.example → .env"
    fi
    if [ -n "$VITE_SUPABASE_ANON_KEY" ] && [ "$VITE_SUPABASE_ANON_KEY" != "your_anon_key_here" ]; then
        pass "VITE_SUPABASE_ANON_KEY is set"
    else
        fail "VITE_SUPABASE_ANON_KEY not configured"
    fi
else
    fail ".env missing — copy .env.example → .env and fill in values"
fi

# ── Supabase connectivity ──
section "Supabase Connectivity"
if [ -n "$VITE_SUPABASE_URL" ] && [ "$VITE_SUPABASE_URL" != "https://YOUR_PROJECT_ID.supabase.co" ]; then
    info "Pinging $VITE_SUPABASE_URL..."
    HTTP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 \
        "$VITE_SUPABASE_URL/rest/v1/" \
        -H "apikey: $VITE_SUPABASE_ANON_KEY" \
        -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY" 2>/dev/null || echo "000")
    if [ "$HTTP" = "200" ] || [ "$HTTP" = "400" ]; then
        pass "Supabase reachable (HTTP $HTTP)"
    else
        fail "Supabase unreachable (HTTP $HTTP) — check URL and project status"
    fi
else
    warn "Skipping Supabase check (.env not configured)"
fi

# ── File structure ──
section "File Structure"
check_file() { if [ -f "$1" ] || [ -d "$1" ]; then pass "$2"; else fail "$2 missing"; fi; }
check_file "src/lib/api.js"      "lib/api.js"
check_file "src/lib/supabase.js" "lib/supabase.js"
check_file "src/utils.js"        "utils.js"
check_file "supabase/schema.sql" "supabase/schema.sql"
check_file "supabase/seed.sql"   "supabase/seed.sql"
check_file "src/App.jsx"         "App.jsx"
check_file "src/pages/Login.jsx"  "Login.jsx"
check_file "src/pages/Dashboard.jsx" "Dashboard.jsx"
check_file "src/pages/Students.jsx"  "Students.jsx"
check_file "src/pages/Attendance.jsx" "Attendance.jsx"
check_file "src/pages/TestResults.jsx" "TestResults.jsx"
check_file "src/pages/Billing.jsx"   "Billing.jsx"
check_file "src/pages/Notifications.jsx" "Notifications.jsx"
check_file "src/pages/Resources.jsx"   "Resources.jsx"
check_file "src/pages/Analytics.jsx"   "Analytics.jsx"
check_file "src/pages/CourseMapping.jsx" "CourseMapping.jsx"
check_file "src/pages/UserManagement.jsx" "UserManagement.jsx"
check_file "android"   "android/ (Capacitor)"
check_file "ios"       "ios/ (Capacitor)"

# ── Forbidden imports ──
section "Forbidden Import Check"
found_bad=""
for pattern in "from '../data'" "DEMO_USERS" "MOCK_STUDENTS"; do
    result=$(grep -r "$pattern" src/ --include="*.js" --include="*.jsx" 2>/dev/null | grep -v firebase.js | grep -v node_modules || true)
    if [ -n "$result" ]; then
        fail "Forbidden: $pattern"
        echo "$result" | head -2 | while read line; do echo "    $line"; done
        found_bad=1
    fi
done
[ -z "$found_bad" ] && pass "No Firebase/mock data imports in src/"

# ── api.js coverage ──
section "API Coverage"
count=$(grep -c "^export async function\|^export function" src/lib/api.js 2>/dev/null || echo "0")
if [ "$count" -ge 30 ]; then
    pass "api.js has $count exported functions"
else
    warn "api.js has only $count functions — verify coverage is sufficient"
fi

# ── Build test ──
section "Build Test"
info "Running npm run build (~10s)..."
build_out=$(npm run build 2>&1)
if echo "$build_out" | grep -q "built in"; then
    bt=$(echo "$build_out" | grep "built in" | grep -oP '\\d+\\.\d+(?=s)' | tail -1)
    pass "Build succeeded${bt:+ (${bt}s)}"
    if echo "$build_out" | grep -qi "warning"; then
        wc=$(echo "$build_out" | grep -ci "warning" || echo "0")
        warn "$wc warning(s) — review before production deploy"
    fi
else
    fail "Build failed"
    echo "$build_out" | grep "error" | head -5 | while read l; do echo "    $l"; done
fi

# ── Git status ──
section "Git Status"
if git rev-parse --git-dir > /dev/null 2>&1; then
    uncomm=$(git status --porcelain 2>/dev/null | grep -v "^??" | wc -l)
    untrack=$(git status --porcelain 2>/dev/null | grep "^??" | wc -l)
    ahead=$(git status 2>/dev/null | grep "Your branch is ahead" | wc -l)
    [ "$uncomm" -gt "0" ] && warn "$uncomm uncommitted file(s) — commit before deploying" || pass "No uncommitted changes"
    [ "$untrack" -gt "0" ] && info "$untrack untracked file(s)"
    [ "$ahead" -gt "0" ] && info "Branch is ahead of remote"
else
    warn "Not a git repo — run: git init && git add . && git commit"
fi

# ── Summary ──
section "Summary"
TOTAL=$((PASS+FAIL+WARN))
echo -e "\n  ${GREEN}PASSED:  $PASS${NC}"
echo -e "  ${RED}FAILED:  $FAIL${NC}"
echo -e "  ${YELLOW}WARNINGS: $WARN${NC}"
echo ""
if [ "$FAIL" -gt 0 ]; then
    echo -e "${RED}${BOLD}  ━━━ STOP — Fix $FAIL failure(s) above ━━━${NC}"
    exit 1
elif [ "$WARN" -gt 0 ]; then
    echo -e "${YELLOW}${BOLD}  ━━━ WARNING — Review $WARN warning(s) above ━━━${NC}"
    exit 2
else
    echo -e "${GREEN}${BOLD}  ━━━ ALL CHECKS PASSED — Ready to deploy ━━━${NC}"
    exit 0
fi
