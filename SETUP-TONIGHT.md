# Dipesh Tutorials — Setup Guide (Do This Tonight)

Total time: ~45 minutes if you follow exactly.

---

## STEP 1: Create Supabase Project (5 min)

1. Go to https://supabase.com → sign up / login
2. "New Project"
   - Name: `dipesh-tutorials`
   - Password: (save this — you need it for direct DB access)
   - Region: **South Asia (Mumbai)** — ap-south-1
3. Wait 2 minutes for provisioning

## STEP 2: Configure Auth (2 min)

1. Left sidebar → **Authentication** → **Providers** → **Email**
2. **DISABLE "Confirm email"** ← CRITICAL. Without this, created users can't log in.
3. Save

## STEP 3: Run Schema (3 min)

1. Left sidebar → **SQL Editor**
2. Click "New Query"
3. Paste ENTIRE contents of `supabase/schema.sql`
4. Click **Run** — should say "Success. No rows returned" (that's correct)

## STEP 4: Run Seed Data (2 min)

1. New query in SQL Editor
2. Paste ENTIRE contents of `supabase/seed.sql`
3. Click **Run**
4. Verify: go to Table Editor → `students` table → should see 20 rows

## STEP 5: Create Storage Bucket (1 min)

1. Left sidebar → **Storage**
2. "New Bucket" → name: `resources` → toggle "Public bucket" ON → Create

## STEP 6: Create Superadmin Account (3 min)

1. Left sidebar → **Authentication** → **Users** → "Add User"
   - Email: dipesh@dipeshtutorials.com (or whatever Dipesh Sir uses)
   - Password: set a strong one, share it with him
   - Click "Create User"
2. Go to **SQL Editor**, run:
   ```sql
   UPDATE profiles SET role = 'superadmin', name = 'Dipesh Sir'
   WHERE email = 'dipesh@dipeshtutorials.com';
   ```

## STEP 7: Get API Keys (1 min)

1. Left sidebar → **Settings** → **API**
2. Copy **Project URL** (looks like https://abcdef.supabase.co)
3. Copy **anon/public key** (long string starting with eyJ...)

## STEP 8: Create .env File (1 min)

In the project root, create `.env`:
```
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your_anon_key_here
```

## STEP 9: Deploy Website to Vercel (10 min)

1. Push to GitHub:
   ```bash
   cd dipesh-production
   git init && git add . && git commit -m "Dipesh Tutorials v2"
   git remote add origin https://github.com/YOUR_ACCOUNT/dipesh-tutorials.git
   git push -u origin main
   ```
2. Go to https://vercel.com → sign in with GitHub
3. "Add New" → "Project" → import `dipesh-tutorials`
4. Framework: **Vite**
5. Environment Variables (click "Add"):
   - `VITE_SUPABASE_URL` = your URL from step 7
   - `VITE_SUPABASE_ANON_KEY` = your key from step 7
6. Click **Deploy**
7. Wait ~1 min. Your website is live at `https://dipesh-tutorials-xxx.vercel.app`

## STEP 10: Build Android APK (15 min)

**Prerequisites**: Android Studio installed, Java 17+

```bash
cd dipesh-production
npm run build          # rebuilds with real Supabase credentials from .env
npx cap sync android   # copies build to Android project
npx cap open android   # opens Android Studio
```

In Android Studio:
1. Wait for Gradle sync to finish (first time takes 2-3 min)
2. Menu → **Build** → **Generate Signed Bundle / APK**
3. Choose **APK**
4. Create new keystore:
   - Path: anywhere safe (DO NOT LOSE THIS FILE)
   - Password: something strong
   - Key alias: `dipesh`
5. Select **release** build type
6. Click "Create"
7. APK is at: `android/app/build/outputs/apk/release/app-release.apk`
8. Send this APK to Dipesh Sir's phone via WhatsApp/email/Drive

## STEP 11: First Login & Verify (5 min)

1. Open the Vercel URL in browser
2. Login as: dipesh@dipeshtutorials.com / (password you set)
3. Check:
   - Dashboard shows 20 students, attendance %, fee chart ✓
   - Students page shows all 20 students ✓
   - Attendance page → pick a date → see student list ✓
   - Test Results → View tab → see Unit Test 1 marks ✓
   - Notifications → 4 seeded notifications ✓
   - User Accounts → create a test parent account ✓
   - Login as that parent in incognito → verify dashboard shows child data ✓

## STEP 12: Create Real User Accounts

For the POC beta testers:
1. Go to User Accounts page (logged in as superadmin)
2. Click "Create User" for each beta tester
3. Set role (student/parent/admin)
4. After creation, click "Link" to connect parent→student or student→record
5. Share credentials with beta testers

---

## What to Demo to Dipesh Sir

1. "Here's your admin dashboard — student count, attendance, fee collection at a glance"
2. "Add a new student" → Students → Add Student → fill form → Save
3. "Mark today's attendance" → Attendance → Mark Attendance → click P/L/A → Save
4. "Enter test marks" → Test Results → Enter Marks tab → select standard/subject → type marks → Save
5. "Send a notification to all parents" → Notifications → Compose → type message → Send
6. "Record a fee payment" → Billing → find student → Record Payment
7. "Parents see this on their phone" → log in as parent → show dashboard with child's scores
8. "Install the app" → send APK → install → same experience native on phone

---

## Monthly Cost: ₹0

Everything is on free tiers. No credit card needed for any of the above.
