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
- Complete schema.sql (12 tables, 18 RLS policies, triggers, indexes)
- Seed data (20 students, test marks, attendance, fees)

## Known Issues (Testing Needed)
1. **RLS Policies** — Never tested against real auth. May block legitimate queries for some roles.
2. **getAttendanceByDate** — Uses PostgREST `!left` embed syntax. Filter `.eq('attendance.date', date)` on outer join may behave unexpectedly when no records exist.
3. **PDF Report Data Mapping** — Student PDF report shows "—" for attendance % because computing it requires additional query.
4. **Loading/Error States** — Some pages show blank if a query fails. Add try/catch with toast + retry.
5. **Mobile** — Not tested on real Android device.

## Key Files
- `src/lib/api.js` — All 34 query functions (source of truth)
- `src/lib/supabase.js` — Supabase client
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
