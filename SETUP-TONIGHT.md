# Dipesh Tutorials — Setup Tonight

**Purpose:** Get Dipesh Tutorials from git clone to fully deployed + APK in one session.  
**Time:** ~60 minutes.  
**Audience:** You (Minimax agent) executing commands.  

---

## BEFORE ANYTHING — Run Validation

```bash
cd Dipesh-Tutorials
./scripts/validate.sh
```

This checks: .env setup, Supabase connectivity, file structure, forbidden imports, build.  
**Do not proceed until it passes.** Fix whatever it reports first.

---

## STEP 1: Create Supabase Project (5 min)

1. Go to https://supabase.com → New Project
   - Name: `dipesh-tutorials`
   - Password: save it — needed for direct DB access
   - Region: **Mumbai (ap-south-1)**
2. Wait ~2 min for provisioning
3. Go to **Settings → API** → copy **Project URL** and **anon public key** now — you need them for Step 3

## STEP 2: Configure Auth (2 min)

1. Left sidebar → **Authentication** → **Providers** → **Email**
2. **DISABLE "Confirm email"** ← CRITICAL. Without this, admin-created users can't log in
3. Save

## STEP 3: Create .env File (1 min)

In the project root:
```bash
cp .env.example .env
# Then edit .env and fill in your real values from Step 1:
# VITE_SUPABASE_URL=https://your-project-id.supabase.co
# VITE_SUPABASE_ANON_KEY=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

## STEP 4: Run Schema (3 min)

1. Supabase Dashboard → **SQL Editor** → New Query
2. Paste entire contents of `supabase/schema.sql`
3. Click **Run** → "Success. No rows returned" = correct
4. Verify: Table Editor shows 12 tables (profiles, standards, subjects, students, fee_structures, fee_payments, attendance, tests, test_results, notifications, notification_reads, resources)

## STEP 5: Run Seed Data (3 min)

1. **SQL Editor** → New Query (second tab)
2. Paste entire contents of `supabase/seed.sql`
3. Click **Run**
4. Verify: Table Editor → `students` → 20 rows visible

## STEP 6: Create Storage Bucket (1 min)

1. Left sidebar → **Storage** → **New Bucket**
2. Name: `resources` → toggle **Public bucket: ON** → Create

## STEP 7: Create Superadmin (3 min)

1. **Authentication** → **Users** → **Add User**
   - Email: dipesh@dipeshtutorials.com (or your real email)
   - Password: set a strong password — this is the master account
2. **SQL Editor** → run:
```sql
UPDATE profiles SET role = 'superadmin', name = 'Dipesh Sir'
WHERE email = 'dipesh@dipeshtutorials.com';
```

## STEP 8: Run Validation Again (1 min)

```bash
./scripts/validate.sh
```

This time it will check Supabase connectivity with real credentials.  
If Supabase check fails: verify project is not paused and API keys are correct in .env.

## STEP 9: Deploy to Vercel (10 min)

1. Push to GitHub:
```bash
git init && git add . && git commit -m "Dipesh Tutorials v2.0"
git remote add origin https://github.com/YOUR_ACCOUNT/dipesh-tutorials.git
git push -u origin main
```
2. Go to https://vercel.com → New Project → import `dipesh-tutorials`
3. Framework: **Vite**
4. Environment Variables (add both):
   - `VITE_SUPABASE_URL` = your Project URL from Step 1
   - `VITE_SUPABASE_ANON_KEY` = your anon key from Step 1
5. **Deploy** → wait ~1 min → live URL shown

## STEP 10: Build Android APK (15 min)

Prerequisites: Android Studio installed, Java 17+

```bash
npm run build
npx cap sync android
npx cap open android
```

In Android Studio:
1. Wait for Gradle sync (first time: 2–3 min)
2. **Build → Generate Signed Bundle / APK → APK**
3. **release** build type → Create
4. APK at: `android/app/build/outputs/apk/release/app-release.apk`
5. Transfer to Dipesh Sir's phone

## STEP 11: Verify Deployment (5 min)

Open the Vercel URL and login as superadmin. Check all 4 roles work:

| Role | Email | What to verify |
|------|-------|----------------|
| superadmin | dipesh@dipeshtutorials.com | All 10 nav items visible |
| admin | admin@demo.com | All 10 nav items, no revenue chart |
| student | student@demo.com | Only 4 items, personal scores |
| parent | parent@demo.com | Only 3 items, child's data |

## What to Demo to Dipesh Sir

1. Admin dashboard — student count, attendance %, fee chart at a glance
2. Add a student — Students → Add Student → fill form → Save
3. Mark today's attendance — Attendance → Mark Attendance → P/L/A → Save
4. Enter test marks — Test Results → Enter Marks → type scores → Save
5. Send notification to all parents — Notifications → Compose → Send
6. Record a fee payment — Billing → find student → Record Payment
7. Parent login (incognito) — show child-specific dashboard on phone
8. Install the APK on phone — same experience, works offline indicator

## Monthly Cost: ₹0

Everything on free tiers. No credit card needed.

## Troubleshooting

| Symptom | Fix |
|--------|-----|
| "Confirm email" error on login | Go to Supabase Auth → Providers → Email → disable "Confirm email" |
| "Invalid API key" on website | Check .env has correct VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY |
| Seed data missing | Re-run seed.sql in SQL Editor |
| APK crashes on open | Run `npx cap sync android` again, then rebuild |
| Offline banner always shows | Check network connection; Supabase project not paused |
| Login loops infinitely | Check Auth settings in Supabase; disable email confirmation |

---

*Last updated: March 31, 2026 — validated against current main branch*