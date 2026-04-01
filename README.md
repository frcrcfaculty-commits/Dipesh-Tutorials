# Dipesh Tutorials

Education management platform for coaching classes.

**Tech Stack:** React + Vite + Supabase + Capacitor (Android/iOS)

## Features
- Student management (add, edit, delete)
- Attendance marking with present/late/absent
- Test marks entry with auto-grading
- Fee tracking & payment recording
- Notifications (targeted by role/standard)
- Resource hub with file uploads
- Analytics dashboards (parent, student, admin, superadmin views)
- User account management (create, link, deactivate)
- 4 roles: Super Admin, Admin, Student, Parent

## Quick Start

```bash
npm install
cp .env.example .env
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env
npm run dev
```

## Deployment

See [SETUP-TONIGHT.md](SETUP-TONIGHT.md) for step-by-step instructions.

## Database Setup

1. Create a Supabase project at https://supabase.com (Mumbai region recommended)
2. Go to SQL Editor → run `supabase/schema.sql`
3. Then run `supabase/seed.sql` (optional — loads demo data)
4. In Auth settings: disable "Confirm email" so admin can create accounts directly
5. Create a Storage bucket named `resources` (public)

## Pre-Deployment Validation

```bash
bash scripts/validate.sh
```

This checks 24 items including build, imports, env vars, and schema setup.

## Mobile App (Android)

```bash
# Build web app
npm run build

# Sync to Android
npx cap sync android

# Open in Android Studio
npx cap open android

# Or build APK directly
cd android && ./gradlew assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk
```

For step-by-step Android build instructions, see [ANDROID-BUILD.md](ANDROID-BUILD.md).

## For Beta Testers

See these files for rollout materials:
- [DIPESH-SIR-GUIDE.md](DIPESH-SIR-GUIDE.md) — 1-page quick start for Dipesh Sir
- [BETA-TESTER-MESSAGES.md](BETA-TESTER-MESSAGES.md) — WhatsApp message templates
- [FEEDBACK-FORM.md](FEEDBACK-FORM.md) — Google Forms feedback structure

## Architecture

- Frontend: React 19 + Vite + React Router (HashRouter)
- Backend: Supabase (PostgreSQL + Auth + Storage + RLS)
- Mobile: Capacitor (Android + iOS)
- PDF reports: jsPDF + jspdf-autotable
- All API calls via `src/lib/api.js` (never call Supabase directly from pages)

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/api.js` | 36 Supabase query functions |
| `src/lib/supabase.js` | Supabase client |
| `src/utils.js` | Utilities (withTimeout, exportCSV, showToast) |
| `supabase/schema.sql` | DB schema with RLS policies |
| `supabase/seed.sql` | Demo data |
| `scripts/validate.sh` | Pre-deployment validation |

## Environment Variables

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```
