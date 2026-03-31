# Dipesh Tutorials — POC Test Checklist (50 Items)

**Test by:** Minimax agent → report every item  
**Test as:** superadmin → admin → student → parent (4 roles)  
**Expected time:** 45–90 minutes with Supabase running  

---

## SECTION A: Supabase Setup (Do First, 10 items)

> Run these in Supabase Dashboard (supabase.com → your project)

- [ ] **A1.** SQL Editor → ran `schema.sql` → got "Success. No rows returned"
- [ ] **A2.** SQL Editor → ran `seed.sql` → got "Success" (no errors)
- [ ] **A3.** Table Editor → `students` table → exactly 20 rows visible
- [ ] **A4.** Table Editor → `tests` table → 3 rows visible (Unit Test 1 for 8th, 9th, 10th)
- [ ] **A5.** Table Editor → `test_results` table → at least 9 rows (3 students × 3 subjects)
- [ ] **A6.** Table Editor → `profiles` table → superadmin profile exists with correct role
- [ ] **A7.** Storage → `resources` bucket exists and is PUBLIC
- [ ] **A8.** Authentication → Providers → Email → "Confirm email" is DISABLED
- [ ] **A9.** Settings → API → Project URL looks like `https://xxx.supabase.co`
- [ ] **A10.** Settings → API → anon key exists and starts with `eyJ`

---

## SECTION B: Website Deployment (5 items)

> Deploy to Vercel first, test from there

- [ ] **B1.** Vercel project shows "Ready" / "Live" status (green)
- [ ] **B2.** .env vars set: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` both present
- [ ] **B3.** Website URL loads without "Firebase" or "API key invalid" errors
- [ ] **B4.** No browser console errors on initial load (open DevTools → Console → refresh)
- [ ] **B5.** Login page shows correctly with logo, email + password fields

---

## SECTION C: Authentication — All 4 Roles (8 items)

> Test each role from a fresh incognito window

### superadmin
- [ ] **C1.** Login as superadmin → redirect to dashboard → name/role shown in top-right
- [ ] **C2.** Nav shows: Dashboard, Students, Attendance, Test Results, Billing, Notifications, Resources, Analytics, Course Mapping, User Accounts (all 10 links)

### admin
- [ ] **C3.** Login as admin → same nav as superadmin
- [ ] **C4.** Student can NOT see User Accounts link

### student
- [ ] **C5.** Login as student → nav shows: Dashboard, Resources, Notifications, Course Mapping
- [ ] **C6.** Student CANNOT see: Students, Attendance, Test Results, Billing, Analytics, User Accounts

### parent
- [ ] **C7.** Login as parent → nav shows: Dashboard, Billing, Notifications
- [ ] **C8.** Parent CANNOT see admin-only pages; sees only their linked child's data

---

## SECTION D: Dashboard — Role-Specific (6 items)

> Login as each role and verify dashboard content

- [ ] **D1.** superadmin dashboard: Total Students count (should be 20), attendance %, revenue chart visible
- [ ] **D2.** admin dashboard: same metrics as superadmin, no revenue chart (admin sees fee status chart)
- [ ] **D3.** student dashboard: personal attendance %, personal test average, own name + standard shown
- [ ] **D4.** parent dashboard: child's name + standard shown, child's attendance %, child's test average
- [ ] **D5.** student dashboard → weak topics section shows correct subjects (English = 65% avg → weak)
- [ ] **D6.** superadmin dashboard → revenue vs expenses line chart visible

---

## SECTION E: Students Page (7 items)

- [ ] **E1.** All 20 students visible in table (paginated or all on one page)
- [ ] **E2.** Search by name → typing filters table in real-time
- [ ] **E3.** Filter by Standard → 8th/9th/10th/11th Commerce/etc. → table filters correctly
- [ ] **E4.** Filter by Fee Status → paid/pending/overdue → badge colors correct
- [ ] **E5.** Add Student → fill all fields → Save → student appears in table immediately
- [ ] **E6.** Edit Student → change name → Save → name updates in table
- [ ] **E7.** Delete Student → click delete → confirm → student removed from table

---

## SECTION F: Attendance Page (5 items)

- [ ] **F1.** Page loads with today's date selected, student list shows for default standard
- [ ] **F2.** Change date → student list updates for that date
- [ ] **F3.** Mark P/L/A for 3 students → Save → success toast appears
- [ ] **F4.** Reload page → same students show same P/L/A status (persisted in DB)
- [ ] **F5.** View Attendance tab → date picker + standard → shows correct present/late/absent counts

---

## SECTION G: Test Results Page (5 items)

- [ ] **G1.** Enter Marks tab → select 8th Standard + Mathematics → 3 students shown
- [ ] **G2.** Enter marks for student 1 (e.g. 85/100) → Save → success toast
- [ ] **G3.** View Results tab → Unit Test 1 → shows marks with correct grade computed
- [ ] **G4.** Grade display: 90+ = A+, 75+ = A, 60+ = B+, 50+ = B, 35+ = C, <35 = F
- [ ] **G5.** Analytics sub-tab → class average, highest, lowest all show non-zero values

---

## SECTION H: Billing Page (4 items)

- [ ] **H1.** Fee records visible per student with total/paid/balance columns
- [ ] **H2.** Record Payment → select student → enter amount → Save → balance updates
- [ ] **H3.** Paid student shows green "paid" badge, overdue shows red "overdue" badge
- [ ] **H4.** Export as PDF → PDF downloads with correct student names and amounts

---

## SECTION I: Notifications Page (3 items)

- [ ] **I1.** Notifications list visible with title, message, time, read/unread indicator
- [ ] **I2.** Compose → enter title + message + select role(s) → Send → notification appears in list
- [ ] **I3.** Log in as student in incognito → notification from admin visible in their dashboard

---

## SECTION J: Resources Page (2 items)

- [ ] **J1.** Resources list visible with title, type badge (PDF/Video/MCQ), standard tag
- [ ] **J2.** Upload button → select file → choose type + standard → Save → resource appears in list

---

## SECTION K: Course Mapping (2 items)

- [ ] **K1.** Select student → weak topics section shows subjects/topics below 50% from last test
- [ ] **K2.** Improvement suggestions show relevant resource recommendations

---

## SECTION L: User Management (2 items, superadmin only)

- [ ] **L1.** Create User → enter name, email, password, role → Create → user appears in list
- [ ] **L2.** Deactivate User → user turns inactive → deactivated user cannot log in

---

## SECTION M: Offline & Error Handling (3 items)

- [ ] **M1.** Disconnect Wi-Fi → reload page → offline banner appears at top
- [ ] **M2.** Reconnect Wi-Fi → offline banner disappears
- [ ] **M3.** Trigger a slow network error → "Request timed out" toast appears (within ~15s)

---

## SECTION N: Final Verification (3 items)

- [ ] **N1.** APK build: `npx cap sync android && cd android && ./gradlew assembleDebug` succeeds
- [ ] **N2.** APK installs on Android phone and opens without crashing
- [ ] **N3.** Login works in APK with Supabase credentials

---

## How to Report Results

For each section, copy the section into your agent chat and mark every item:

```
## SECTION A: Supabase Setup
✅ A1. schema.sql ran successfully
❌ A2. seed.sql failed — error: "..."
...
```

**Fail anything → STOP and report.** Do not skip broken items and claim the system works.

---

*Last updated: March 31, 2026*
