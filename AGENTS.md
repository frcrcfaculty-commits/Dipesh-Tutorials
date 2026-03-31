# Dipesh Tutorials — Agent Notes

## Project
Coaching class management platform. GitHub: `frcrcfaculty-commits/Dipesh-Tutorials`

## Architecture (DO NOT CHANGE)
- Frontend: React 19 + Vite + React Router (HashRouter)
- Backend: Supabase (PostgreSQL + Auth + Storage + RLS) — NOT Firebase
- Mobile: Capacitor (Android + iOS)
- PDF: jsPDF + jspdf-autotable
- Styling: Navy #0A2351 + Gold #B6922E, Outfit/Inter fonts

## CRITICAL Rules
- NEVER add `data.js`, `firebase.js`, `DEMO_USERS`, or mock data back
- All data MUST come from `src/lib/api.js` (34 Supabase query functions)
- All auth MUST go through `src/App.jsx` via `supabase.auth.signInWithPassword`
- NEVER call `supabase.from()` directly inside page components (except UserManagement for auth)
- Keep the navy/gold design system

## What's Done
- All 11 pages fully wired to Supabase via api.js
- Real auth (Supabase Auth)
- Student CRUD, Attendance P/L/A, Test marks, Fee payments, Notifications, Resources
- PDF + CSV export
- UserManagement with create/link/deactivate
- Capacitor Android + iOS projects
- Complete schema.sql (12 tables, 18+ RLS policies, triggers, indexes)
- Seed data (20 students, test marks, attendance, fees)
- Error handling + timeouts (withTimeout utility, 15s defaults)
- Offline detection banner
- Real attendance % and fee status in PDF exports (getStudentStats + getFeeSummary)
- Two-query approach for getAttendanceByDate (avoids PostgREST embedded join edge case)
- Improved uploadFile error (detects missing storage bucket)

## Known Issues (Testing Needed)
1. **RLS Policies** — Expanded in hardening commit. Still needs testing against real auth (especially attendance, test_results queries for parents/students).
2. **PDF Report Data Mapping** — Attendance % now shows real data (getStudentStats). Fee status from feeSummary. Was "—" before hardening.
3. **Android APK** — Not tested on a real device.
4. **CourseMapping weak topic logic** — Uses last test only; may need refinement for students with no tests.
5. **Loading states** — All pages now have try/catch + showToast. Generally robust now.

## Key Files
- `src/lib/api.js` — 36 Supabase query functions (source of truth)
- `src/lib/supabase.js` — Supabase client
- `src/utils.js` — withTimeout, exportCSV, showToast utilities
- `supabase/schema.sql` — DB schema with RLS
- `supabase/seed.sql` — Demo data
- `src/pages/*.jsx` — All page components (Supabase-only imports)

## Setup for POC Demo
1. Create Supabase project (Mumbai region)
2. Run `schema.sql` then `seed.sql`
3. Disable email confirmation in Auth settings
4. Create "resources" storage bucket (public)
5. Deploy to Vercel with env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
6. Build APK: `npx cap sync android && cd android && ./gradlew assembleDebug`
